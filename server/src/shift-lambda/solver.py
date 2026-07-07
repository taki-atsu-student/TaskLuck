from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
from ortools.sat.python import cp_model

app = FastAPI()

class ReqSlot(BaseModel):
    slot: int
    required_pax: int

class StaffSubmission(BaseModel):
    user_id: str
    available_slots: List[int]

# スタッフ個人の制限ルールを定義する型を追加
class StaffLimits(BaseModel):
    user_id: str
    max_slots_per_week: int  # 扶養内なら低く、扶養外なら高くNode.js側で設定して渡す

class ShopRules(BaseModel):
    max_consecutive_days: int
    max_hours_per_day: int

class ShiftInput(BaseModel):
    slots: List[int]
    days: List[str]
    slots_per_day: int
    requirements: List[ReqSlot]
    submissions: List[StaffSubmission]
    staff_ids: List[str]
    staff_limits: List[StaffLimits]  # スタッフごとの上限リストを追加
    rules: ShopRules

def optimize_shift_internal(data: ShiftInput):
    model = cp_model.CpModel()
    
    # 1. 変数定義
    shifts = {}
    for s in data.staff_ids:
        for t in data.slots:
            shifts[(s, t)] = model.NewBoolVar(f'shift_{s}_{t}')
            
    # 2. ハード制約: 必要人数（人手不足で落ちないように必要人数「以上（>=）」に緩和すると実用的）
    for req in data.requirements:
        model.Add(sum(shifts[(s, req.slot)] for s in data.staff_ids) >= req.required_pax)
        
    # 3. ハード制約: 希望外ブロック
    sub_dict = {sub.user_id: set(sub.available_slots) for sub in data.submissions}
    for s in data.staff_ids:
        for t in data.slots:
            if t not in sub_dict.get(s, set()):
                model.Add(shifts[(s, t)] == 0)

    # 4. 新機能: 個人の扶養制約に基づく個別上限（週/月）を適用
    limit_dict = {lim.user_id: lim.max_slots_per_week for lim in data.staff_limits}
    for s in data.staff_ids:
        max_allowed = limit_dict.get(s, 999) # 設定がなければ制限なし
        model.Add(sum(shifts[(s, t)] for t in data.slots) <= max_allowed)

    # 5. 店舗全体の制約: 1日の最大連続勤務
    # 各スタッフについて、連続して勤務する日数を制限
    for s in data.staff_ids:
        for day_idx in range(len(data.days) - data.rules.max_consecutive_days):
            # 連続する max_consecutive_days + 1 日のうち、少なくとも1日は休み
            consecutive_days = []
            for i in range(data.rules.max_consecutive_days + 1):
                day = data.days[day_idx + i]
                day_slots = [t for t in data.slots if (t - 1) // data.slots_per_day == day_idx + i]
                for slot in day_slots:
                    consecutive_days.append(shifts[(s, slot)])
            if consecutive_days:
                model.Add(sum(consecutive_days) <= data.rules.max_consecutive_days * data.slots_per_day)
    
    # 6. 店舗全体の制約: 1日の最大勤務時間
    for s in data.staff_ids:
        for day_idx in range(len(data.days)):
            day_slots = [t for t in data.slots if (t - 1) // data.slots_per_day == day_idx]
            if day_slots:
                # 1日のシフト数を制限（簡易的に時間制限として扱う）
                model.Add(sum(shifts[(s, t)] for t in day_slots) <= data.rules.max_hours_per_day)

    # 7. 目的関数: 希望シフトの最大化（不満足度の最小化）
    total_dissatisfaction = 0
    for sub in data.submissions:
        s = sub.user_id
        for t in sub.available_slots:
            total_dissatisfaction += (1 - shifts[(s, t)])
    model.Minimize(total_dissatisfaction)

    # 8. 実行
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        result_shifts = []
        for s in data.staff_ids:
            assigned_slots = [t for t in data.slots if solver.Value(shifts[(s, t)]) == 1]
            if assigned_slots:
                result_shifts.append({
                    "user_id": s,
                    "assigned_slots": assigned_slots
                })
        return {"status": "success", "data": result_shifts}
    else:
        return {"status": "unfeasible", "message": "条件に合うシフトを作成できませんでした"}

@app.post("/optimize")
def optimize_shift(data: ShiftInput):
    return optimize_shift_internal(data)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
