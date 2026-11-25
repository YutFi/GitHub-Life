import { Download, Share } from 'lucide-react';
import { useInstall } from '../lib/install';
import { useGame } from '../store/useGame';

/** "Add to home screen" helper: one-tap install where the browser allows it, instructions elsewhere. */
export function InstallBox() {
  const { installed, canPrompt, ios, install } = useInstall();
  const toast = useGame((s) => s.toast);
  if (installed) return <p className="text-sm text-muted">✅ LifeVerse is installed and running as an app.</p>;
  if (canPrompt) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Install LifeVerse on your home screen to play full screen, even offline.</p>
        <button className="btn btn-primary btn-sm shrink-0" onClick={async () => { if (await install()) toast('LifeVerse was added to your home screen.', 'good', '📲'); }}><Download size={15} /> Install</button>
      </div>
    );
  }
  if (ios) {
    return <p className="text-sm text-muted">To install on iPhone or iPad, tap <Share size={14} className="inline -translate-y-px" /> <b>Share</b> in Safari, then <b>Add to Home Screen</b>.</p>;
  }
  return <p className="text-sm text-muted">Open this page in Chrome, Edge or Safari and use <b>Install app</b> or <b>Add to Home Screen</b> from the browser menu to play it like an app.</p>;
}
