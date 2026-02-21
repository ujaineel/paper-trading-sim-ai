"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.register(name, email, password);
      router.push("/login?registered=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      {/* Background gradient accent */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--color-brand)' }}
        />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-5 blur-3xl"
          style={{ background: 'var(--color-brand)' }}
        />
      </div>

      <div className="card w-full max-w-md animate-slide-up relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center font-bold text-black text-lg"
            style={{ background: 'var(--color-brand)' }}
          >
            PT
          </div>
          <h1 className="text-2xl font-bold mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Create your account
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Start paper trading in seconds
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="alert alert-error mb-6 animate-fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="input-group">
            <label htmlFor="name" className="input-label">Full Name</label>
            <input
              id="name"
              type="text"
              className="input-field"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              minLength={3}
            />
          </div>

          <div className="input-group">
            <label htmlFor="email" className="input-label">Email</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">Password</label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Must be at least 6 characters
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-3 text-base"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <hr className="divider" />

        <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold hover:underline"
            style={{ color: 'var(--color-brand)' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
