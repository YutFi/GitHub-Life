import { useEffect, useRef, useState } from 'react';
import { Logo } from './Logo';
import { audioReady, sfx, unlockAudio } from '../lib/sound';

/** Opening screen: logo, name and tagline with a short jingle. Fades out after about two seconds. */
export function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const played = useRef(false);

  useEffect(() => {
    const reduce = document.documentElement.classList.contains('reduce-motion') || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const play = () => { if (played.current) return; if (unlockAudio() || audioReady()) { played.current = true; sfx('splash'); } };
    // Installed apps are usually allowed to play straight away; otherwise the first touch unlocks sound.
    play();
    const tryLater = window.setTimeout(play, 120);
    const gesture = () => { window.setTimeout(play, 30); };
    window.addEventListener('pointerdown', gesture, { once: true });
    window.addEventListener('keydown', gesture, { once: true });
    const t1 = window.setTimeout(() => setLeaving(true), reduce ? 700 : 2300);
    const t2 = window.setTimeout(onDone, reduce ? 900 : 2800);
    return () => { clearTimeout(tryLater); clearTimeout(t1); clearTimeout(t2); window.removeEventListener('pointerdown', gesture); window.removeEventListener('keydown', gesture); };
  }, [onDone]);

  return (
    <div className={`splash${leaving ? ' leaving' : ''}`} role="presentation" aria-hidden={leaving}>
      <div className="splash-glow" />
      <div className="splash-center">
        <div className="splash-logo"><span className="ring r1" /><span className="ring r2" /><Logo size={116} /></div>
        <div className="splash-word">LifeVerse</div>
        <div className="splash-tag">Your life. Your decisions. Your consequences.</div>
      </div>
      <div className="splash-foot">Tap anywhere to enable sound</div>
    </div>
  );
}
