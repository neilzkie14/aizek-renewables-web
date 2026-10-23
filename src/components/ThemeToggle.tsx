import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'aizek-theme'

function savedNightMode() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark'
  } catch {
    return document.documentElement.dataset.theme === 'dark'
  }
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(savedNightMode)
  const switching = useRef(false)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  useEffect(() => () => {
    clearTimeout(fadeTimer.current)
    delete document.documentElement.dataset.themeTransition
  }, [])

  const toggleTheme = async (event: MouseEvent<HTMLButtonElement>) => {
    if (switching.current) return
    const root = document.documentElement
    const next = !dark
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

    const applyTheme = () => {
      root.dataset.theme = next ? 'dark' : 'light'
      flushSync(() => setDark(next))
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
      } catch {
        // Theme switching still works when storage is unavailable.
      }
    }

    if (reducedMotion) {
      applyTheme()
      return
    }

    // Older browsers receive a gentle color fade instead of a circular reveal.
    if (typeof document.startViewTransition !== 'function') {
      switching.current = true
      root.dataset.themeTransition = 'fade'
      applyTheme()
      fadeTimer.current = setTimeout(() => {
        delete root.dataset.themeTransition
        switching.current = false
      }, 650)
      return
    }

    switching.current = true
    root.dataset.themeTransition = 'reveal'
    let transition: ViewTransition | undefined
    try {
      transition = document.startViewTransition(applyTheme)
      await transition.ready
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)', fill: 'both' },
      )
      await transition.finished
    } catch {
      transition?.skipTransition()
      applyTheme()
    } finally {
      delete root.dataset.themeTransition
      switching.current = false
    }
  }

  const label = dark ? 'Switch to day mode' : 'Switch to night mode'
  return <button type="button" className="theme-toggle" onClick={toggleTheme}
    aria-label={label} aria-pressed={dark} title={label}>
    <span className="theme-toggle-icons" aria-hidden="true">
      <Sun size={18} className="theme-icon-sun" />
      <Moon size={18} className="theme-icon-moon" />
    </span>
  </button>
}
