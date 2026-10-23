import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react'
import { MoveUpRight, Pause, Play, Zap } from 'lucide-react'

const CENTER = 200
const RADIUS = 172

function clampPoint(x: number, y: number) {
  const dx = x - CENTER
  const dy = y - CENTER
  const scale = Math.min(1, RADIUS / (Math.hypot(dx, dy) || 1))
  return { x: CENTER + dx * scale, y: CENTER + dy * scale }
}

// Smooth bends rather than rapid random flashes keep the current gentle.
function currentPath(x: number, y: number, time: number, branch = false) {
  const dx = x - CENTER
  const dy = y - CENTER
  const distance = Math.hypot(dx, dy) || 1
  const normal = { x: -dy / distance, y: dx / distance }
  const amplitude = Math.min(13, distance / 12)
  const phase = time / 650
  const points = Array.from({ length: 13 }, (_, index) => {
    const progress = index / 12
    const envelope = Math.sin(progress * Math.PI)
    const wave = Math.sin(index * 1.85 + phase + (branch ? 2.2 : 0)) * amplitude * envelope
    return {
      x: CENTER + dx * progress + normal.x * wave,
      y: CENTER + dy * progress + normal.y * wave,
    }
  })
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')
}

export default function EnergyOrb() {
  const stageRef = useRef<HTMLButtonElement>(null)
  const orientationRef = useRef<HTMLPictureElement>(null)
  const orientation = useRef({ x: 0, y: 0, angle: 0 })
  const mainRef = useRef<SVGPathElement>(null)
  const glowRef = useRef<SVGPathElement>(null)
  const branchRef = useRef<SVGPathElement>(null)
  const tipRef = useRef<SVGCircleElement>(null)
  const targetRef = useRef({ x: 305, y: 115 })
  const drawRef = useRef<(time: number) => void>(() => {})
  const [active, setActive] = useState(false)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [visible, setVisible] = useState(true)
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)
  const motionEnabled = !paused && !reducedMotion && visible && pageVisible

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(media.matches)
    const updateVisibility = () => setPageVisible(!document.hidden)
    media.addEventListener('change', updatePreference)
    document.addEventListener('visibilitychange', updateVisibility)
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 })
    if (stageRef.current) observer.observe(stageRef.current)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', updatePreference)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  // A single page-wide pointer listener steers the artwork without React renders.
  // The inner image keeps its independent, gentle 20-second rotation.
  useEffect(() => {
    if (!motionEnabled) return
    const target = { ...orientation.current }
    let frame = 0
    let previousTime = 0
    const followPointer = (event: globalThis.PointerEvent) => {
      const rect = stageRef.current?.getBoundingClientRect()
      if (!rect) return
      const dx = event.clientX - (rect.left + rect.width / 2)
      const dy = event.clientY - (rect.top + rect.height / 2)
      target.x = Math.max(-12, Math.min(12, -dy / window.innerHeight * 24))
      target.y = Math.max(-12, Math.min(12, dx / window.innerWidth * 24))
      if (Math.hypot(dx, dy) > 12) {
        const angle = Math.atan2(dy, dx) * 180 / Math.PI
        // Take the shortest route when the cursor crosses the angle's seam.
        target.angle = orientation.current.angle + ((angle - orientation.current.angle + 540) % 360 + 360) % 360 - 180
      }
    }
    const reset = () => Object.assign(target, { x: 0, y: 0, angle: orientation.current.angle })
    const animate = (time: number) => {
      const smoothing = 1 - Math.exp(-Math.min(time - previousTime, 64) / 180)
      previousTime = time
      const current = orientation.current
      current.x += (target.x - current.x) * smoothing
      current.y += (target.y - current.y) * smoothing
      current.angle += (target.angle - current.angle) * smoothing
      if (orientationRef.current) {
        orientationRef.current.style.transform = `perspective(800px) rotateX(${current.x}deg) rotateY(${current.y}deg) rotateZ(${current.angle}deg)`
      }
      frame = requestAnimationFrame(animate)
    }
    window.addEventListener('pointermove', followPointer, { passive: true })
    document.documentElement.addEventListener('pointerleave', reset)
    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', followPointer)
      document.documentElement.removeEventListener('pointerleave', reset)
    }
  }, [motionEnabled])

  useEffect(() => {
    let frame = 0
    let lastFrame = 0
    const draw = (time: number) => {
      const { x, y } = targetRef.current
      const path = currentPath(x, y, time)
      mainRef.current?.setAttribute('d', path)
      glowRef.current?.setAttribute('d', path)
      branchRef.current?.setAttribute('d', currentPath(x, y, time, true))
      tipRef.current?.setAttribute('cx', String(x))
      tipRef.current?.setAttribute('cy', String(y))
    }
    drawRef.current = draw
    const animate = (time: number) => {
      if (time - lastFrame >= 1000 / 30) {
        draw(time)
        lastFrame = time
      }
      frame = requestAnimationFrame(animate)
    }
    if (active) {
      draw(performance.now())
      if (motionEnabled) frame = requestAnimationFrame(animate)
    }
    return () => cancelAnimationFrame(frame)
  }, [active, motionEnabled])

  const pointer = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width * 400
    const y = (event.clientY - rect.top) / rect.height * 400
    if (Math.hypot(x - CENTER, y - CENTER) > 186) {
      setActive(false)
      return
    }
    targetRef.current = clampPoint(x, y)
    setActive(true)
    drawRef.current(motionEnabled ? performance.now() : 0)
  }

  const keyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    const offsets: Record<string, [number, number]> = { ArrowLeft: [-18, 0], ArrowRight: [18, 0], ArrowUp: [0, -18], ArrowDown: [0, 18] }
    if (event.key === 'Escape') { setActive(false); return }
    const offset = offsets[event.key]
    if (!offset) return
    event.preventDefault()
    targetRef.current = clampPoint(targetRef.current.x + offset[0], targetRef.current.y + offset[1])
    setActive(true)
    drawRef.current(motionEnabled ? performance.now() : 0)
  }

  return <div className="hero-visual energy-visual">
    <div className="energy-panel-heading">
      <span><Zap size={13} /> A CURRENT OF POSSIBILITY</span>
      <button type="button" className="energy-pause" disabled={reducedMotion}
        onClick={() => setPaused(value => !value)}
        aria-label={reducedMotion ? 'Animation disabled by reduced motion preference' : paused ? 'Play energy animation' : 'Pause energy animation'}>
        {paused || reducedMotion ? <Play size={13} /> : <Pause size={13} />}
        <span>{reducedMotion ? 'Motion off' : paused ? 'Play' : 'Pause'}</span>
      </button>
    </div>
    <div className="energy-orb-wrap">
      <button ref={stageRef} type="button" className="energy-stage" data-active={active} data-animated={motionEnabled}
        aria-label="Explore the energy orb" aria-describedby="energy-orb-help"
        onPointerMove={pointer} onPointerDown={pointer}
        onPointerLeave={() => setActive(false)} onPointerCancel={() => setActive(false)}
        onBlur={() => setActive(false)} onKeyDown={keyboard}
        onClick={event => { if (event.detail === 0) { setActive(true); drawRef.current(0) } }}>
        <picture ref={orientationRef}>
          <img src="/images/energy-orb-still.jpg"
            alt="" width="360" height="360" draggable={false} decoding="async" />
        </picture>
        <svg className="energy-electricity" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
          <path ref={glowRef} className="energy-arc-glow" />
          <path ref={branchRef} className="energy-arc-branch" />
          <path ref={mainRef} className="energy-arc-core" />
          <circle ref={tipRef} r="5" className="energy-contact" />
          <circle cx="200" cy="200" r="7" className="energy-origin" />
        </svg>
      </button>
    </div>
    <div className="energy-panel-footer"><div><strong>Energy, in motion.</strong><p id="energy-orb-help">Move your pointer anywhere. Touch the orb for a spark.<span className="sr-only"> Press Enter to activate. Use arrow keys to move the current, and Escape to clear it.</span></p></div><MoveUpRight size={19} aria-hidden="true" /></div>
  </div>
}
