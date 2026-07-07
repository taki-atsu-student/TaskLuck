# TaskLuck

React(Vite + Tailwind CSS) のフロントエンドと、Node.js + Express のバックエンド、MongoDB をつないだ開発用の土台です。

## 起動方法

1. `server/.env.example` を `server/.env` にコピーして、MongoDB の接続先を設定します。
2. ルートで依存関係をインストールします。
3. `npm run dev` を実行します。

## コマンド

- `npm run dev`: フロントエンドとバックエンドを同時起動
- `npm run build`: フロントエンドをビルド
- `npm run start`: バックエンドを起動

## デフォルト URL

- フロントエンド: http://localhost:5173
- バックエンド: https://yhcfr2u9hg.execute-api.ap-northeast-1.amazonaws.com