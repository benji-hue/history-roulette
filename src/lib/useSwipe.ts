import { useEffect, useRef, useState } from 'react'

/** Минимальная длина жеста, чтобы отличить свайп от промаха по кнопке. */
const MIN_DISTANCE = 55

export interface SwipeState {
  /** 0…1 — насколько жест дотянут до порога, для подсветки подсказки */
  progress: number
}

/**
 * Свайп в любом направлении по всему экрану.
 *
 * Используются pointer-события: они одинаково покрывают палец и мышь,
 * так что на десктопе работает перетаскивание, а на телефоне — обычный свайп.
 * Жест не начинается только внутри элементов с data-no-swipe — это
 * всплывающие панели со своей прокруткой. Обычные кнопки экрана его не гасят:
 * короткий тап до порога не считается свайпом, а при протяжке браузер не
 * отправляет click, потому что палец отрывается уже вне кнопки.
 */
export function useSwipe(onSwipe: () => void, enabled: boolean): SwipeState {
  const [progress, setProgress] = useState(0)
  const handler = useRef(onSwipe)

  useEffect(() => {
    handler.current = onSwipe
  })

  useEffect(() => {
    if (!enabled) return

    let active = false
    let startX = 0
    let startY = 0

    const blocked = (target: EventTarget | null) =>
      target instanceof Element && target.closest('[data-no-swipe]') !== null

    const onDown = (e: PointerEvent) => {
      if (blocked(e.target)) return
      active = true
      startX = e.clientX
      startY = e.clientY
    }

    const onMove = (e: PointerEvent) => {
      if (!active) return
      const distance = Math.hypot(e.clientX - startX, e.clientY - startY)
      setProgress(Math.min(1, distance / MIN_DISTANCE))
    }

    const finish = (e: PointerEvent) => {
      if (!active) return
      active = false
      setProgress(0)
      // Ограничения по времени нет намеренно: на этом экране ничего не
      // прокручивается, конкурирующих жестов нет, а неспешный свайп — такой же
      // свайп. Лимит только порождал бы «провёл пальцем, но ничего не вышло».
      const distance = Math.hypot(e.clientX - startX, e.clientY - startY)
      if (distance >= MIN_DISTANCE) handler.current()
    }

    const cancel = () => {
      active = false
      setProgress(0)
    }

    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', cancel)

    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', cancel)
    }
  }, [enabled])

  // Пока жест выключен, прогресс считается нулевым прямо здесь — так не нужен
  // лишний setState в эффекте ради сброса подсветки.
  return { progress: enabled ? progress : 0 }
}
