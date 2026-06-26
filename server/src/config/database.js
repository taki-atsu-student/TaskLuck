import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = 'mongodb+srv://harutsugu0528_db_user:4xsljChdWWi6v67h@taskluckcluster.uvohavf.mongodb.net/taskluck?appName=TaskLuckCluster';
const dbName = 'taskluck'; // あなたのデータベース名に合わせてください

let client;
let db;

export const connectDatabase = async () => {
  try {
    if (db) return db;
    
    console.log('=> データベースに接続します...');
    client = new MongoClient(url);
    await client.connect();
    
    db = client.db(dbName);
    console.log('MongoDB connection established successfully.');
    return db;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

// コントローラーからDB操作用オブジェクトを呼び出すための関数
export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDatabase first.');
  }
  return db;
};