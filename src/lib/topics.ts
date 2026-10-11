import raw from '../data/topics.json'
import type { Topic } from '../types'

export const ALL_TOPICS = raw as Topic[]

export const CATEGORIES: { name: string; index: number; total: number }[] = (() => {
  const map = new Map<string, { name: string; index: number; total: number }>()
  for (const topic of ALL_TOPICS) {
    const found = map.get(topic.category)
    if (found) found.total++
    else map.set(topic.category, { name: topic.category, index: topic.categoryIndex, total: 1 })
  }
  return [...map.values()].sort((a, b) => a.index - b.index)
})()

export const TOPICS_BY_N: Record<number, Topic> = Object.fromEntries(
  ALL_TOPICS.map((t) => [t.n, t]),
)

/**
 * Темы, которые ещё не выпадали. Если выбраны разделы — только из них.
 * Пустой список разделов означает «все».
 */
export function remainingTopics(used: Set<number>, categories: string[]): Topic[] {
  return ALL_TOPICS.filter(
    (t) => !used.has(t.n) && (categories.length === 0 || categories.includes(t.category)),
  )
}

export function pickRandom<T>(items: readonly T[]): T | null {
  if (items.length === 0) return null
  return items[Math.floor(Math.random() * items.length)]
}

/** Случайные темы для мельтешения барабана — только ради картинки. */
export function spinnerPool(exclude: number, size = 60): Topic[] {
  const pool = ALL_TOPICS.filter((t) => t.n !== exclude)
  const out: Topic[] = []
  for (let i = 0; i < size; i++) {
    const next = pool[Math.floor(Math.random() * pool.length)]
    if (next) out.push(next)
  }
  return out
}
