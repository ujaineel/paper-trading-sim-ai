"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Account created! Please sign in.");
    }
    if (searchParams.get("error") === "oauth_failed") {
      setError("Google sign-in failed. Please try again.");
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.login(email, password);
      await refresh();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = api.googleOAuthUrl;
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      {/* Background gradient accent */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--color-brand)' }}
        />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 blur-3xl"
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
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Log in to your PaperTrade account
          </p>
        </div>

        {/* Success alert */}
        {success && (
          <div className="alert alert-success mb-6 animate-fade-in">
            {success}
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div className="alert alert-error mb-6 animate-fade-in">
            {error}
          </div>
        )}

        {/* Google OAuth button */}
        <button
          onClick={handleGoogleLogin}
          className="btn btn-outline w-full py-3 text-base mb-4 group"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <hr className="flex-1" style={{ borderColor: 'var(--color-border)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>OR</span>
          <hr className="flex-1" style={{ borderColor: 'var(--color-border)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
              autoComplete="current-password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-3 text-base"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <hr className="divider" />

        <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold hover:underline"
            style={{ color: 'var(--color-brand)' }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
