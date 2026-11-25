// Home-screen install support (Android/desktop prompt, iOS instructions).
import { useEffect, useState } from 'react';

interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallEvent; listeners.forEach((f) => f()); });
  window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach((f) => f()); });
}

export const isStandalone = () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
export const isIos = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

export function useInstall() {
  const [, bump] = useState(0);
  useEffect(() => { const f = () => bump((n) => n + 1); listeners.add(f); return () => { listeners.delete(f); }; }, []);
  return {
    installed: isStandalone(),
    canPrompt: !!deferred,
    ios: isIos() && !isStandalone(),
    install: async () => { if (!deferred) return false; await deferred.prompt(); const c = await deferred.userChoice; deferred = null; listeners.forEach((f) => f()); return c.outcome === 'accepted'; },
  };
}
