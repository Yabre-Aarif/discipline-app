import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "discipline.state.v1";

export async function loadState<T>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function saveState<T>(state: T): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let idCounter = 0;
export function makeId(): string {
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}
