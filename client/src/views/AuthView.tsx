import { type ReactNode } from 'react';
import { Priority, TaskStatus, User } from '../models';

type AuthViewProps = {
  loginUserId: string;
  setLoginUserId: (value: string) => void;
  password: string;          // 💡 追加
  setPassword: (value: string) => void;      // 💡 追加
  handleLogin: () => void;
};

export function AuthView({ loginUserId, setLoginUserId, password, setPassword, handleLogin }: AuthViewProps) {
  return (
    <div id="login-screen">
      <div className="lbox">
        <img src="/favicon.png" alt="TaskLuck" className="llogo" />
        <h2>ユーザー名とパスワードを入力してログイン</h2>
        
        <div className="fg">
          <label>ユーザー名 (ID)</label>
          <input
            type="text"
            value={loginUserId}
            onChange={(event) => setLoginUserId(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleLogin()}
            placeholder="例: suzuki_ichiro"
          />
        </div>

        {/* 💡 ユーザーが自分で入力できるように完全解放！ */}
        <div className="fg">
          <label>パスワード</label>
          <input 
            type="password" 
            value={password} // 💡 最初は空っぽで、打った文字が入る
            onChange={(event) => setPassword(event.target.value)} 
            onKeyDown={(event) => event.key === 'Enter' && handleLogin()}
            placeholder="パスワードを入力" 
          />
        </div>

        <button className="btn-login" type="button" onClick={handleLogin}>ログイン</button>
      </div>
    </div>
  );
}