import { useEffect, useRef, useState } from "react";
import { loadStateFromDatabase, saveStateToDatabase } from "./stateApi";

export function usePersistentState<T>(key: string, initialValue: T) {
  const hydrated = useRef(false);
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    if (!stored) return initialValue;
    try {
      return JSON.parse(stored) as T;
    } catch {
      localStorage.removeItem(key);
      return initialValue;
    }
  });

  useEffect(() => {
    let active = true;

    loadStateFromDatabase<T>(key)
      .then((databaseValue) => {
        if (!active) return;
        if (databaseValue !== null) {
          setValue(databaseValue);
          localStorage.setItem(key, JSON.stringify(databaseValue));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) hydrated.current = true;
      });

    return () => {
      active = false;
    };
  }, [key]);

  useEffect(() => {
    if (!hydrated.current) {
      localStorage.setItem(key, JSON.stringify(value));
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
    void saveStateToDatabase(key, value).catch(() => undefined);
  }, [key, value]);

  return [value, setValue] as const;
}
