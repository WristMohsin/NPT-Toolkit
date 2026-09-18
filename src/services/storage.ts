// StorageProvider abstraction — swappable backend (LocalStorageProvider now, FutureApiProvider later)
const NS = 'anpt';

function key(collection: string) {
  return `${NS}:${collection}`;
}

export const StorageProvider = {
  getAll<T>(collection: string): T[] {
    try {
      const raw = localStorage.getItem(key(collection));
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  },
  setAll<T>(collection: string, items: T[]): void {
    try {
      localStorage.setItem(key(collection), JSON.stringify(items));
    } catch (e) {
      console.error('Storage write failed', e);
    }
  },
  clearAll(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`${NS}:`))
      .forEach((k) => localStorage.removeItem(k));
  },
};

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}
