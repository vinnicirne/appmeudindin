'use client'

export function ConfirmModal({ isOpen, title, description, onConfirm, onCancel }: {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 mb-2">
          <span className="material-symbols-outlined text-2xl">warning</span>
        </div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        
        <div className="flex gap-3 mt-4 w-full">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-rose-600 text-white text-sm font-bold shadow-md hover:bg-rose-700 transition-colors">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
