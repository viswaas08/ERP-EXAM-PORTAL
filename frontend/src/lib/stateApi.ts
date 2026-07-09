import { API_URL } from "./api";

export async function loadStateFromDatabase<T>(key: string): Promise<T | null> {
  const response = await fetch(`${API_URL}/api/state/${encodeURIComponent(key)}`);
  if (!response.ok) return null;
  const payload = await response.json();
  return payload.value as T | null;
}

export async function saveStateToDatabase<T>(key: string, value: T) {
  const token = localStorage.getItem("accessToken");
  await fetch(`${API_URL}/api/state/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ value })
  });
}
