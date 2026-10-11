const KEY = 'history-roulette:v1'

export interface SavedState {
  version: 1
  /** номера выпавших тем, в порядке выпадения — это же и история */
  drawn: number[]
  /** выбранные разделы; пусто = все */
  categories: string[]
}

export const EMPTY_STATE: SavedState = { version: 1, drawn: [], categories: [] }

export function loadState(): SavedState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY_STATE
    const parsed = JSON.parse(raw) as Partial<SavedState>
    if (parsed.version !== 1) return EMPTY_STATE
    return {
      version: 1,
      drawn: Array.isArray(parsed.drawn)
        ? parsed.drawn.filter((n): n is number => Number.isInteger(n))
        : [],
      categories: Array.isArray(parsed.categories)
        ? parsed.categories.filter((c): c is string => typeof c === 'string')
        : [],
    }
  } catch {
    // Приватный режим или испорченный JSON — начинаем с чистого листа.
    return EMPTY_STATE
  }
}

export function saveState(state: SavedState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Прогресс просто не переживёт перезагрузку.
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
