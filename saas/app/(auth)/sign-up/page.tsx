"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erro ao criar conta.");
      setLoading(false);
      return;
    }

    // Auto login após cadastro
    const loginRes = await signIn("credentials", { email, password, redirect: false });
    if (loginRes?.error) {
      router.push("/sign-in");
    } else {
      router.push("/inicio");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFEF9] px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine mb-3">
            <span className="text-white text-2xl">✝</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-800">Comece sua jornada</h1>
          <p className="text-sm text-slate-400 mt-1">Crie sua conta gratuita</p>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/inicio" })}
          className="w-full py-3 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-3 mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          Criar conta com o Google
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">ou crie com email</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="divine-card p-6 flex flex-col gap-4">
          {[
            { label: "Nome", value: name, set: setName, type: "text", placeholder: "Seu nome" },
            { label: "Email", value: email, set: setEmail, type: "email", placeholder: "seu@email.com" },
            { label: "Senha", value: password, set: setPassword, type: "password", placeholder: "Mínimo 6 caracteres" },
          ].map(({ label, value, set, type, placeholder }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
              <input
                type={type}
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                required
                className="px-4 py-2.5 rounded-2xl border border-amber-100 bg-white text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
              />
            </div>
          ))}

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-divine py-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar conta grátis"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-4">
          Já tem conta?{" "}
          <Link href="/sign-in" className="text-gold-dark font-semibold hover:underline">
            Entrar
          </Link>
        </p>

        <p className="text-center text-xs text-slate-300 mt-3">
          Ao criar sua conta, você concorda com os{" "}
          <Link href="/termos" className="text-slate-400 hover:underline">Termos de Uso</Link>
          {" "}e a{" "}
          <Link href="/privacidade" className="text-slate-400 hover:underline">Política de Privacidade</Link>
        </p>
      </motion.div>
    </div>
  );
}
