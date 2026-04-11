"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          router.replace("/");
          return;
        }
      } catch {
        // sem ação por enquanto
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErro("");

    if (!email.trim() || !senha.trim()) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        setErro("E-mail ou senha inválidos.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setErro("Não foi possível fazer login.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <section className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6 py-10">
          <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-center shadow-lg shadow-black/20">
            <p className="text-sm text-zinc-400">Verificando sessão...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
        <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg shadow-black/20">
          <div className="mb-8 space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Jornada Gamer
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Entrar</h1>
            <p className="text-sm text-zinc-400">
              Acesse sua conta para continuar sua jornada.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-zinc-300">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="senha" className="text-sm text-zinc-300">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
              />
            </div>

            {erro ? (
              <div className="rounded-2xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                {erro}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-sm text-zinc-400">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="text-zinc-100 hover:underline">
              Criar conta
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}