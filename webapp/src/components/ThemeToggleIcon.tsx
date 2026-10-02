'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

export function ThemeToggleIcon() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const icon = mounted ? (theme === 'light' ? 'dark_mode' : 'light_mode') : 'contrast';

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      title="Mudar Aparência"
      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
    >
      <span className="material-symbols-outlined text-[24px]">
        {icon}
      </span>
    </button>
  );
}
