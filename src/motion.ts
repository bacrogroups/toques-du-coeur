import { useEffect, useRef, useState } from 'react'

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/**
 * Moteur de défilement :
 * - [data-reveal] reçoit la classe "in" quand il entre dans l'écran ;
 * - [data-pin] (section haute avec un enfant sticky) reçoit --p (0 → 1) selon la progression du scroll ;
 * - à l'intérieur, chaque [data-range="a,b"] reçoit --t (0 → 1) sur sa tranche de progression ;
 * - [data-hscroll] fait défiler horizontalement son .track.
 */
export function useMotion() {
  useEffect(() => {
    const reveals = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    const pins = Array.from(document.querySelectorAll<HTMLElement>('[data-pin]'))
    const reduced = reducedMotion()

    if (reduced || !('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('in'))
      pins.forEach((pin) => {
        pin.style.setProperty('--p', '1')
        pin.querySelectorAll<HTMLElement>('[data-range]').forEach((it) => it.style.setProperty('--t', '1'))
      })
      return
    }

    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in')
          io.unobserve(en.target)
        }
      }),
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    reveals.forEach((el) => io.observe(el))

    const ranges = pins.map((pin) =>
      Array.from(pin.querySelectorAll<HTMLElement>('[data-range]')).map((it) => {
        const [a, b] = (it.dataset.range || '0,1').split(',').map(Number)
        return { it, a, b }
      }),
    )

    let raf = 0
    const update = () => {
      raf = 0
      const vh = window.innerHeight
      pins.forEach((pin, i) => {
        const r = pin.getBoundingClientRect()
        if (r.bottom < -vh || r.top > vh * 2) return
        const total = Math.max(1, pin.offsetHeight - vh)
        const p = clamp01(-r.top / total)
        pin.style.setProperty('--p', p.toFixed(4))
        ranges[i].forEach(({ it, a, b }) => it.style.setProperty('--t', clamp01((p - a) / (b - a)).toFixed(4)))
        if (pin.hasAttribute('data-hscroll')) {
          const track = pin.querySelector<HTMLElement>('.track')
          if (track) {
            const max = Math.max(0, track.scrollWidth - window.innerWidth)
            track.style.transform = `translate3d(${(-p * max).toFixed(1)}px,0,0)`
          }
        }
      })
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
}

/** Parallaxe douce au curseur : --mx / --my (-1 … 1) sur l'élément. */
export function usePointerParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion() || window.matchMedia('(hover: none)').matches) return
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3))
      el.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3))
    }
    const onLeave = () => { el.style.setProperty('--mx', '0'); el.style.setProperty('--my', '0') }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => { el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave) }
  }, [])
  return ref
}

/** Compteur animé déclenché à l'apparition. */
export function useCountUp(to: number, duration = 1600) {
  const ref = useRef<HTMLElement>(null)
  const [value, setValue] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window) || reducedMotion()) { setValue(to); return }
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration)
        setValue(Math.round(to * (1 - Math.pow(1 - p, 4))))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])
  return { ref, value }
}
