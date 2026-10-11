import { CATEGORIES } from '../lib/topics'
import { categoryColor } from '../types'

export function CategoryFilter({
  selected,
  remainingByCategory,
  onToggle,
  onReset,
  onClose,
}: {
  selected: string[]
  remainingByCategory: Record<string, number>
  onToggle: (name: string) => void
  onReset: () => void
  onClose: () => void
}) {
  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Выбор разделов"
      data-no-swipe
      onClick={onClose}
    >
      <div
        className="anim-rise safe-bottom flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-3xl border border-edge bg-panel sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start gap-3 px-4 pt-4 pb-3">
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold">Разделы</h2>
            <p className="mt-0.5 text-[12px] text-muted">
              {selected.length === 0
                ? 'Сейчас в игре все 24 раздела'
                : `Выбрано разделов: ${selected.length}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            disabled={selected.length === 0}
            className="rounded-xl border border-edge px-3 py-1.5 text-[12px] text-muted transition enabled:hover:text-parchment disabled:opacity-40"
          >
            Все
          </button>
        </header>

        <ul className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
          {CATEGORIES.map((category) => {
            const active = selected.includes(category.name)
            const left = remainingByCategory[category.name] ?? 0
            const exhausted = left === 0
            return (
              <li key={category.name}>
                <button
                  type="button"
                  onClick={() => onToggle(category.name)}
                  aria-pressed={active}
                  className={
                    'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ' +
                    (active
                      ? 'border-gold/60 bg-gold/12'
                      : 'border-edge bg-panel-2/60 hover:border-muted/60')
                  }
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: categoryColor(category.index) }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] leading-snug">{category.name}</span>
                    <span className="block text-[11px] text-muted">
                      {exhausted ? 'раздел пройден' : `осталось ${left} из ${category.total}`}
                    </span>
                  </span>
                  <span
                    className={
                      'tabular shrink-0 text-[13px] ' + (active ? 'text-gold' : 'text-muted/70')
                    }
                  >
                    {left}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="border-t border-edge px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-gold py-3 text-[15px] font-bold text-ink transition active:scale-[0.99]"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  )
}
