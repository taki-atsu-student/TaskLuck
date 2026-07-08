import { API_BASE_URL } from '../config/api';
import type { BusinessInfo, GachaLog, Notification, Shift, ShiftPattern, Task, User, Role, Priority, TaskStatus } from '../models';

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return response.text() as unknown as T;
}

export const fetchTasks = () => requestJson<Task[]>('/api/tasks');
export const createTask = (payload: Record<string, unknown>) => requestJson<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
export const updateTask = (id: number | string, payload: Record<string, unknown>) => requestJson<Task>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteTask = async (id: number | string) => {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Request failed: ${response.status}`);
  }
  return true;
};

export const fetchUsers = () => requestJson<User[]>('/api/users');
export const createUser = (payload: Record<string, unknown>) => requestJson<User>('/api/users', { method: 'POST', body: JSON.stringify(payload) });
export const updateUser = (id: number | string, payload: Record<string, unknown>) => requestJson<User>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const updateUserPassword = (id: number | string, password: string) => requestJson<User>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify({ password }) });

export const fetchShifts = () => requestJson<Shift[]>('/api/shifts');
export const createShiftRequest = (payload: Record<string, unknown>) => requestJson<Shift>('/api/shifts', { method: 'POST', body: JSON.stringify(payload) });
export const createShiftBulk = (payload: Record<string, unknown>) => requestJson<{ success: boolean }>('/api/shifts/bulk', { method: 'POST', body: JSON.stringify(payload) });
export const createConfirmedShift = (payload: Record<string, unknown>) => requestJson<Shift>('/api/shifts', { method: 'POST', body: JSON.stringify(payload) });

export const fetchBusinessInfo = () => requestJson<BusinessInfo>('/api/business-info');
export const updateBusinessInfo = (payload: BusinessInfo) => requestJson<BusinessInfo>('/api/business-info', { method: 'PUT', body: JSON.stringify(payload) });

export const fetchNotifications = () => requestJson<Notification[]>('/api/notifications');
export const createNotification = (payload: Record<string, unknown>) => requestJson<Notification>('/api/notifications', { method: 'POST', body: JSON.stringify(payload) });
export const markNotificationRead = (id: number | string) => requestJson<Notification>(`/api/notifications/${id}/read`, { method: 'PUT' });
export const deleteNotification = (id: number | string) => requestJson<{ success: boolean }>(`/api/notifications/${id}`, { method: 'DELETE' });

export const fetchGachaHistory = () => requestJson<GachaLog[]>('/api/gacha/history');
export const pullGacha = (payload: Record<string, unknown>) => requestJson<{ task: Task; rarity: string }>('/api/gacha/pull', { method: 'POST', body: JSON.stringify(payload) });

export const saveShiftPatterns = (uid: number, patterns: ShiftPattern[]) => requestJson<ShiftPattern[]>(`/api/shift-patterns`, {
  method: 'POST',
  body: JSON.stringify({ uid, patterns }),
});
