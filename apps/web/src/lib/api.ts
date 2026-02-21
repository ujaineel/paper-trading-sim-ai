const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }

  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    request<{ id: string; email: string; name: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  logout: () =>
    request<{ message: string }>("/api/auth/logout", {
      method: "DELETE",
    }),

  getUsers: () =>
    request<{ id: string; email: string; name: string }[]>("/api/auth/"),

  getMe: () =>
    request<{ id: string; email: string; name: string }>("/api/auth/me"),

  // Google OAuth — browser redirect (not fetch)
  googleOAuthUrl: `${API_BASE}/api/oauth2/google`,
};
