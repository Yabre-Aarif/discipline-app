import type { Daily, Goal, History, User } from "../context/types";

// Relative path: the app and the API live on the same Netlify site.
const API_BASE = "/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type FullState = {
  cycleStartDate: string | null;
  sworn: boolean;
  dailies: Daily[];
  goals: Goal[];
  history: History;
};

type AuthResponse = FullState & { token: string; user: User };

async function request<T>(
  path: string,
  opts: { method?: string; token?: string | null; body?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Impossible de joindre le serveur. Vérifie ta connexion.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || "Une erreur est survenue.");
  return data as T;
}

export const api = {
  signup: (payload: { name: string; email: string; password: string; dailies: { label: string; target: string }[]; goals: { label: string; target: string }[] }) =>
    request<AuthResponse>("/auth/signup", { method: "POST", body: payload }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: payload }),

  me: (token: string) => request<FullState & { user: User }>("/me", { token }),

  updateUser: (token: string, payload: { name?: string; email?: string }) =>
    request<User>("/user", { method: "PATCH", token, body: payload }),

  startCycle: (token: string, payload: { dailies: { label: string; target: string }[]; goals: { label: string; target: string }[] }) =>
    request<Omit<FullState, never>>("/cycle/start", { method: "POST", token, body: payload }),

  reset: (token: string) => request<{ ok: true }>("/reset", { method: "POST", token }),

  createDaily: (token: string, payload: { label: string; target?: string }) =>
    request<Daily>("/dailies", { method: "POST", token, body: payload }),

  updateDaily: (token: string, id: string, payload: { label?: string; target?: string }) =>
    request<Daily>(`/dailies/${id}`, { method: "PATCH", token, body: payload }),

  deleteDaily: (token: string, id: string) => request<{ ok: true }>(`/dailies/${id}`, { method: "DELETE", token }),

  createGoal: (token: string, payload: { label: string; target?: string }) =>
    request<Goal>("/goals", { method: "POST", token, body: payload }),

  updateGoal: (token: string, id: string, payload: { label?: string; target?: string }) =>
    request<Goal>(`/goals/${id}`, { method: "PATCH", token, body: payload }),

  deleteGoal: (token: string, id: string) => request<{ ok: true }>(`/goals/${id}`, { method: "DELETE", token }),

  upsertCheckin: (token: string, payload: { dailyId: string; date: string; done: boolean }) =>
    request<{ ok: true }>("/checkins", { method: "PUT", token, body: payload }),
};
