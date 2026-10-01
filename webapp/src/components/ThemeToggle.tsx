'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="bg-card w-full p-4 rounded-2xl flex items-center justify-between border border-border/50 shadow-sm hover:bg-muted transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </div>
        <div>
          <span className="font-semibold text-sm text-foreground block">
            Aparência
          </span>
          <span className="text-[11px] text-muted-foreground">
            {theme === 'light' ? 'Tema Claro' : 'Tema Escuro'}
          </span>
        </div>
      </div>
      <span className="material-symbols-outlined text-muted-foreground text-[20px]">
        sync_alt
      </span>
    </button>
  );
}
