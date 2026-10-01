'use client';

import * as motion from "framer-motion/client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePasswordAction } from '../actions/authActions';
import { toast } from 'react-hot-toast';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    const p1 = formData.get('password') as string;
    const p2 = formData.get('confirmPassword') as string;

    if (p1 !== p2) {
      toast.error("As senhas não coincidem!");
      return;
    }

    if (p1.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const res = await updatePasswordAction(p1);
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Senha alterada com sucesso!");
      router.push('/login');
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 w-full h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/3 bg-primary/10 -skew-y-6 transform origin-top-left -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-card p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border"
      >
        <div className="flex flex-col items-center mb-8 gap-3 text-center">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary font-bold text-3xl shadow-sm mb-2">
            <span className="material-symbols-outlined text-3xl">key</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Nova Senha</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Crie uma nova senha segura para sua conta.
          </p>
        </div>

        <form action={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground/80">Nova Senha</label>
            <input 
              type="password" 
              name="password"
              required
              placeholder="••••••••"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground/80">Confirmar Nova Senha</label>
            <input 
              type="password" 
              name="confirmPassword"
              required
              placeholder="••••••••"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 shadow-[0_8px_30px_rgb(0,105,72,0.2)]"
          >
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
