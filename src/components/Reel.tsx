import { useEffect, useMemo, useRef, useState } from 'react'
import { categoryColor, type Topic } from '../types'

/** Высота одной строки барабана в пикселях. */
const ROW = 68
/** Сколько строк видно в окне. Нечётное — чтобы была ровная середина. */
const VISIBLE = 5
const CENTER = Math.floor(VISIBLE / 2)
/** Сколько строк прокручивается до выигрышной. */
const SPIN_ROWS = 34
/** Запас строк под выигрышной: барабан слегка проскакивает и возвращается. */
const TAIL = 3
const DURATION = 3100

/**
 * Кривая торможения с небольшим перелётом в конце (последнее значение > 1):
 * барабан проезжает чуть дальше нужной строки и откатывается назад, как
 * настоящий механизм. Ради этого под выигрышной строкой и лежит запас TAIL.
 */
const EASING = 'cubic-bezier(0.16, 0.84, 0.28, 1.06)'

function Row({ topic }: { topic: Topic }) {
  return (
    <div className="flex items-center px-4" style={{ height: ROW }}>
      <span className="flex w-full items-center justify-center gap-2">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: categoryColor(topic.categoryIndex) }}
        />
        {/* min-w-0 обязателен: без него флекс-элемент не сжимается
            ниже длины текста и строка вылезает за край барабана. */}
        <span className="font-display line-clamp-2 min-w-0 text-center text-[15px] leading-tight text-muted">
          {topic.title}
        </span>
      </span>
    </div>
  )
}

export function Reel({
  pool,
  winner,
  onDone,
}: {
  pool: Topic[]
  winner: Topic
  onDone: () => void
}) {
  const done = useRef(onDone)
  useEffect(() => {
    done.current = onDone
  })

  const strip = useMemo(() => {
    const take = (i: number) => pool[i % pool.length] ?? winner
    const before = Array.from({ length: SPIN_ROWS }, (_, i) => take(i))
    const after = Array.from({ length: TAIL }, (_, i) => take(SPIN_ROWS + i))
    return [...before, winner, ...after]
  }, [pool, winner])

  const target = -(SPIN_ROWS - CENTER) * ROW

  // Когда движение отключено системно, барабан сразу стоит на выигрышной
  // строке: это начальное состояние, а не результат эффекта.
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [y, setY] = useState(() => (reduced ? target : 0))
  const [moving, setMoving] = useState(false)
  const [sharp, setSharp] = useState(reduced)

  useEffect(() => {
    if (reduced) {
      // Небольшая пауза, иначе тема появляется раньше, чем взгляд за ней успевает.
      const quick = window.setTimeout(() => done.current(), 400)
      return () => window.clearTimeout(quick)
    }

    // Два кадра: первый фиксирует стартовую позицию без перехода,
    // второй включает переход — иначе браузер склеит их в один и анимации не будет.
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        setMoving(true)
        setY(target)
      })
    })

    // Смаз убираем раньше остановки, чтобы последние строки уже читались.
    const unblur = window.setTimeout(() => setSharp(true), DURATION * 0.55)
    // Завершение по таймеру, а не по transitionend: это событие теряется,
    // если вкладку свернули на время прокрутки.
    const finish = window.setTimeout(() => done.current(), DURATION + 40)

    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
      window.clearTimeout(unblur)
      window.clearTimeout(finish)
    }
  }, [target, reduced])

  const fade = 'linear-gradient(to bottom, transparent 0%, #000 26%, #000 74%, transparent 100%)'

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: VISIBLE * ROW }}
      aria-live="polite"
      aria-label="Барабан крутится"
    >
      {/* Окно отбора — подсвеченная полоса ровно по центру. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 rounded-xl border-y border-gold/35 bg-gold/8"
        style={{ height: ROW }}
      />

      <div
        style={{
          transform: `translate3d(0, ${y}px, 0)`,
          transition: moving ? `transform ${DURATION}ms ${EASING}` : 'none',
          filter: sharp ? 'none' : 'blur(1.4px)',
          WebkitMaskImage: fade,
          maskImage: fade,
        }}
      >
        {strip.map((topic, i) => (
          <Row key={`${i}-${topic.n}`} topic={topic} />
        ))}
      </div>
    </div>
  )
}
