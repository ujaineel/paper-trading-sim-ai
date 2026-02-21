"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl"
      style={{
        background: 'rgba(30, 33, 36, 0.85)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-black text-sm"
              style={{ background: 'var(--color-brand)' }}
            >
              PT
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:inline"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Paper<span style={{ color: 'var(--color-brand)' }}>Trade</span>
            </span>
          </Link>

          {/* Nav actions — show skeleton while loading */}
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="skeleton w-16 h-8 rounded-full" />
            </div>
          ) : user ? (
            /* Logged in */
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    color: 'var(--color-brand)',
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden sm:inline"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {user.name}
                </span>
              </div>
              <button onClick={logout} className="btn btn-ghost text-sm">
                Log out
              </button>
            </div>
          ) : (
            /* Not logged in */
            <div className="flex items-center gap-3">
              <Link href="/login" className="btn btn-ghost text-sm">
                Log in
              </Link>
              <Link href="/register" className="btn btn-primary text-sm">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
