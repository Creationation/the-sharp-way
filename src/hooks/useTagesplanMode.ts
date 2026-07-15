import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sitdown.tagesplanMode";

const read = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

export const useTagesplanMode = () => {
  const [enabled, setEnabledState] = useState<boolean>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setEnabledState(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    try {
      if (value) localStorage.setItem(STORAGE_KEY, "1");
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setEnabledState(value);
  }, []);

  return { enabled, setEnabled };
};
