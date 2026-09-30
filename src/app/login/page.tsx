'use client';

import { motion } from "framer-motion";
import { loginAction } from '../actions/authActions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const res = await loginAction(formData);
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Login realizado com sucesso!");
      router.push('/');
    }
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-background relative overflow-hidden">
      {/* Background Decorator */}
      <div className="absolute top-0 left-0 w-full h-1/3 bg-primary/10 -skew-y-6 transform origin-top-left -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm my-auto flex flex-col items-center"
      >
        <div className="flex flex-col items-center mb-6 gap-2 text-center">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-lg shadow-primary/30">
            $
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Meu DinDin</h1>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Acesse sua conta para organizar suas finanças</p>
        </div>

        <div className="w-full bg-card p-6 sm:p-8 rounded-[2rem] shadow-xl border border-border">
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/80">E-mail</label>
              <input 
                type="email" 
                name="email" 
                required 
                placeholder="seu@email.com"
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-foreground/80">Senha</label>
                <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 pr-12 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <span className="material-symbols-outlined text-base">login</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Link para criar conta */}
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4">
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="font-bold text-primary hover:underline">
            Crie sua conta
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
