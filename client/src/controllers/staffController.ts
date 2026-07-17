import type { Dispatch, SetStateAction } from 'react';
import type { Role, User } from '../models';
import { createUser, deleteUser, updateUserPassword } from '../services/api';

type StaffDeps = {
  users: User[];
  setUsers: Dispatch<SetStateAction<User[]>>;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  currentUser: User | null;
  refreshUsers: () => Promise<void>;
  toast: (message: string) => void;
};

export const createStaffHandlers = ({
  users,
  setUsers,
  setCurrentUser,
  currentUser,
  refreshUsers,
  toast,
}: StaffDeps) => {
  const handleStaffCreate = async (
    asNameParam: string,
    asRoleParam: Role,
    asSalaryParam: number,
    _setUsersFn: (fn: any) => void,
    setModalFn: (m: any) => void,
    toastFn: (m: string) => void,
  ) => {
    if (!asNameParam.trim()) {
      toastFn('名前を入力してください');
      return;
    }
    const salaryFields = asRoleParam === 'part' ? { hourlyWage: asSalaryParam } : { monthlySalary: asSalaryParam };

    try {
      await createUser({
        name: asNameParam.trim(),
        role: asRoleParam,
        ...salaryFields,
      });
      await refreshUsers();
      setModalFn(null);
      toastFn('スタッフを追加しました');
    } catch (e) {
      console.error(e);
      toastFn('通信エラーが発生しました');
    }
  };

  const handlePasswordSave = async (pwValue: string, setPwOpen: Dispatch<SetStateAction<boolean>>) => {
    if (!currentUser) return;
    try {
      await updateUserPassword(currentUser.id, pwValue);
      setUsers((prev) => prev.map((u) => u.id === currentUser.id ? { ...u, password: pwValue } : u));
      setCurrentUser({ ...currentUser, password: pwValue });
      setPwOpen(false);
      toast('パスワードを変更しました');
    } catch {
      toast('パスワード変更に失敗しました');
    }
  };

  const handleStaffDelete = async (userId: number) => {
    try {
      await deleteUser(userId);
      await refreshUsers();
      toast('スタッフを削除しました');
    } catch (e) {
      console.error(e);
      toast('スタッフの削除に失敗しました');
    }
  };

  return {
    handleStaffCreate,
    handlePasswordSave,
    handleStaffDelete,
  };
};
