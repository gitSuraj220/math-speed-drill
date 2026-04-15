/**
 * AdaptiveContext — tracks per-question difficulty across sessions.
 *
 * For every table question (e.g. "12×7") we store:
 *   - attempts   : how many times it was answered
 *   - avgTimeMs  : rolling average response time in ms
 *   - errorCount : total wrong / timed-out answers
 *
 * This data is used by the smart question generator to surface
 * slow / error-prone questions more frequently.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface QuestionPerf {
  attempts: number;
  avgTimeMs: number;
  errorCount: number;
}

export type PerfMap = Record<string, QuestionPerf>;

interface AdaptiveContextValue {
  perfMap: PerfMap;
  updatePerf: (key: string, timeMs: number, isCorrect: boolean) => void;
  clearAdaptive: () => Promise<void>;
}

const AdaptiveContext = createContext<AdaptiveContextValue | null>(null);

const STORAGE_KEY = "math_drill_adaptive_v1";

export function AdaptiveProvider({ children }: { children: React.ReactNode }) {
  const [perfMap, setPerfMap] = useState<PerfMap>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setPerfMap(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  // Debounced save — batches multiple quick updates into one write
  const scheduleSave = useCallback((map: PerfMap) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    }, 500);
  }, []);

  const updatePerf = useCallback(
    (key: string, timeMs: number, isCorrect: boolean) => {
      setPerfMap((prev) => {
        const existing = prev[key] ?? { attempts: 0, avgTimeMs: 0, errorCount: 0 };
        const newAttempts = existing.attempts + 1;
        // Rolling average of response time
        const newAvg = Math.round(
          (existing.avgTimeMs * existing.attempts + timeMs) / newAttempts
        );
        const updated: PerfMap = {
          ...prev,
          [key]: {
            attempts: newAttempts,
            avgTimeMs: newAvg,
            errorCount: existing.errorCount + (isCorrect ? 0 : 1),
          },
        };
        scheduleSave(updated);
        return updated;
      });
    },
    [scheduleSave]
  );

  const clearAdaptive = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setPerfMap({});
  }, []);

  return (
    <AdaptiveContext.Provider value={{ perfMap, updatePerf, clearAdaptive }}>
      {children}
    </AdaptiveContext.Provider>
  );
}

export function useAdaptive() {
  const ctx = useContext(AdaptiveContext);
  if (!ctx) throw new Error("useAdaptive must be inside AdaptiveProvider");
  return ctx;
}

// ── Weight calculation ────────────────────────────────────────────────────
/**
 * Returns a selection weight for a question based on past performance.
 *
 * Higher weight = appears more often.
 *
 * Scale:
 *   10  — never attempted (coverage priority)
 *    6  — slow (avg > 15 s) or high error rate (> 50 %)
 *    4  — moderately slow (avg > 10 s) or some errors (> 25 %)
 *    2  — a bit slow (avg > 6 s) or occasional errors
 *    1  — fast and accurate (easy question)
 */
export function getQuestionWeight(perf: QuestionPerf | undefined): number {
  if (!perf || perf.attempts === 0) return 10; // never seen

  const errorRate = perf.errorCount / perf.attempts;
  let weight = 1;

  // Time component
  if (perf.avgTimeMs > 15_000) weight += 5;
  else if (perf.avgTimeMs > 10_000) weight += 3;
  else if (perf.avgTimeMs > 6_000) weight += 1;

  // Error component
  if (errorRate > 0.5) weight += 4;
  else if (errorRate > 0.25) weight += 2;
  else if (errorRate > 0) weight += 1;

  return weight;
}
