export type StoredApplication = {
  id: string;
  name: string;
  exam: string;
  category: string;
  state: string;
  score: number;
  status: string;
};

const applicationsKey = "examPortal.applications.rows";

function readJson<T>(key: string, fallback: T) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export function getStoredApplications() {
  return readJson<StoredApplication[]>(applicationsKey, []);
}

export function upsertStoredApplication(application: StoredApplication) {
  const current = getStoredApplications();
  const exists = current.some((item) => item.id === application.id);
  const next = exists
    ? current.map((item) => (item.id === application.id ? application : item))
    : [application, ...current];
  localStorage.setItem(applicationsKey, JSON.stringify(next));
  return next;
}

export function setStoredApplicationStatus(id: string, status: string) {
  const next = getStoredApplications().map((item) => (item.id === id ? { ...item, status } : item));
  localStorage.setItem(applicationsKey, JSON.stringify(next));
  return next;
}
