'use client';

import { motion } from "framer-motion";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { forgotPasswordAction } from '../actions/authActions';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const res = await forgotPasswordAction(formData);
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      setSuccess(true);
      toast.success("E-mail enviado!");
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
            <span className="material-symbols-outlined text-3xl">lock_reset</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Recuperar Senha</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Digite seu e-mail para receber um link de recuperação.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col gap-4 items-center">
            <div className="p-4 bg-[#1db576]/10 border border-[#1db576]/30 rounded-xl text-center text-sm font-semibold text-[#1db576]">
              Email de recuperação enviado! Verifique sua caixa de entrada (e o spam).
            </div>
            <Link href="/login" className="w-full mt-2">
              <button className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:bg-primary/90 transition-colors">
                Voltar para o Login
              </button>
            </Link>
          </div>
        ) : (
          <form action={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground/80">E-mail</label>
              <input 
                type="email" 
                name="email"
                required
                placeholder="seu@email.com"
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 shadow-[0_8px_30px_rgb(0,105,72,0.2)]"
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
            
            <Link href="/login" className="text-sm font-bold text-muted-foreground hover:text-primary text-center mt-2">
              Lembrei minha senha!
            </Link>
          </form>
        )}
      </motion.div>
    </main>
  );
}
