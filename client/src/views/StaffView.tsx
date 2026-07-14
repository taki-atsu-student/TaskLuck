import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { User, ExtraWage, resolveUserRole } from '../models';

const ROLE_LABELS: Record<string, string> = {
  manager: '店長',
  staff: '社員',
  part: 'アルバイト',
};

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #ddd', borderRadius: '8px',
  padding: '7px 10px', fontSize: '13px', boxSizing: 'border-box',
};

type StaffViewProps = {
  isActive: boolean;
  users: User[];
  setUsers: Dispatch<SetStateAction<User[]>>;
  staffStats: { total: number; partCount: number; staffCount: number };
  onOpenStaffModal: () => void;
};

export function StaffView({ isActive, users, setUsers, staffStats, onOpenStaffModal }: StaffViewProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editSalary, setEditSalary] = useState(0);
  const [editExtraWages, setEditExtraWages] = useState<ExtraWage[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      setEditName(selectedUser.name);
      setEditPassword(selectedUser.password);
      setEditSalary(
        selectedUser.role === 'part'
          ? (selectedUser.hourlyWage ?? 0)
          : (selectedUser.monthlySalary ?? 0)
      );
      setEditExtraWages(selectedUser.extraWages ? [...selectedUser.extraWages] : []);
      setShowPassword(false);
    }
  }, [selectedUser]);

  const lv = (xp: number) => Math.floor(xp / 100) + 1;
  const xpProgress = (xp: number) => xp % 100;

  const addExtraWage = () => {
    const newId = editExtraWages.length > 0
      ? Math.max(...editExtraWages.map((w) => w.id)) + 1
      : 1;
    setEditExtraWages((prev) => [...prev, { id: newId, title: '', amount: 0, _new: true }]);
  };

  const updateExtraWage = (id: number, field: 'title' | 'amount', value: string | number) => {
    setEditExtraWages((prev) => prev.map((w) =>
      w.id === id ? { ...w, [field]: value } : w
    ));
  };

  const removeExtraWage = (id: number) => {
    setEditExtraWages((prev) => prev.filter((w) => w.id !== id));
  };

  const handleSave = () => {
    if (!selectedUser) return;
    const validExtras = editExtraWages
      .filter((w) => w.title.trim() !== '')
      .map(({ _new, ...rest }) => rest);
    const salaryFields = selectedUser.role === 'part'
      ? { hourlyWage: editSalary, extraWages: validExtras, monthlySalary: selectedUser.monthlySalary }
      : { monthlySalary: editSalary, hourlyWage: selectedUser.hourlyWage, extraWages: selectedUser.extraWages };
    const trimmedName = editName.trim() || selectedUser.name;
    setUsers((prev) => prev.map((u) =>
      u.id === selectedUser.id
        ? { ...u, name: trimmedName, ini: trimmedName.charAt(0), password: editPassword, ...salaryFields }
        : u
    ));
    setSelectedUser(null);
  };

  return (
    <div className={`page ${isActive ? 'show' : ''}`} id="pg-staff">
      <div className="ph">
        <div><div className="pt">スタッフ管理</div></div>
        <button className="btn btn-dark" type="button" onClick={onOpenStaffModal}>+ スタッフ追加</button>
      </div>
      <div className="stats" id="ss">
        <div className="sc"><div className="sl">総スタッフ</div><div className="sv">{staffStats.total}</div></div>
        <div className="sc"><div className="sl">社員</div><div className="sv">{staffStats.staffCount}</div></div>
        <div className="sc"><div className="sl">アルバイト</div><div className="sv">{staffStats.partCount}</div></div>
      </div>
      <div className="card">
        <table className="tbl" id="sstbl">
          <thead>
            <tr>
              <th>名前</th>
              <th>役割</th>
              <th>XP</th>
              <th>レベル</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const resolvedRole = resolveUserRole(user);
              const roleBadge = resolvedRole === 'manager' ? <span className="b b-gray">店長</span> : resolvedRole === 'staff' ? <span className="b b-blue">社員</span> : <span className="b b-gray">アルバイト</span>;
              return (
                <tr
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="sb-avatar">{user.ini}</div>
                      <span style={{ fontWeight: 500 }}>{user.name}</span>
                    </div>
                  </td>
                  <td>{roleBadge}</td>
                  <td style={{ fontSize: '13px' }}>{user.xp} XP</td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>Lv.{lv(user.xp)}</div>
                    <div className="xp-wrap" style={{ width: '80px' }}><div className="xp-bar" style={{ width: `${xpProgress(user.xp)}%` }} /></div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedUser(null); }}
        >
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '28px 32px',
            width: '400px', maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 12px 40px rgba(0,0,0,.18)',
          }}>
            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%', background: '#e8e8ed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: 700, color: '#444',
              }}>
                {selectedUser.ini}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ fontSize: '17px', fontWeight: 700, border: '1px solid #ddd', borderRadius: '8px', padding: '4px 8px', width: '100%', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>{ROLE_LABELS[selectedUser.role] ?? selectedUser.role}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
              <InfoRow label="ユーザーID" value={String(selectedUser.id)} />
              <InfoRow label="役割" value={ROLE_LABELS[selectedUser.role] ?? selectedUser.role} />

              {/* password */}
              <div>
                <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '4px' }}>パスワード</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#86868b', padding: '4px' }}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {/* salary */}
              <div>
                <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '4px' }}>
                  {selectedUser.role === 'part' ? '時給（円）' : '月給（円）'}
                </div>
                <input
                  type="number"
                  value={editSalary}
                  min={0}
                  step={selectedUser.role === 'part' ? 50 : 10000}
                  onChange={(e) => setEditSalary(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>

              {/* saved extra wages (part-time only) */}
              {selectedUser.role === 'part' && editExtraWages.filter((w) => !w._new).map((w) => (
                <div key={w.id}>
                  <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '4px' }}>{w.title}（円）</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      value={w.amount}
                      min={0}
                      step={50}
                      onChange={(e) => updateExtraWage(w.id, 'amount', Number(e.target.value))}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeExtraWage(w.id)}
                      style={{
                        border: 'none', background: '#fee2e2', borderRadius: '8px',
                        width: '30px', height: '30px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, padding: 0, transition: 'background .15s, transform .1s',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#fca5a5'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* new extra wage inputs (part-time only) */}
              {selectedUser.role === 'part' && editExtraWages.filter((w) => w._new).map((w) => (
                <div key={w.id} style={{
                  background: '#f9f9fb', borderRadius: '10px', padding: '10px',
                }}>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>タイトル</div>
                      <input
                        type="text"
                        value={w.title}
                        placeholder="例: 深夜時給"
                        onChange={(e) => updateExtraWage(w.id, 'title', e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ flex: 0.7 }}>
                      <div style={{ fontSize: '11px', color: '#86868b', marginBottom: '3px' }}>金額（円）</div>
                      <input
                        type="number"
                        value={w.amount}
                        min={0}
                        step={50}
                        onChange={(e) => updateExtraWage(w.id, 'amount', Number(e.target.value))}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '1px' }}>
                      <button
                        type="button"
                        onClick={() => removeExtraWage(w.id)}
                        style={{
                          border: 'none', background: '#fee2e2', borderRadius: '8px',
                          width: '30px', height: '30px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, padding: 0, transition: 'background .15s',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#fca5a5'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* add button (part-time only) */}
              {selectedUser.role === 'part' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={addExtraWage}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      border: '1px dashed #bbb', background: '#fff', borderRadius: '8px',
                      padding: '5px 12px', fontSize: '12px', color: '#555',
                      cursor: 'pointer', fontWeight: 500,
                    }}
                  >
                    <span style={{ fontSize: '15px', lineHeight: 1 }}>+</span> 時給を追加
                  </button>
                </div>
              )}

              <InfoRow label="XP" value={`${selectedUser.xp} XP`} />
              <InfoRow label="レベル" value={`Lv.${lv(selectedUser.xp)}`} />
              <div>
                <div style={{ fontSize: '11px', color: '#86868b', marginBottom: '4px' }}>次のレベルまで</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: '#e8e8ed', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '4px',
                      background: 'linear-gradient(90deg, #34c759, #30d158)',
                      width: `${xpProgress(selectedUser.xp)}%`, transition: 'width .3s',
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#555', minWidth: '50px' }}>
                    {xpProgress(selectedUser.xp)} / 100
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn"
                type="button"
                onClick={() => setSelectedUser(null)}
                style={{ flex: 1, textAlign: 'center' }}
              >
                キャンセル
              </button>
              <button
                className="btn btn-dark"
                type="button"
                onClick={handleSave}
                style={{ flex: 1, textAlign: 'center' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: '#86868b' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
