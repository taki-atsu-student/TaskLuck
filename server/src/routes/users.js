import express from 'express';

const router = express.Router();

// ユーザー初期データ
let users = [
  { id: 1, name: '田中 店長', role: 'manager', xp: 0, ini: '田', password: 'pass0001', monthlySalary: 350010 },
  { id: 2, name: '佐藤 花子', role: 'staff', xp: 320, ini: '佐', password: 'pass0002', monthlySalary: 250010 },
  { id: 3, name: '鈴木 一郎', role: 'part', xp: 180, ini: '鈴', password: 'pass0003', hourlyWage: 1100 },
  { id: 4, name: '高橋 美咲', role: 'part', xp: 90, ini: '高', password: 'pass0004', hourlyWage: 1050 },
  { id: 5, name: '山田 健太', role: 'part', xp: 230, ini: '山', password: 'pass0005', hourlyWage: 1100 },
];

// GET /api/users - ユーザー一覧取得
router.get('/', (_req, res) => {
  res.json(users);
});

// POST /api/users - スタッフ追加
router.post('/', (req, res) => {
  const { name, role, hourlyWage, monthlySalary } = req.body;

  if (!name) {
    return res.status(400).json({ error: '名前は必須です' });
  }

  const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const password = `pass${String(newId).padStart(4, '0')}`;
  const ini = name.trim().charAt(0) || 'S';

  const newUser = {
    id: newId,
    name: name.trim(),
    role: role || 'part',
    xp: 0,
    ini,
    password,
  };

  if (role === 'part') {
    newUser.hourlyWage = hourlyWage !== undefined ? hourlyWage : 1050;
  } else {
    newUser.monthlySalary = monthlySalary !== undefined ? monthlySalary : 250010;
  }

  users.push(newUser);
  res.status(201).json(newUser);
});

// PUT /api/users/:id - ユーザー情報更新 (XPや給与設定など)
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const userIndex = users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'ユーザーが見つかりません' });
  }

  const user = users[userIndex];
  const { xp, hourlyWage, monthlySalary, name, role } = req.body;

  if (xp !== undefined) user.xp = parseInt(xp, 10);
  if (hourlyWage !== undefined) user.hourlyWage = parseInt(hourlyWage, 10);
  if (monthlySalary !== undefined) user.monthlySalary = parseInt(monthlySalary, 10);
  if (name !== undefined) {
    user.name = name.trim();
    user.ini = name.trim().charAt(0) || 'S';
  }
  if (role !== undefined) user.role = role;

  res.json(user);
});

export default router;
