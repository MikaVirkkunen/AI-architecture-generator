/**
 * Prompt History Service
 * Persists generated diagrams to localStorage for later recall
 */

export interface HistoryEntry {
  id: string;
  timestamp: number;
  prompt: string;
  title: string;
  xml: string;
  parsed: {
    resources?: Array<{ type: string; name: string; count?: number }>;
    connections?: Array<{ from: string; to: string }>;
    pages?: Array<{ name: string; description?: string; resources?: Array<{ type: string; name: string; count?: number }> }>;
    description?: string;
  };
  modelInfo: string;
}

const STORAGE_KEY = 'az-arch-gen-history';
const MAX_ENTRIES = 50;

export function saveToHistory(
  entry: Omit<HistoryEntry, 'id' | 'timestamp'>
): HistoryEntry {
  const newEntry: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  const history = getHistory();
  history.unshift(newEntry);

  // Evict oldest beyond max
  if (history.length > MAX_ENTRIES) {
    history.length = MAX_ENTRIES;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage full — drop oldest half and retry
    history.length = Math.floor(history.length / 2);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  return newEntry;
}

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function deleteEntry(id: string): void {
  const history = getHistory().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
