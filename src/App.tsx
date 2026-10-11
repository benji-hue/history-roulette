import { useEffect, useMemo, useRef, useState } from 'react'
import { ALL_TOPICS, pickRandom, remainingTopics, spinnerPool, TOPICS_BY_N } from './lib/topics'
import { clearState, EMPTY_STATE, loadState, saveState, type SavedState } from './lib/storage'
import { useSwipe } from './lib/useSwipe'
import { categoryColor, type Topic } from './types'
import { Reel } from './components/Reel'
import { CategoryFilter } from './components/CategoryFilter'
import { HistoryPanel } from './components/HistoryPanel'

type Sheet = 'categories' | 'history' | null

export default function App() {
  const [state, setState] = useState<SavedState>(loadState)
  const [current, setCurrent] = useState<Topic | null>(null)
  const [spin, setSpin] = useState<{ winner: Topic; pool: Topic[] } | null>(null)
  const [sheet, setSheet] = useState<Sheet>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle')
  const copyTimer = useRef<number | null>(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current)
    },
    [],
  )

  const used = useMemo(() => new Set(state.drawn), [state.drawn])
  const remaining = useMemo(
    () => remainingTopics(used, state.categories),
    [used, state.categories],
  )

  const remainingByCategory = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const topic of ALL_TOPICS) {
      if (!used.has(topic.n)) counts[topic.category] = (counts[topic.category] ?? 0) + 1
    }
    return counts
  }, [used])

  const history = useMemo(
    () =>
      state.drawn
        .map((n) => TOPICS_BY_N[n])
        .filter((t): t is Topic => Boolean(t))
        .reverse(),
    [state.drawn],
  )

  const filtered = state.categories.length > 0
  const everythingDone = state.drawn.length >= ALL_TOPICS.length
  const canSpin = spin === null && sheet === null && remaining.length > 0

  function startSpin() {
    if (!canSpin) return
    const winner = pickRandom(remaining)
    if (!winner) return
    setCopyState('idle')
    setSpin({ winner, pool: spinnerPool(winner.n) })
  }

  /** Тема засчитывается ровно в момент остановки барабана, не раньше. */
  function finishSpin() {
    if (!spin) return
    const { winner } = spin
    setCurrent(winner)
    setSpin(null)
    setState((prev) =>
      prev.drawn.includes(winner.n) ? prev : { ...prev, drawn: [...prev.drawn, winner.n] },
    )
  }

  function returnToDrum(n: number) {
    setState((prev) => ({ ...prev, drawn: prev.drawn.filter((x) => x !== n) }))
    if (current?.n === n) setCurrent(null)
  }

  function toggleCategory(name: string) {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.includes(name)
        ? prev.categories.filter((c) => c !== name)
        : [...prev.categories, name],
    }))
  }

  async function copyCurrent() {
    if (!current) return
    try {
      await navigator.clipboard.writeText(`${current.title} (${current.category})`)
      setCopyState('ok')
    } catch {
      // Буфер может быть недоступен: небезопасный origin или отказ в доступе.
      // Молчать нельзя — иначе нажатие выглядит как сломанное.
      setCopyState('fail')
    }
    if (copyTimer.current) window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => setCopyState('idle'), 2000)
  }

  const { progress } = useSwipe(startSpin, canSpin)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return
      if (e.target instanceof HTMLElement && e.target.closest('button')) return
      e.preventDefault()
      startSpin()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const total = ALL_TOPICS.length
  const done = state.drawn.length

  return (
    <div className="no-select screen-min-h mx-auto flex w-full max-w-xl flex-col px-4">
      <header className="flex items-center gap-1.5 pt-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[15px] leading-tight font-bold sm:text-[17px]">
            Рулетка исторических тем
          </h1>
          <p className="tabular mt-0.5 text-[12px] text-muted">
            осталось <span className="text-gold">{remaining.length}</span> · выпало {done} из {total}
            {filtered && ' · по выбранным разделам'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSheet('categories')}
          className={
            'shrink-0 rounded-xl border px-2.5 py-1.5 text-[11px] transition ' +
            (filtered ? 'border-gold/60 bg-gold/12 text-gold' : 'border-edge text-muted')
          }
        >
          Разделы
        </button>
        <button
          type="button"
          onClick={() => setSheet('history')}
          className="rounded-xl border border-edge px-3 py-2 text-[12px] text-muted transition hover:text-parchment"
        >
          Выпало
        </button>
      </header>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-500"
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        {everythingDone ? (
          <div className="anim-land">
            <p className="font-display text-[26px] font-bold text-gold">Все 510 тем пройдены</p>
            <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-muted">
              Барабан пуст. Можно сбросить историю и пройти круг заново — порядок будет другим.
            </p>
          </div>
        ) : remaining.length === 0 ? (
          <div className="anim-land">
            <p className="font-display text-[22px] font-bold">В выбранных разделах пусто</p>
            <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-muted">
              Здесь темы кончились, но в других разделах ещё есть. Откройте «Разделы» и добавьте
              что-нибудь.
            </p>
            <button
              type="button"
              onClick={() => setSheet('categories')}
              className="mt-5 rounded-2xl bg-gold px-5 py-3 text-[15px] font-bold text-ink"
            >
              Выбрать разделы
            </button>
          </div>
        ) : spin ? (
          <Reel pool={spin.pool} winner={spin.winner} onDone={finishSpin} />
        ) : current ? (
          <div key={current.n} className="anim-land w-full">
            <span
              className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                background: `${categoryColor(current.categoryIndex)}22`,
                color: categoryColor(current.categoryIndex),
              }}
            >
              {current.category}
            </span>
            <p className="font-display mt-4 text-[24px] leading-snug font-bold text-parchment sm:text-[30px]">
              {current.title}
            </p>
            <p className="tabular mt-3 text-[12px] text-muted">тема №{current.n}</p>

            <button
              type="button"
              onClick={copyCurrent}
              className="mt-5 rounded-xl border border-edge px-3 py-1.5 text-[12px] text-muted transition hover:text-parchment"
            >
              {copyState === 'ok'
                ? 'Скопировано'
                : copyState === 'fail'
                  ? 'Буфер недоступен'
                  : 'Скопировать'}
            </button>
          </div>
        ) : (
          <div className="anim-fade">
            <p className="font-display text-[22px] leading-snug font-bold sm:text-[26px]">
              510 историй, которые не стыдно рассказать
            </p>
            <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-muted">
              Убийства без разгадки, безумные монархи, шпионы, мистификации и войны по нелепым
              поводам. Каждая тема выпадает ровно один раз.
            </p>
          </div>
        )}
      </main>

      <footer className="safe-bottom flex flex-col items-center gap-3">
        {remaining.length > 0 && (
          <>
            <div
              className={spin ? 'opacity-0' : 'anim-hint flex flex-col items-center gap-1'}
              style={progress > 0 ? { animation: 'none', opacity: 0.5 + progress * 0.5 } : undefined}
              aria-hidden="true"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 19V5M12 5l-5 5M12 5l5 5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gold"
                />
              </svg>
              <span className="text-[13px] text-muted">
                {spin ? 'Крутится…' : 'Свайпните по экрану'}
              </span>
            </div>

            <button
              type="button"
              onClick={startSpin}
              disabled={!canSpin}
              className="w-full max-w-xs rounded-2xl bg-gold py-3.5 text-[15px] font-bold text-ink transition active:scale-[0.99] disabled:opacity-40"
            >
              {spin ? 'Крутится…' : current ? 'Следующая тема' : 'Запустить рулетку'}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => {
            if (confirmReset) {
              clearState()
              setState({ ...EMPTY_STATE })
              setCurrent(null)
              setConfirmReset(false)
            } else {
              setConfirmReset(true)
            }
          }}
          onBlur={() => setConfirmReset(false)}
          disabled={done === 0}
          className={
            'pb-1 text-[12px] transition disabled:opacity-30 ' +
            (confirmReset ? 'font-semibold text-red-400' : 'text-muted hover:text-parchment')
          }
        >
          {confirmReset ? 'Точно сбросить историю?' : 'Сбросить историю'}
        </button>
      </footer>

      {sheet === 'categories' && (
        <CategoryFilter
          selected={state.categories}
          remainingByCategory={remainingByCategory}
          onToggle={toggleCategory}
          onReset={() => setState((prev) => ({ ...prev, categories: [] }))}
          onClose={() => setSheet(null)}
        />
      )}

      {sheet === 'history' && (
        <HistoryPanel
          topics={history}
          onReturn={returnToDrum}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  )
}
