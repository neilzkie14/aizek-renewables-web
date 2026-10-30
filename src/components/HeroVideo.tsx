import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

// Hero card: three 5-second install clips that play one after another and loop.
// Clips live in public/videos. Muted + playsInline so browsers allow autoplay.
const clips = [
  { src: '/videos/install-1.mp4', poster: '/videos/install-1.jpg', title: 'Turnover Walkthroughs', caption: 'Main panel board termination' },
  { src: '/videos/install-2.mp4', poster: '/videos/install-2.jpg', title: 'Turnover Walkthroughs', caption: 'Solis app basic parameter settings' },
  { src: '/videos/install-3.mp4', poster: '/videos/install-3.jpg', title: 'Turnover Walkthroughs', caption: 'Solar panel board layout and shutdown sequence' },
]

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const clip = clips[index]

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (paused) video.pause()
    else video.play().catch(() => setPaused(true))
  }, [index, paused])

  return <div className="hero-visual hero-video">
    <video
      ref={videoRef}
      key={clip.src}
      src={clip.src}
      poster={clip.poster}
      muted
      playsInline
      autoPlay={!paused}
      preload="metadata"
      aria-label={`${clip.title}: ${clip.caption}`}
      onEnded={() => setIndex(current => (current + 1) % clips.length)}
    />
    <div className="hero-video-bar">
      <span className="hero-video-caption" aria-live="polite">
        <strong>{clip.title}</strong>
        <small>{clip.caption}</small>
      </span>
      <span className="hero-video-dots" aria-hidden="true">{clips.map((item, i) => <i key={item.src} className={i === index ? 'active' : ''} />)}</span>
      <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play video' : 'Pause video'}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>
    </div>
  </div>
}
