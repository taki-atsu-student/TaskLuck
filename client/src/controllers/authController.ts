import type { Dispatch, SetStateAction } from 'react';
import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';
import type { User } from '../models';
import { resolveUserRole } from '../models';

type ActivePage = 'dashboard' | 'shift' | 'shift-request' | 'shift-edit' | 'task' | 'gacha' | 'business-info' | 'staff' | 'notifications';

type AuthDeps = {
  loginUserId: string;
  password: string;
  users: User[];
  toast: (message: string) => void;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  setActivePage: Dispatch<SetStateAction<ActivePage>>;
  setLoginUserId: Dispatch<SetStateAction<string>>;
  setNotificationOpen: Dispatch<SetStateAction<boolean>>;
  setGachaLock: Dispatch<SetStateAction<boolean>>;
};

export const createAuthHandlers = ({
  loginUserId,
  password,
  users,
  toast,
  setCurrentUser,
  setActivePage,
  setLoginUserId,
  setNotificationOpen,
  setGachaLock,
}: AuthDeps) => {
  const handleLogin = async () => {
    const normalizedUsername = loginUserId.trim();

    if (!normalizedUsername || !password) {
      toast('ユーザー名とパスワードを入力してください');
      return;
    }

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: normalizedUsername,
        password,
      });

      let authenticated = isSignedIn;

      if (nextStep && nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        const { confirmSignIn } = await import('aws-amplify/auth');
        const confirmResult = await confirmSignIn({
          challengeResponse: password,
          options: {
            userAttributes: {
              email: `${normalizedUsername}@example.com`,
            },
          },
        });
        authenticated = confirmResult.isSignedIn;
      }

      if (authenticated) {
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString() ?? null;
        if (token) {
          localStorage.setItem('token', token);
        }

        const selectedUser = users.find((user) => String(user.username) === String(normalizedUsername));
        const normalizedSelectedUser = selectedUser ? { ...selectedUser, role: resolveUserRole(selectedUser) } : null;

        if (!normalizedSelectedUser) {
          toast('Cognito認証は成功しましたが、DBにアカウントが存在しません');
          return;
        }

        setCurrentUser(normalizedSelectedUser);
        setActivePage('dashboard');
        toast(`${normalizedSelectedUser.name}としてログインしました！`);
      }
    } catch (error: any) {
      console.error('ログインエラー:', error);
      toast(`ログイン失敗: ${error.message || 'IDまたはパスワードが違います'}`);
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Cognitoログアウトエラー:', e);
    }

    localStorage.removeItem('token');
    setCurrentUser(null);
    setActivePage('dashboard');
    setLoginUserId('');
    setNotificationOpen(false);
    setGachaLock(false);
  };

  return { handleLogin, logout };
};
