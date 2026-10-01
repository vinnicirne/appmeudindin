'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function Header() {
  const router = useRouter();

  function handleSearchClick() {
    // Redireciona para o extrato (onde ja existe a listagem de pesquisa)
    router.push('/transactions');
  }

  function handleNotificationsClick() {
    alert('As notificações Push estão sendo configuradas. Aguardando chaves do Firebase!');
  }

  return (
    <header className="sm:hidden flex items-center justify-between p-4 bg-background border-b border-border/50 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
          $
        </div>
        <h1 className="text-xl font-extrabold text-foreground tracking-tight">Meu DinDin</h1>
      </div>
      
      <div className="flex items-center gap-2 text-foreground">
        <button 
          onClick={handleSearchClick}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <span className="material-symbols-outlined text-[26px]">search</span>
        </button>
        
        <button 
          onClick={handleNotificationsClick}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors relative"
        >
          <span className="material-symbols-outlined text-[26px]">notifications</span>
          <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background"></span>
        </button>
      </div>
    </header>
  );
}