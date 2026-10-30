import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

// Hero card: three 5-second install clips that play one after another and loop.
// Clips live in public/videos. Muted + playsInline so browsers allow autoplay.
const clips = [
  { src: '/videos/install-1.mp4', poster: '/videos/install-1.jpg', label: 'AIZEK install clip 1' },
  { src: '/videos/install-2.mp4', poster: '/videos/install-2.jpg', label: 'AIZEK install clip 2' },
  { src: '/videos/install-3.mp4', poster: '/videos/install-3.jpg', label: 'AIZEK install clip 3' },
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
      aria-label={clip.label}
      onEnded={() => setIndex(current => (current + 1) % clips.length)}
    />
    <div className="hero-video-bar">
      <span>Real installs by the AIZEK team</span>
      <span className="hero-video-dots" aria-hidden="true">{clips.map((item, i) => <i key={item.src} className={i === index ? 'active' : ''} />)}</span>
      <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play video' : 'Pause video'}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>
    </div>
  </div>
}
