'use client'

import { useEffect } from 'react'

export function GlobalClickLogger() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      console.log('CLICK GLOBAL - Target:', el.tagName, el.className, el.id);
    }
    document.addEventListener('click', handler, true); // true = capture phase
    return () => document.removeEventListener('click', handler, true);
  }, []);
  
  return null;
}
