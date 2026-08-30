import { apiRequest, setAuthToken } from './client';
import type { LessonProgress, User, UserPreferences } from '../types';

export async function login(nickname: string) {
  const data = await apiRequest<{ token: string; user: User }>('/auth/login/', {
    method: 'POST',
    body: { nickname },
    auth: false,
  });
  setAuthToken(data.token);
  return data;
}

export function logout() {
  setAuthToken(null);
}

export async function fetchMe() {
  return apiRequest<{ user: User; preferences: UserPreferences }>('/me/');
}

export async function updatePreferences(preferences: Partial<UserPreferences>) {
  return apiRequest<UserPreferences>('/me/', {
    method: 'PATCH',
    body: preferences,
  });
}

export async function fetchProgress() {
  return apiRequest<LessonProgress>('/progress/');
}

export async function saveLessonProgress(
  lessonId: string,
  completed: boolean,
  score: number,
) {
  return apiRequest<{ completed: boolean; score: number }>(`/progress/${lessonId}/`, {
    method: 'PUT',
    body: { completed, score },
  });
}
