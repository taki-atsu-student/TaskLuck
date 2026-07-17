import { getDb } from '../config/database.js';
// 💡 DBに大文字(HIGH, MID, LOW)で入るため、ここも大文字に対応させました！
const PRIORITY_WEIGHTS = { HIGH: 6, MID: 3, LOW: 1, high: 6, mid: 3, low: 1 };

function pickTask(availableTasks) {
  let total = availableTasks.reduce((acc, t) => acc + (PRIORITY_WEIGHTS[t.priority] || 1), 0);
  let r = Math.random() * total;
  for (const t of availableTasks) {
    const w = PRIORITY_WEIGHTS[t.priority] || 1;
    if (r < w) return t;
    r -= w;
  }
  return availableTasks[0];
}

// 🎯 POST /api/gacha/pull - ガチャ実行（DB連動版）
export const drawGacha = async (req, res) => {
  try {
    const { userId } = req.body; 
    if (!userId) {
      return res.status(400).json({ error: 'ユーザーIDが必要です' });
    }

    const db = await getDb();

    // 🛠️ 1. 同時引き防止（taskControllerの status と to 列名に統一）
    const existingActiveTask = await db.collection('tasks').findOne({
      to: Number(userId),
      status: { $in: ['in_progress', 'review'] } 
    });

    if (existingActiveTask) {
      return res.status(400).json({ 
        error: `すでに進行中、または承認待ちのタスク（「${existingActiveTask.task_name}」）があります。完了するか承認されるまで新しいガチャは引けません。` 
      });
    }

    // 💡 2. ガチャプール絞り込み（taskControllerの status, is_gacha_target 列名に統一）
    const availableTasks = await db.collection('tasks').find({
      status: 'pending',
      is_gacha_target: true, 
      $or: [{ to: null }, { to: { $exists: false } }]
    }).toArray();

    if (!availableTasks || availableTasks.length === 0) {
      return res.status(400).json({ error: 'プール内に引けるタスクがありません' });
    }
    
    // 厳正に抽選
    const chosenTask = pickTask(availableTasks);
    const chosenXp = chosenTask.xp;

    // 🛠️ 3. 当たったタスクをDBで更新（status と to に統一）
    await db.collection('tasks').updateOne(
      { _id: chosenTask._id },
      { 
        $set: { 
          status: 'in_progress', 
          to: Number(userId),
          gachaXp: chosenXp      
        } 
      }
    );

    // 履歴ログをDBに保存
    const gachalogItem = {
      uid: Number(userId),
      name: chosenTask.task_name, // task_nameに統一
      desc: chosenTask.description, // descriptionに統一
      xp: chosenXp,
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    };

    await db.collection('gachalog').insertOne(gachalogItem);

    // フロントのReactが受け取れる型に形を整えて返却
    return res.json({
      task: {
        id: chosenTask._id.toString(),
        name: chosenTask.task_name,
        desc: chosenTask.description,
        pri: (chosenTask.priority || "mid").toLowerCase(),
        xp: chosenXp, // 倍率がかかったXPを渡す
        st: 'in_progress',
        inPool: true
      },
      xp: chosenXp,
      gachalog: gachalogItem,
    });

  } catch (error) {
    console.error('Gacha pull error:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 🎯 GET /api/gacha/gachalog - ガチャ履歴取得（DBから取得）
export const getGachaLog = async (req, res) => {
  try {
    const db = await getDb();
    const gachalog = await db.collection('gachalog').find().sort({ timestamp: -1 }).toArray();
    res.json(gachalog);
  } catch (error) {
    res.status(500).json({ error: '履歴の取得に失敗しました' });
  }
};

// 🎯 GET /api/gacha/gachalog/count - ガチャ総回数
export const getGachaCount = async (req, res) => {
  try {
    const db = await getDb();
    const count = await db.collection('gachalog').countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'カウントに失敗しました' });
  }
};