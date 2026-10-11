import type { Topic } from '../types'
import { categoryColor } from '../types'

export function HistoryPanel({
  topics,
  onClose,
  onReturn,
}: {
  /** выпавшие темы, самая свежая первой */
  topics: Topic[]
  onClose: () => void
  onReturn: (n: number) => void
}) {
  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Выпавшие темы"
      data-no-swipe
      onClick={onClose}
    >
      <div
        className="anim-rise safe-bottom flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-3xl border border-edge bg-panel sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-4 pt-4 pb-3">
          <h2 className="font-display text-lg font-bold">Уже выпало</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            {topics.length === 0
              ? 'Пока пусто'
              : `${topics.length} тем. Свежие сверху — можно вернуть любую в барабан.`}
          </p>
        </header>

        <ul className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
          {topics.map((topic) => (
            <li
              key={topic.n}
              className="flex items-start gap-3 rounded-xl border border-edge bg-panel-2/50 px-3 py-2.5"
            >
              <span
                className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: categoryColor(topic.categoryIndex) }}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] leading-snug">{topic.title}</span>
                <span className="block text-[11px] text-muted">
                  №{topic.n} · {topic.category}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onReturn(topic.n)}
                className="shrink-0 rounded-lg border border-edge px-2 py-1 text-[11px] text-muted transition hover:text-parchment"
                title="Вернуть тему в барабан"
              >
                Вернуть
              </button>
            </li>
          ))}
          {topics.length === 0 && (
            <li className="px-2 py-8 text-center text-[13px] text-muted">
              Свайпните по экрану — и первая тема появится здесь.
            </li>
          )}
        </ul>

        <div className="border-t border-edge px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-edge bg-panel-2/60 py-3 text-[15px] font-semibold transition active:scale-[0.99]"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
