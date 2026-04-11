"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CadastroPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMensagem("");
    setErro("");

    if (!nome.trim() || !email.trim() || !senha.trim() || !confirmarSenha.trim()) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      // 1. Criar usuário no Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        setErro(error.message);
        return;
      }

      const user = data.user;

      if (!user) {
        setErro("Erro ao criar usuário.");
        return;
      }

      // 2. Inserir perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: user.id,
            email: email.trim(),
            display_name: nome.trim(),
          },
        ]);

      if (profileError) {
        console.error(profileError);
        setErro("Conta criada, mas erro ao salvar perfil.");
        return;
      }

      setMensagem("Conta criada com sucesso. Você já pode entrar.");

      setNome("");
      setEmail("");
      setSenha("");
      setConfirmarSenha("");

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      console.error(err);
      setErro("Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
        <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg shadow-black/20">
          <div className="mb-8 space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Jornada Gamer
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Criar conta</h1>
            <p className="text-sm text-zinc-400">
              Cadastre seu acesso para começar sua jornada.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NOME */}
            <div className="space-y-2">
              <label htmlFor="nome" className="text-sm text-zinc-300">
                Nome
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome ou nickname"
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
              />
            </div>

            {/* EMAIL */}
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

            {/* SENHA */}
            <div className="space-y-2">
              <label htmlFor="senha" className="text-sm text-zinc-300">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
              />
            </div>

            {/* CONFIRMAR SENHA */}
            <div className="space-y-2">
              <label
                htmlFor="confirmarSenha"
                className="text-sm text-zinc-300"
              >
                Confirmar senha
              </label>
              <input
                id="confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita sua senha"
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
              />
            </div>

            {erro ? (
              <div className="rounded-2xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                {erro}
              </div>
            ) : null}

            {mensagem ? (
              <div className="rounded-2xl border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
                {mensagem}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <div className="mt-6 text-sm text-zinc-400">
            Já tem conta?{" "}
            <Link href="/login" className="text-zinc-100 hover:underline">
              Entrar
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}