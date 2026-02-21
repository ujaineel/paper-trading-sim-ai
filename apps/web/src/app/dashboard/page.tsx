"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

type User = { id: string; email: string; name: string };

export default function DashboardPage() {
  const { user: currentUser, loading: authLoading, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !currentUser) return;

    api.getUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [authLoading, currentUser]);

  if (authLoading || !currentUser || dataLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="skeleton w-48 h-8" />
          <div className="skeleton w-24 h-10 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <div className="skeleton w-32 h-5 mb-3" />
              <div className="skeleton w-full h-4 mb-2" />
              <div className="skeleton w-20 h-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Welcome back, {currentUser.name}
          </p>
        </div>
        <button
          onClick={logout}
          className="btn btn-danger"
        >
          Log out
        </button>
      </div>

      {/* Auth status card */}
      <div className="card mb-8 border-l-4" style={{ borderLeftColor: 'var(--color-brand)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-success-bg)' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M16.667 5L7.5 14.167 3.333 10" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Authentication Verified
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Signed in as {currentUser.email}
            </p>
          </div>
          <div className="ml-auto">
            <span className="badge badge-success">Active</span>
          </div>
        </div>
      </div>

      {/* Users section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Registered Users
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          {users.length} user{users.length !== 1 ? "s" : ""} fetched from the protected API
        </p>
      </div>

      {users.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-lg mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            No users found
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Register some users to see them here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {users.map((user) => (
            <div key={user.id} className="card animate-fade-in group cursor-default">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    color: 'var(--color-brand)',
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {user.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-1 rounded"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {user.id.slice(0, 8)}...
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
