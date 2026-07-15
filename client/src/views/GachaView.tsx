import { type ReactNode } from 'react';
import { GachaLog, Task } from '../models';

type GachaViewProps = {
  isActive: boolean;
  gLog: GachaLog[];
  handleGacha: () => void;
  handleCompleteGachaTask: () => void;
  gachaTaskVal: Task | undefined;
  gachaLock: boolean;
};

export function GachaView({ isActive, gLog, handleGacha, handleCompleteGachaTask, gachaTaskVal, gachaLock }: GachaViewProps) {
  const pullTotal = gLog.length;
  const pullLast = gLog.length ? gLog[gLog.length - 1].name : '—';

  return (
    <div className={`page ${isActive ? 'show' : ''}`} id="pg-gacha">
      <div className="ph"><div><div className="pt">闇鍋ガチャ</div><div className="ps">ランダムにタスクが割り当てられます</div></div></div>
      <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
          {gachaTaskVal && gachaTaskVal.st === 'review' ? (
            <div>
              <div className="mb-6">
                <div className="inline-block bg-yellow-50 border border-yellow-300 rounded-full px-4 py-2 mb-4">
                  <span className="text-sm text-yellow-600">
                    承認待ち
                  </span>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-3">{gachaTaskVal.name}</h2>
              <p className="text-gray-600 text-sm mb-6">{gachaTaskVal.desc}</p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-xs text-gray-500 mb-1">予定XP</div>
                <div className="text-3xl font-bold text-purple-600">+{gachaTaskVal.xp || 0} XP</div>
              </div>
              <p className="text-sm text-gray-500">店長の承認をお待ちください</p>
            </div>
          ) : gachaTaskVal ? (
            <div>
              <div className="mb-6">
                <div className="inline-block bg-purple-50 border border-purple-200 rounded-full px-4 py-2 mb-4">
                  <span className="text-sm text-purple-600">
                    進行中
                  </span>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-3">{gachaTaskVal.name}</h2>
              <p className="text-gray-600 text-sm mb-6">{gachaTaskVal.desc}</p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-xs text-gray-500 mb-1">予定XP</div>
                <div className="text-3xl font-bold text-purple-600">+{gachaTaskVal.xp || 0} XP</div>
              </div>
              <button
                onClick={handleCompleteGachaTask}
                className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={gachaLock}
              >
                タスク完了
              </button>
            </div>
          ) : (
            <div>
              <div className="text-6xl mb-4">🍲</div>
              <h2 className="text-2xl font-bold mb-2">闇鍋ガチャ</h2>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                タスクから何が飛び出すかは運次第...
                <br />
                ガチャを回してタスクを引き当てよう！
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-full px-4 py-2 inline-flex items-center gap-2 mb-6">
                <span className="text-sm text-gray-600">
                  総回数: <span className="font-bold text-purple-600">{pullTotal}</span>
                </span>
              </div>
              <div className="mb-6">
                <div className="text-xs text-gray-500 mb-2">最後の結果</div>
                <div className="text-lg font-bold text-purple-600">{pullLast}</div>
              </div>
              <button
                onClick={handleGacha}
                disabled={gachaLock}
                className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-12 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {gachaLock ? '処理中...' : 'ガチャを回す'}
              </button>
            </div>
          )}
        </div>
        {gLog.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">ガチャ履歴</h3>
              <p className="text-xs text-gray-500 mt-1">{gLog.length}件</p>
            </div>
            <div className="divide-y divide-gray-200">
              {gLog.slice().reverse().slice(0, 8).map((entry, index) => (
                <div key={`${entry.name}-${index}`} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                  <div className="w-1 h-12 bg-purple-100 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                    <p className="text-xs text-gray-500">{entry.time ?? ''}</p>
                  </div>
                  <div className="text-lg font-bold text-purple-600">+{entry.xp} XP</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
