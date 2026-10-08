'use client';

import { AnimatePresence } from "framer-motion";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { addTransactionAction } from '@/app/actions/transactionActions';
import { useState, useEffect, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const EXPENSE_QUICK_TAGS = ['Supermercado', 'CombustÃ­vel', 'Restaurante', 'FarmÃ¡cia', 'Lazer', 'Uber'];
const INCOME_QUICK_TAGS = ['Salário', 'Freelance', 'Rendimentos', 'Venda', 'Reembolso'];



function AddTransactionForm() {
  const [CATEGORIES, setCATEGORIES] = useState<any[]>([]);

  useEffect(() => {
    import('@/app/actions/categoryActions').then((m) => {
      m.getCategoriesAction().then((data: any) => {
        if (data && data.length > 0) {
          setCATEGORIES(data.map((c: any) => ({ id: c.id, label: c.label, icon: c.icon, color: `text-${c.color}` })));
          // Previne id fantasma ('alimentacao' ou 'salario') caso tenham sido excluídos
          setCategory(prev => {
            const exists = data.some((c: any) => c.id === prev)
            return exists ? prev : data[0].id
          })
        }
      });
    });
  }, []);

  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [frequency, setFrequency] = useState<'UNICA' | 'PARCELADA' | 'FIXA'>('UNICA');
  const [installments, setInstallments] = useState(2);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('alimentacao');
  const [date, setDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'INCOME' || typeParam === 'EXPENSE') {
      setType(typeParam);
      if (typeParam === 'INCOME') {
        setCategory('salario');
      } else {
        setCategory('alimentacao');
      }
    }
  }, [searchParams]);

  function handleTypeChange(newType: 'EXPENSE' | 'INCOME') {
    setType(newType);
    if (newType === 'INCOME') {
      if (frequency === 'PARCELADA') setFrequency('UNICA');
      setCategory('salario');
    } else {
      setCategory('alimentacao');
    }
  }

  function handleQuickTag(tag: string) {
    setDescription(tag);
  }

  function getLocalDateStr(d: Date = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function setQuickDate(offsetDays: number) {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    setDate(getLocalDateStr(d));
  }

  const isToday = date === getLocalDateStr(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const isYesterday = date === getLocalDateStr(yesterdayDate);

  const formattedDisplayDate = () => {
    if (!date) return '';
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('type', type);
    formData.append('amount', amount.replace(',', '.'));
    formData.append('description', description);
    formData.append('date', date);
    formData.append('categoryId', category);
    formData.append('isRecurring', frequency === 'FIXA' ? 'true' : 'false');
    formData.append('installmentsTotal', frequency === 'PARCELADA' ? String(installments) : '1');
    if (notes) formData.append('notes', notes);

    const res = await addTransactionAction(formData);

    setLoading(false);
    if (res?.error) {
      toast.error('Erro: ' + res.error);
    } else {
      toast.success('Lançamento adicionado!');
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
        router.push('/');
    }
  }

  const quickTags = type === 'EXPENSE' ? EXPENSE_QUICK_TAGS : INCOME_QUICK_TAGS;

  return (
    <main className="flex-1 flex flex-col max-w-md mx-auto w-full bg-white dark:bg-card min-h-screen pb-10">
      {/* Top Handle bar & Header */}
      <div className="px-6 pt-3 pb-2">
        <div className="w-12 h-1 bg-gray-300 dark:bg-muted-foreground/30 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900 dark:text-foreground tracking-tight">
            Nova TransaÃ§Ã£o
          </h1>
          <Link
            href="/"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-700 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-5">
        {/* Toggle Despesa / Receita */}
        <div className="grid grid-cols-2 gap-2 bg-[#f4f6f8] dark:bg-muted/60 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => handleTypeChange('EXPENSE')}
            className={`py-3 rounded-xl font-extrabold text-sm transition-all duration-200 ${
              type === 'EXPENSE'
                ? 'bg-[#ea3838] text-white shadow-md shadow-red-500/20'
                : 'text-gray-600 dark:text-muted-foreground hover:text-foreground'
            }`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('INCOME')}
            className={`py-3 rounded-xl font-extrabold text-sm transition-all duration-200 ${
              type === 'INCOME'
                ? 'bg-[#10b981] text-white shadow-md shadow-emerald-500/20'
                : 'text-gray-600 dark:text-muted-foreground hover:text-foreground'
            }`}
          >
            Receita
          </button>
        </div>

        {/* Frequência / Tipo de Lançamento */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-600 dark:text-muted-foreground">
            Frequência / Tipo de Lançamento
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFrequency('UNICA')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                frequency === 'UNICA'
                  ? 'bg-[#c6f6e5] text-[#0d7355] border-[#9ae6b4] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-card text-gray-700 dark:text-foreground border-gray-200 dark:border-border hover:bg-gray-50'
              }`}
            >
              Única
            </button>

            {type === 'EXPENSE' && (
              <button
                type="button"
                onClick={() => setFrequency('PARCELADA')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  frequency === 'PARCELADA'
                    ? 'bg-[#c6f6e5] text-[#0d7355] border-[#9ae6b4] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-card text-gray-700 dark:text-foreground border-gray-200 dark:border-border hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-sm">credit_card</span>
                Parcelada
              </button>
            )}

            <button
              type="button"
              onClick={() => setFrequency('FIXA')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                frequency === 'FIXA'
                  ? 'bg-[#c6f6e5] text-[#0d7355] border-[#9ae6b4] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-card text-gray-700 dark:text-foreground border-gray-200 dark:border-border hover:bg-gray-50'
              } ${type === 'INCOME' ? 'col-span-2' : ''}`}
            >
              <span className="material-symbols-outlined text-sm">sync_alt</span>
              Fixa Mensal
            </button>
          </div>

          {frequency === 'PARCELADA' && type === 'EXPENSE' && (
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/60 mt-1">
              <span className="text-xs font-bold text-foreground">NÃºmero de parcelas:</span>
              <input
                type="number"
                min="2"
                max="72"
                value={installments}
                onChange={e => setInstallments(parseInt(e.target.value) || 2)}
                className="w-16 px-2 py-1 bg-card border border-border rounded-lg text-center font-bold text-xs"
              />
              <span className="text-xs text-muted-foreground">x vezes</span>
            </div>
          )}
        </div>

        {/* Campo de Valor */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-600 dark:text-muted-foreground">
            {frequency === 'PARCELADA' ? 'Valor Total da Compra (R$)' : 'Valor (R$)'}
          </label>
          <div className="relative flex items-center">
            <div className="w-full flex items-center px-4 py-3.5 bg-white dark:bg-card border border-blue-100 dark:border-border rounded-2xl shadow-sm focus-within:border-emerald-500 transition-all">
              <span className={`text-base font-extrabold mr-2 ${type === 'EXPENSE' ? 'text-[#ea3838]' : 'text-[#10b981]'}`}>
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-transparent outline-none text-base font-bold text-gray-800 dark:text-foreground placeholder:text-gray-400"
              />
            </div>
          </div>
          {frequency === 'PARCELADA' && type === 'EXPENSE' && amount && !isNaN(parseFloat(amount.replace(',', '.'))) && (
            <div className="mt-1 flex gap-2 items-start p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl">
              <span className="material-symbols-outlined text-blue-500 text-lg shrink-0">info</span>
              <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-snug">
                O sistema lanÃ§arÃ¡ automaticamente <strong className="font-black">{installments} parcelas de R$ {(parseFloat(amount.replace(',', '.')) / installments).toFixed(2).replace('.', ',')}</strong> para os prÃ³ximos meses.
              </p>
            </div>
          )}
        </div>

        {/* Descrição / Título */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-600 dark:text-muted-foreground">
            Descrição / Título
          </label>
          <div className="w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-card border border-blue-100 dark:border-border rounded-2xl shadow-sm focus-within:border-emerald-500 transition-all">
            <span className="font-serif font-black text-gray-400 text-lg">T</span>
            <input
              type="text"
              required
              placeholder={type === 'EXPENSE' ? 'Ex: Supermercado, Aluguel...' : 'Ex: Salário Mensal, PensÃ£o AlimentÃ­cia...'}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-transparent outline-none text-xs md:text-sm font-medium text-gray-800 dark:text-foreground placeholder:text-gray-400"
            />
          </div>

          {/* Quick Tags Pills */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {quickTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickTag(tag)}
                className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
                  description === tag
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-[#f4f6f8] dark:bg-muted text-gray-600 dark:text-muted-foreground hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Categoria */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-600 dark:text-muted-foreground">
            Categoria
          </label>
          <div className="relative w-full">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              disabled={CATEGORIES.length === 0}
              className="w-full px-4 py-3.5 bg-white dark:bg-card border border-blue-100 dark:border-border rounded-2xl shadow-sm appearance-none font-bold text-xs md:text-sm text-gray-800 dark:text-foreground outline-none focus:border-emerald-500 pr-10 disabled:opacity-50"
            >
              {CATEGORIES.length === 0 ? (
                <option value="">Carregando categorias...</option>
              ) : (
                CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))
              )}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base">
              arrow_drop_down
            </span>
          </div>
        </div>

        {/* Data de InÃ­cio */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-600 dark:text-muted-foreground">
            Data de InÃ­cio
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setQuickDate(0)}
              className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${
                isToday
                  ? 'bg-[#c6f6e5] text-[#0d7355] border border-[#9ae6b4] dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-[#f4f6f8] dark:bg-muted text-gray-600 dark:text-muted-foreground hover:bg-gray-200'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(1)}
              className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${
                isYesterday
                  ? 'bg-[#c6f6e5] text-[#0d7355] border border-[#9ae6b4] dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-[#f4f6f8] dark:bg-muted text-gray-600 dark:text-muted-foreground hover:bg-gray-200'
              }`}
            >
              Ontem
            </button>

            {/* Seletor de Data Direto e ConfiÃ¡vel */}
            <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              !isToday && !isYesterday
                ? 'bg-[#c6f6e5] text-[#0d7355] border-[#9ae6b4] dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-[#f4f6f8] dark:bg-muted text-gray-700 dark:text-foreground border-transparent hover:bg-gray-200'
            }`}>
              <span className="material-symbols-outlined text-sm text-[#0d7355] dark:text-emerald-400 pointer-events-none">
                calendar_today
              </span>
              <input
                id="transaction-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-800 dark:text-foreground cursor-pointer outline-none border-none p-0 focus:ring-0"
              />
            </div>
          </div>
        </div>

        {/* ObservaÃ§Ãµes (Opcional) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-600 dark:text-muted-foreground">
            ObservaÃ§Ãµes (Opcional)
          </label>
          <div className="w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-card border border-blue-100 dark:border-border rounded-2xl shadow-sm focus-within:border-emerald-500 transition-all">
            <span className="material-symbols-outlined text-gray-400 text-lg">note</span>
            <input
              type="text"
              placeholder="Ex: Cartão Nubank, Carnê Magazine, etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-transparent outline-none text-xs md:text-sm font-medium text-gray-800 dark:text-foreground placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* BotÃ£o Salvar TransaÃ§Ã£o */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-4 rounded-2xl bg-[#00875a] hover:bg-[#00744d] active:scale-[0.99] text-white font-black text-sm md:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">check</span>
          {loading ? 'Salvando...' : 'Salvar TransaÃ§Ã£o'}
        </button>
      </form>
    </main>
  );
}

export default function AddTransaction() {
  return (
    <Suspense fallback={<div className="p-6">Carregando...</div>}>
      <AddTransactionForm />
    </Suspense>
  );
}

