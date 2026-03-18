import type { UserSidebarPreferences } from '@/modules/types';

const KEY_PREFIX = 'enterhr_sidebar_';

function getKey(email: string): string {
  return KEY_PREFIX + email;
}

export function loadUserPrefs(email: string): UserSidebarPreferences | null {
  try {
    const raw = localStorage.getItem(getKey(email));
    if (!raw) return null;
    return JSON.parse(raw) as UserSidebarPreferences;
  } catch {
    return null;
  }
}

export function saveUserPrefs(email: string, prefs: UserSidebarPreferences): void {
  try {
    localStorage.setItem(getKey(email), JSON.stringify(prefs));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function clearUserPrefs(email: string): void {
  try {
    localStorage.removeItem(getKey(email));
  } catch {
    // ignore
  }
}
