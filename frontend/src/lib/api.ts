export const API_URL = import.meta.env.VITE_API_URL ?? "";

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) return null;

  const data = await response.json() as { accessToken?: string };
  if (!data.accessToken) return null;

  localStorage.setItem("accessToken", data.accessToken);
  return data.accessToken;
}

async function request<T>(path: string, init: RequestInit | undefined, token: string | null) {
  return fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers
    }
  });
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let token = localStorage.getItem("accessToken");
  let res = await request<T>(path, init, token);

  if (res.status === 401 && localStorage.getItem("refreshToken") && !path.startsWith("/auth/")) {
    token = await refreshAccessToken();
    if (token) res = await request<T>(path, init, token);
  }

  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Request failed");
  return res.json();
}
