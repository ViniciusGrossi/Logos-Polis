'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const bodyArgs = isRegistering ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyArgs),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro na operação de acesso');
      }

      router.push('/');
      router.refresh();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#131313] text-[#e5e2e1] flex font-sans">
      {/* 
        Extreme Asymmetry (65 / 35 Split)
        Left: Editorial Narrative (65%)
      */}
      <div className="hidden lg:flex flex-col justify-between w-[65%] p-16 border-r border-[#1c1b1b]/50 relative overflow-hidden">
        {/* Subtle Background Elements for depth */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#abd600]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[500px] bg-[#1c1b1b] rounded-tr-[100px] blur-[150px] -translate-x-1/4 translate-y-1/4" />
        
        <div className="relative z-10 flex flex-col items-start">
          <h1 className="text-[#abd600] font-serif font-black italic tracking-tighter text-3xl">LOGOS POLIS</h1>
          <div className="mt-6 flex items-center gap-4">
            <span className="font-mono text-xs tracking-[0.2em] text-[#c4c9ae] px-2 py-1 bg-[#1c1b1b] rounded-sm">TERMINAL 01</span>
            <span className="font-mono text-xs tracking-[0.1em] text-[#c4c9ae]/70">INTELIGÊNCIA SOBERANA</span>
          </div>
        </div>

        <div className="relative z-10 mb-24">
          <h2 className="font-serif text-8xl xl:text-9xl leading-[0.85] tracking-tight font-black text-white mix-blend-difference mb-8">
            DOMINE <br/>
            <span className="italic font-light text-[#abd600]">O</span><br/>
            CENÁRIO.
          </h2>
          <p className="font-mono text-sm max-w-md text-[#c4c9ae] leading-relaxed uppercase">
            SISTEMA DE INTELIGÊNCIA EXECUTIVA. <br />
            MONITORAMENTO ESTRATÉGICO DE TERRITÓRIO E INFLUÊNCIA.
          </p>
        </div>

        <div className="relative z-10 flex gap-12 font-mono text-[10px] tracking-widest text-[#444934] uppercase">
          <div>LAT: -15.7975° S</div>
          <div>LON: -47.8919° W</div>
          <div>SYS: ONLINE</div>
        </div>
      </div>

      {/* 
        Right: Login Auth Terminal (35%)
      */}
      <div className="w-full lg:w-[35%] flex flex-col justify-center p-8 lg:p-16 relative bg-[#1c1b1b] lg:bg-transparent">
        <div className="w-full max-w-sm mx-auto p-10 bg-[#2a2a2a]/40 backdrop-blur-xl border border-[#444934]/20 rounded-sm shadow-2xl relative">
          
          <div className="absolute top-0 left-0 w-1 h-full bg-[#abd600]" />

          <div className="mb-12">
             <h3 className="font-mono text-xl font-bold text-white mb-2 tracking-tight">
               {isRegistering ? 'CREDENCIAMENTO' : 'AUTORIZAÇÃO'}
             </h3>
             <p className="font-mono text-xs text-[#c4c9ae]">CODENAME: LOGOS_POLIS</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 flex flex-col">
            {error && (
              <div className="font-mono text-[11px] text-[#ffb4ab] bg-[#93000a]/20 p-3 rounded-sm border border-[#93000a]/50">
                [ERR] {error}
              </div>
            )}

            {isRegistering && (
              <div className="space-y-2 group">
                <label className="block font-mono text-[10px] tracking-widest text-[#c4c9ae] uppercase">
                  Nome do Operador
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#131313] border-b-2 border-transparent focus:border-[#abd600] text-white font-mono text-sm p-3 outline-none transition-all placeholder-[#444934] rounded-t-sm"
                  placeholder="Nome Completo"
                  required={isRegistering}
                />
              </div>
            )}

            <div className="space-y-2 group">
              <label className="block font-mono text-[10px] tracking-widest text-[#c4c9ae] uppercase">
                Endereço de Acesso
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#131313] border-b-2 border-transparent focus:border-[#abd600] text-white font-mono text-sm p-3 outline-none transition-all placeholder-[#444934] rounded-t-sm"
                placeholder="operativo@logospolis.com.br"
                required
              />
            </div>

            <div className="space-y-2 group">
              <label className="block font-mono text-[10px] tracking-widest text-[#c4c9ae] uppercase">
                Código de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#131313] border-b-2 border-transparent focus:border-[#abd600] text-white font-mono text-sm p-3 outline-none transition-all placeholder-[#444934] rounded-t-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative flex items-center justify-center p-4 bg-[#abd600] hover:bg-[#c6f332] text-[#161e00] font-mono font-bold tracking-widest text-xs uppercase transition-all rounded-sm overflow-hidden mt-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isRegistering ? 'PROCESSANDO...' : 'AUTENTICANDO...'}
                  </>
                ) : (
                  isRegistering ? 'SOLICITAR CREDENCIAL' : 'INGRESSAR NO SISTEMA'
                )}
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>
            
            <button
              type="button"
              onClick={() => {
                setError('');
                setIsRegistering(!isRegistering);
              }}
              className="mt-4 font-mono text-[10px] text-center w-full uppercase text-[#444934] hover:text-[#c4c9ae] tracking-widest transition-colors"
            >
              [ {isRegistering ? 'Alternar para acesso existente' : 'Requisitar nova credencial'} ]
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
