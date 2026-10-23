import { useEffect } from 'react'
import Lenis from 'lenis'

const TEXT_TARGETS = [
  '.hero-copy > .hero-eyebrow', '.hero-copy > h1', '.hero-copy > p', '.hero-note',
  '.service-intro > .eyebrow', '.service-intro > h2', '.service-intro > p',
  '.service-card > h3', '.service-card > p',
  '.section-heading .eyebrow', '.section-heading h2', '.section-heading > p',
  '.appliance-section-heading > .eyebrow', '.appliance-section-heading > h2', '.appliance-section-heading > p',
  '.calculator-section > .eyebrow', '.calculator-section > h2', '.calculator-section > p',
  '.process-step > h3', '.process-step > p',
  '.testimonials-inner .eyebrow', '.testimonials-inner h2', '.testimonials-inner p',
  '.faq-intro > .eyebrow', '.faq-intro > h2', '.faq-intro > p',
  '.bottom-cta .eyebrow', '.bottom-cta h2', '.bottom-cta p',
].join(', ')
const clamp = (value: number) => Math.max(0, Math.min(1, value))
const ease = (value: number) => value * value * (3 - 2 * value)

export default function useScrollEffects(locked: boolean) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let dispose = () => {}
    const setup = () => {
      dispose()
      if (media.matches || locked) return
      const root = document.documentElement
      const items = Array.from(document.querySelectorAll<HTMLElement>(TEXT_TARGETS)).map((element, index) => ({ element, y: 0, stagger: index % 3 * .015 }))
      const lenis = new Lenis({
        autoRaf: true,
        lerp: .085,
        smoothWheel: true,
        syncTouch: false,
        anchors: { duration: 1.2 },
        prevent: node => !!node.closest('.modal-backdrop, .nav-links.open, textarea, select, input'),
      })
      let frame = 0
      const update = () => {
        frame = 0
        const height = window.innerHeight
        const compact = window.innerWidth <= 800
        const header = document.querySelector('header')?.getBoundingClientRect().height ?? 80
        // Read the full batch before writing, keeping scrolling free of layout thrashing.
        const values = items.map(item => {
          const rect = item.element.getBoundingClientRect()
          const top = rect.top - item.y
          const bottom = top + rect.height
          const enterStart = height * (.96 - item.stagger)
          const enterEnd = height * (.72 - item.stagger)
          const enter = ease(clamp((enterStart - top) / (enterStart - enterEnd)))
          const exit = ease(clamp((bottom - header - 12) / (height * .14)))
          // Keep a whole heading readable while it occupies the middle of the viewport.
          const progress = Math.min(enter, exit)
          return { opacity: progress, y: (1 - enter) * (compact ? 16 : 28) - (1 - exit) * 12, x: (1 - enter) * (item.element.matches('h1, h2') ? (compact ? -8 : -18) : 0) }
        })
        items.forEach((item, index) => {
          const value = values[index]
          item.y = value.y
          item.element.style.setProperty('--scroll-opacity', value.opacity.toFixed(3))
          item.element.style.setProperty('--scroll-x', `${value.x.toFixed(2)}px`)
          item.element.style.setProperty('--scroll-y', `${value.y.toFixed(2)}px`)
        })
      }
      const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
      items.forEach(({ element }) => element.classList.add('scroll-reveal-text'))
      root.classList.add('scroll-effects-enabled')
      update()
      window.addEventListener('scroll', schedule, { passive: true })
      window.addEventListener('resize', schedule)
      const resize = new ResizeObserver(schedule)
      resize.observe(document.body)
      dispose = () => {
        lenis.destroy()
        cancelAnimationFrame(frame)
        resize.disconnect()
        window.removeEventListener('scroll', schedule)
        window.removeEventListener('resize', schedule)
        root.classList.remove('scroll-effects-enabled')
        items.forEach(({ element }) => {
          element.classList.remove('scroll-reveal-text')
          for (const property of ['--scroll-opacity', '--scroll-x', '--scroll-y']) element.style.removeProperty(property)
        })
      }
    }
    setup()
    media.addEventListener('change', setup)
    return () => { dispose(); media.removeEventListener('change', setup) }
  }, [locked])
}
