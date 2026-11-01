import { useEffect, useRef, useState } from 'react'

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Ajoute la classe "in" aux éléments [data-reveal] quand ils entrent dans l'écran. */
export function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!('IntersectionObserver' in window) || reducedMotion()) {
      els.forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in')
            io.unobserve(en.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/** Léger parallaxe vertical sur les bandeaux photo (desktop uniquement). */
export function useParallax() {
  useEffect(() => {
    if (reducedMotion() || window.matchMedia('(max-width: 900px)').matches) return
    const bands = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'))
    let raf = 0
    const update = () => {
      raf = 0
      const vh = window.innerHeight
      bands.forEach((b) => {
        const r = b.getBoundingClientRect()
        if (r.bottom < 0 || r.top > vh) return
        const progress = (r.top + r.height / 2 - vh / 2) / vh // -1 … 1
        const img = b.querySelector<HTMLElement>('.bg')
        if (img) img.style.transform = `translate3d(0, ${progress * -60}px, 0) scale(1.15)`
      })
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
}

/** Compteur animé, déclenché à l'apparition. */
export function useCountUp(to: number, duration = 1400) {
  const ref = useRef<HTMLElement>(null)
  const [value, setValue] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window) || reducedMotion()) {
      setValue(to)
      return
    }
    const io = new IntersectionObserver(
      ([en]) => {
        if (!en.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration)
          setValue(Math.round(to * (1 - Math.pow(1 - p, 3))))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])
  return { ref, value }
}
