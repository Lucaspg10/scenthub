// src/views/Login.tsx
import React, { useState } from 'react';
import { api } from '../services/api';

/*
  Login view component for user authentication.
  Handles local state for credentials and validation.
*/
export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      /* Sending authentication credentials to Django backend endpoint.
         Adjust endpoint path according to your actual backend routing.
      */
      const response = await api.post('/token/', { username: email, password });
      console.log('Authentication successful:', response.data);
      
      // TODO: Save token to localStorage and redirect to Dashboard
    } catch (err: any) {
      console.error('Authentication failure:', err);
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-xl border border-slate-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-400 tracking-tight">ScentHub</h1>
          <p className="mt-2 text-sm text-slate-400">Entre com sua conta para gerenciar o estoque</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors disabled:opacity-50"
          >
            {loading ? 'Autenticando...' : 'Acessar Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}