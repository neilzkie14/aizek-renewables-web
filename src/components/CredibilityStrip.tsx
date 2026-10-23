import { useState } from 'react'
import { ArrowDown, Compass, Pause, Play, ShieldCheck, Sun } from 'lucide-react'

const messages = [
  { Icon: Sun, text: 'Made for everyday energy' },
  { Icon: Compass, text: 'Sized around your needs' },
  { Icon: ShieldCheck, text: 'Planned with care' },
]

export default function CredibilityStrip() {
  const [paused, setPaused] = useState(false)

  return <div className="container credibility credibility-marquee" aria-label="Our approach to solar">
    <div className="credibility-window">
      <div className="credibility-track" data-paused={paused}>
        {[0, 1].map(copy => <div className="credibility-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
          {messages.map(({ Icon, text }) => <span className="credibility-message" key={text}><Icon size={21} aria-hidden="true" /><span>{text}</span></span>)}
        </div>)}
      </div>
    </div>
    <div className="credibility-actions">
      <a className="credibility-link" href="#calculator">Find your solar fit <ArrowDown size={15} /></a>
      <button className="credibility-pause" type="button" aria-pressed={paused}
        aria-label={paused ? 'Resume scrolling messages' : 'Pause scrolling messages'} onClick={() => setPaused(value => !value)}>
        {paused ? <Play size={14} /> : <Pause size={14} />}
      </button>
    </div>
  </div>
}
