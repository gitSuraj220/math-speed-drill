import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface SessionRecord {
  id: string;
  mode: string;
  correct: number;
  incorrect: number;
  avgTimeMs: number;
  date: string;
}

interface StatsContextValue {
  sessions: SessionRecord[];
  addSession: (record: Omit<SessionRecord, "id" | "date">) => Promise<void>;
  clearStats: () => Promise<void>;
}

const StatsContext = createContext<StatsContextValue | null>(null);

const STORAGE_KEY = "math_drill_sessions";

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setSessions(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  const addSession = useCallback(
    async (record: Omit<SessionRecord, "id" | "date">) => {
      const newRecord: SessionRecord = {
        ...record,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        date: new Date().toISOString(),
      };
      setSessions((prev) => {
        const updated = [newRecord, ...prev].slice(0, 100);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const clearStats = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setSessions([]);
  }, []);

  return (
    <StatsContext.Provider value={{ sessions, addSession, clearStats }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error("useStats must be used inside StatsProvider");
  return ctx;
}
