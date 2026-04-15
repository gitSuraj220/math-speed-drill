import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useStats } from "@/context/StatsContext";
import { useAdaptive, getQuestionWeight } from "@/context/AdaptiveContext";
import { AdBanner } from "@/components/AdBanner";
import { NumberPad } from "@/components/NumberPad";
import { ResultCard } from "@/components/ResultCard";
import { TimerBar } from "@/components/TimerBar";
import {
  Question,
  getCubeQuestionsForRange,
  getSquareQuestionsForRange,
  getTableQuestionsForRange,
  getFractionToPercentQuestions,
  getPercentToFractionQuestions,
  getFractionMixedQuestions,
  getSmartTableQuestions,
  getDigitAdditionQuestions,
  getDigitSubtractionQuestions,
  getMixedOperationQuestions,
} from "@/utils/mathData";
import {
  generateApproximationQuestions,
  generateApproximationOptions,
  generateSeriesQuestions,
  generateSeriesOptions,
  generatePercentageQuestions,
  generatePercentageOptions,
  generateSimplificationQuestions,
  type PctType,
} from "@/utils/examData";

const QUESTION_TIME = 25;
const INFINITY_BATCH = 30;
const INFINITY_REFILL_AT = 8;

type Mode = "tables" | "squarecube" | "addition" | "fraction" | "approximation" | "series" | "percentage" | "simplification";
type DrillType = "squares" | "cubes" | "mixed";
type FractionMode = "frac_to_pct" | "pct_to_frac" | "mixed";

// ── Fraction MCQ helpers ──────────────────────────────────────────────────────
function generateFractionOptions(
  answer: number,
  tolerance: number,
  fm: FractionMode
): number[] {
  const fmt = (n: number) => Math.round(n * 100) / 100;
  const ans = fmt(answer);

  let pool: number[];
  if (fm === "pct_to_frac") {
    // Numerator is an integer — pick neighbouring integers
    pool = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]
      .filter((n) => n !== ans);
  } else {
    // Percentage — broad pool of plausible % values
    pool = [
      5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,
      33.33, 66.67, 16.67, 83.33,
      11.11, 22.22, 44.44, 55.56, 77.78, 88.89,
      12.5, 37.5, 62.5, 87.5,
      6.25, 18.75, 31.25, 43.75, 56.25, 68.75, 81.25, 93.75,
      14.29, 28.57, 42.86, 57.14, 71.43, 85.71,
      8.33, 41.67, 58.33, 91.67,
    ].map(fmt).filter((v) => Math.abs(v - ans) > tolerance);
  }

  const chosen = new Set<number>([ans]);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  for (const c of shuffled) {
    if (chosen.size >= 4) break;
    if (!chosen.has(c)) chosen.add(c);
  }
  // Safety pad
  let extra = 1;
  while (chosen.size < 4) chosen.add(ans + extra++);

  return Array.from(chosen).sort(() => Math.random() - 0.5);
}

function fmtOption(value: number, fm: FractionMode): string {
  if (fm === "pct_to_frac") return String(value);
  const s = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `${s}%`;
}

function fmtMCQOption(value: number, m: Mode, fm: FractionMode): string {
  if (m === "fraction") return fmtOption(value, fm);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getModeLabel(mode: Mode, params: Record<string, string | undefined>) {
  if (mode === "tables") {
    const f = params.tableFrom;
    const t = params.tableTo;
    if (f && t) return f === t ? `Table of ${f}` : `Tables ${f}–${t}`;
    return "Table Master";
  }
  if (mode === "squarecube") {
    const dt = (params.drillType as DrillType) || "mixed";
    if (dt === "squares") return "Squares Drill";
    if (dt === "cubes") return "Cubes Drill";
    return "Square / Cube";
  }
  if (mode === "fraction") {
    const fm = (params.fractionMode as FractionMode) || "frac_to_pct";
    if (fm === "frac_to_pct") return "Fraction → %";
    if (fm === "pct_to_frac") return "% → Fraction";
    return "Fraction % Mixed";
  }
  if (mode === "approximation") {
    const diff = params.difficulty ?? "medium";
    return `Approximation (${diff.charAt(0).toUpperCase() + diff.slice(1)})`;
  }
  if (mode === "series") return "Number Series";
  if (mode === "percentage") {
    const pt = params.pctType ?? "mixed";
    const labels: Record<string, string> = {
      find_pct_of: "Find X% of Y",
      what_pct_is: "X is ?% of Y",
      after_increase: "% Increase",
      after_decrease: "% Decrease",
      mixed: "Percentage Mixed",
    };
    return labels[pt] ?? "Percentage";
  }
  if (mode === "simplification") {
    const diff = params.difficulty ?? "medium";
    return `Simplification (${diff.charAt(0).toUpperCase() + diff.slice(1)})`;
  }
  // addition mode
  const op = params.operation ?? "add";
  const combo = params.digitCombo ?? "4+4";
  const opLabel = op === "add" ? "+" : op === "sub" ? "−" : "+ / −";
  if (combo === "mixed") return `Lightning ${opLabel} Mixed`;
  return `Lightning ${opLabel} (${combo} digit)`;
}

function buildBatch(
  mode: Mode,
  count: number,
  params: Record<string, string | undefined>,
  perfMap?: Record<string, { attempts: number; avgTimeMs: number; errorCount: number }>
): Question[] {
  if (mode === "tables") {
    const from = params.tableFrom ? parseInt(params.tableFrom, 10) : 1;
    const to = params.tableTo ? parseInt(params.tableTo, 10) : 50;
    // Use smart adaptive generator when perfMap is provided
    if (perfMap) {
      return getSmartTableQuestions(from, to, count, perfMap, getQuestionWeight);
    }
    return getTableQuestionsForRange(from, to, count);
  }
  if (mode === "squarecube") {
    const dt = (params.drillType as DrillType) || "mixed";
    const sqFrom = params.sqFrom ? parseInt(params.sqFrom, 10) : 1;
    const sqTo = params.sqTo ? parseInt(params.sqTo, 10) : 30;
    const cbFrom = params.cbFrom ? parseInt(params.cbFrom, 10) : 1;
    const cbTo = params.cbTo ? parseInt(params.cbTo, 10) : 20;
    if (dt === "squares") return getSquareQuestionsForRange(sqFrom, sqTo, count);
    if (dt === "cubes") return getCubeQuestionsForRange(cbFrom, cbTo, count);
    const half = Math.ceil(count / 2);
    return [
      ...getSquareQuestionsForRange(sqFrom, sqTo, half),
      ...getCubeQuestionsForRange(cbFrom, cbTo, count - half),
    ].sort(() => Math.random() - 0.5);
  }
  if (mode === "fraction") {
    const fm = (params.fractionMode as FractionMode) || "frac_to_pct";
    if (fm === "frac_to_pct") return getFractionToPercentQuestions(count);
    if (fm === "pct_to_frac") return getPercentToFractionQuestions(count);
    return getFractionMixedQuestions(count);
  }
  if (mode === "approximation") {
    return generateApproximationQuestions((params.difficulty as any) ?? "medium", count);
  }
  if (mode === "series") return generateSeriesQuestions(count);
  if (mode === "percentage") return generatePercentageQuestions((params.pctType as PctType) ?? "mixed", count);
  if (mode === "simplification") return generateSimplificationQuestions((params.difficulty as any) ?? "medium", count);
  // addition / subtraction with digit selection
  const op = params.operation ?? "add";
  const combo = params.digitCombo ?? "4+4";
  if (combo === "mixed") {
    // mixed digit sizes — randomly vary each question
    const COMBOS = [
      [1,1],[1,2],[2,2],[2,3],[3,3],[3,4],[4,4],
    ] as [number,number][];
    return Array.from({ length: count }, () => {
      const [d1, d2] = COMBOS[Math.floor(Math.random() * COMBOS.length)];
      if (op === "add") return getDigitAdditionQuestions(d1, d2, 1)[0];
      if (op === "sub") return getDigitSubtractionQuestions(d1, d2, 1)[0];
      return getMixedOperationQuestions(d1, d2, 1)[0];
    });
  }
  const d1 = params.digits1 ? parseInt(params.digits1, 10) : 4;
  const d2 = params.digits2 ? parseInt(params.digits2, 10) : 4;
  if (op === "add") return getDigitAdditionQuestions(d1, d2, count);
  if (op === "sub") return getDigitSubtractionQuestions(d1, d2, count);
  return getMixedOperationQuestions(d1, d2, count);
}

function isAnswerCorrect(q: Question, userInput: string): boolean {
  if (!userInput || userInput === ".") return false;
  const userVal = parseFloat(userInput);
  if (isNaN(userVal)) return false;
  const tolerance = q.tolerance ?? 0;
  return Math.abs(userVal - q.answer) <= tolerance;
}

export default function QuizScreen() {
  const rawParams = useLocalSearchParams<Record<string, string>>();
  const mode = (rawParams.mode as Mode) || "tables";
  const fractionMode = (rawParams.fractionMode as FractionMode) || "frac_to_pct";
  const parsedCount = rawParams.questionCount ? parseInt(rawParams.questionCount, 10) : 10;
  const isInfinity = parsedCount === 0;
  const totalQuestions = isInfinity ? 0 : Math.max(10, Math.min(50, parsedCount));

  // MCQ modes: fraction, approximation, series, percentage
  const isMCQMode = mode === "fraction" || mode === "approximation" || mode === "series" || mode === "percentage";

  const showDecimal =
    mode === "fraction" && (fractionMode === "frac_to_pct" || fractionMode === "mixed");

  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addSession } = useStats();
  const { perfMap, updatePerf } = useAdaptive();
  const modeLabel = getModeLabel(mode, rawParams);

  const [questions, setQuestions] = useState<Question[]>(() =>
    buildBatch(
      mode,
      isInfinity ? INFINITY_BATCH : totalQuestions,
      rawParams,
      mode === "tables" ? perfMap : undefined
    )
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [phase, setPhase] = useState<"question" | "result" | "done">("question");
  const [lastCorrect, setLastCorrect] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [answerTimes, setAnswerTimes] = useState<number[]>([]);
  const questionStartRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSubmitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stores the "advance to next question" fn for wrong answers — called when user taps OK
  const pendingAdvanceRef = useRef<(() => void) | null>(null);

  // MCQ options for MCQ modes
  const [options, setOptions] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const currentQ = questions[currentIdx];
  const progress = timeLeft / QUESTION_TIME;

  // Regenerate MCQ options for every new MCQ question
  useEffect(() => {
    if (mode === "fraction") {
      setOptions(generateFractionOptions(currentQ.answer, currentQ.tolerance ?? 0, fractionMode));
    } else if (mode === "approximation") {
      setOptions(generateApproximationOptions(currentQ.answer, currentQ.tolerance ?? 0));
    } else if (mode === "series") {
      setOptions(generateSeriesOptions(currentQ.answer));
    } else if (mode === "percentage") {
      setOptions(generatePercentageOptions(currentQ.answer));
    }
    setSelectedOption(null);
  }, [currentIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isInfinity && questions.length - currentIdx <= INFINITY_REFILL_AT) {
      setQuestions((prev) => [
        ...prev,
        ...buildBatch(
          mode,
          INFINITY_BATCH,
          rawParams,
          mode === "tables" ? perfMap : undefined
        ),
      ]);
    }
  }, [currentIdx, isInfinity, questions.length, perfMap]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(QUESTION_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { stopTimer(); return 0; } return t - 1; });
    }, 1000);
  }, [stopTimer]);

  useEffect(() => {
    if (phase === "question") {
      questionStartRef.current = Date.now();
      startTimer();
    }
    return () => {
      stopTimer();
      if (autoSubmitRef.current) { clearTimeout(autoSubmitRef.current); autoSubmitRef.current = null; }
    };
  }, [phase, currentIdx]);

  useEffect(() => {
    if (timeLeft === 0 && phase === "question") handleSubmit(true);
  }, [timeLeft, phase]);

  const finishSession = useCallback(
    async (finalCorrect: number, finalIncorrect: number, times: number[]) => {
      const avg = times.length > 0
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : 0;
      await addSession({
        mode: modeLabel + (isInfinity ? " ∞" : ""),
        correct: finalCorrect,
        incorrect: finalIncorrect,
        avgTimeMs: avg,
      });
    },
    [modeLabel, isInfinity, addSession]
  );

  const handleSubmit = useCallback(
    (timeout = false, forcedInput?: string) => {
      if (autoSubmitRef.current) { clearTimeout(autoSubmitRef.current); autoSubmitRef.current = null; }
      stopTimer();
      const elapsed = Date.now() - questionStartRef.current;
      const userAnswer = timeout ? "" : (forcedInput ?? input);
      const isCorrect = !timeout && isAnswerCorrect(currentQ, userAnswer);

      // Update adaptive difficulty tracking for table questions
      if (mode === "tables" && currentQ.adaptiveKey) {
        updatePerf(currentQ.adaptiveKey, elapsed, isCorrect);
      }

      const newCorrect = isCorrect ? correct + 1 : correct;
      const newIncorrect = isCorrect ? incorrect : incorrect + 1;
      const newTimes = [...answerTimes, elapsed];

      setLastCorrect(isCorrect);
      setAnswerTimes(newTimes);
      if (isCorrect) setCorrect(newCorrect); else setIncorrect(newIncorrect);
      setPhase("result");

      // The advance function — moves to next question or finishes session
      const advance = async () => {
        pendingAdvanceRef.current = null;
        const sessionOver = !isInfinity && currentIdx + 1 >= totalQuestions;
        if (sessionOver) {
          await finishSession(newCorrect, newIncorrect, newTimes);
          setPhase("done");
        } else {
          setCurrentIdx((i) => i + 1);
          setInput("");
          setPhase("question");
        }
      };

      if (isCorrect) {
        // Correct: auto-advance after short delay
        setTimeout(advance, 700);
      } else {
        // Wrong / timeout: wait for user to tap "Got it"
        // Reset timeLeft now so the "timeLeft===0 && phase==='question'" effect
        // doesn't fire immediately when advance() transitions to the next question.
        setTimeLeft(QUESTION_TIME);
        pendingAdvanceRef.current = advance;
      }
    },
    [input, currentQ, currentIdx, correct, incorrect, answerTimes, isInfinity, totalQuestions, finishSession, stopTimer]
  );

  // Called by the "Got it" button on the wrong-answer card
  const handleContinue = useCallback(() => {
    if (pendingAdvanceRef.current) pendingAdvanceRef.current();
  }, []);

  // Called when user taps an MCQ option
  const handleOptionTap = useCallback(
    (value: number) => {
      if (phase !== "question") return;
      setSelectedOption(value);
      handleSubmit(false, String(value));
    },
    [phase, handleSubmit]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (phase !== "question") return;
      setInput((prev) => {
        if (digit === "." && prev.includes(".")) return prev;
        if (digit === "." && prev === "") return "0.";
        if (prev.length >= 8) return prev;
        const newInput = prev + digit;
        if (digit !== "." && isAnswerCorrect(currentQ, newInput)) {
          if (autoSubmitRef.current) clearTimeout(autoSubmitRef.current);
          autoSubmitRef.current = setTimeout(() => handleSubmit(false, newInput), 300);
        }
        return newInput;
      });
    },
    [phase, currentQ, handleSubmit]
  );

  const handleDelete = useCallback(() => {
    if (autoSubmitRef.current) { clearTimeout(autoSubmitRef.current); autoSubmitRef.current = null; }
    setInput((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    if (autoSubmitRef.current) { clearTimeout(autoSubmitRef.current); autoSubmitRef.current = null; }
    setInput("");
  }, []);

  const doExit = useCallback(async () => {
    stopTimer();
    if (isInfinity && (correct + incorrect) > 0) {
      await finishSession(correct, incorrect, answerTimes);
      setPhase("done");
    } else {
      router.back();
    }
  }, [stopTimer, isInfinity, correct, incorrect, answerTimes, finishSession, router]);

  const handleCancel = useCallback(() => {
    if (Platform.OS === "web") { doExit(); return; }
    Alert.alert(
      isInfinity ? "End Drill?" : "Exit Drill",
      isInfinity ? "Save your results and finish?" : "Are you sure you want to exit?",
      [
        { text: "Keep Going", style: "cancel" },
        { text: isInfinity ? "Finish" : "Exit", style: "destructive", onPress: doExit },
      ]
    );
  }, [isInfinity, doExit]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (phase === "done") {
    const total = correct + incorrect;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    const avgSec =
      answerTimes.length > 0
        ? Math.round(answerTimes.reduce((a, b) => a + b, 0) / answerTimes.length / 1000)
        : 0;

    const retryParams: Record<string, string> = {
      mode,
      questionCount: String(isInfinity ? 0 : totalQuestions),
    };
    if (rawParams.tableFrom) retryParams.tableFrom = rawParams.tableFrom;
    if (rawParams.tableTo) retryParams.tableTo = rawParams.tableTo;
    if (rawParams.drillType) retryParams.drillType = rawParams.drillType;
    if (rawParams.sqFrom) retryParams.sqFrom = rawParams.sqFrom;
    if (rawParams.sqTo) retryParams.sqTo = rawParams.sqTo;
    if (rawParams.cbFrom) retryParams.cbFrom = rawParams.cbFrom;
    if (rawParams.cbTo) retryParams.cbTo = rawParams.cbTo;
    if (rawParams.fractionMode) retryParams.fractionMode = rawParams.fractionMode;
    if (rawParams.difficulty) retryParams.difficulty = rawParams.difficulty;
    if (rawParams.pctType) retryParams.pctType = rawParams.pctType;

    const accent =
      mode === "fraction" ? colors.fractionPct
      : mode === "squarecube" ? colors.squareCube
      : mode === "addition" ? colors.lightning
      : mode === "approximation" ? colors.approximation
      : mode === "series" ? colors.series
      : mode === "percentage" ? colors.percentageCalc
      : mode === "simplification" ? colors.simplification
      : colors.primary;

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.doneWrap, { paddingTop: topPad + 24, paddingBottom: 24 }]}>
          <View style={[styles.doneCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.doneIconWrap, { backgroundColor: accent + "20" }]}>
              <Feather name="check-circle" size={36} color={accent} />
            </View>
            <Text style={[styles.doneTitle, { color: colors.foreground }]}>Session Complete</Text>
            <View style={styles.doneModeRow}>
              <Text style={[styles.doneMode, { color: colors.mutedForeground }]}>{modeLabel}</Text>
              {isInfinity && (
                <View style={[styles.infinityBadge, { backgroundColor: accent }]}>
                  <Feather name="infinity" size={11} color="#fff" />
                  <Text style={styles.infinityBadgeText}>{total} answered</Text>
                </View>
              )}
            </View>

            <View style={[styles.doneStats, { borderColor: colors.border }]}>
              {[
                { val: correct, label: "Correct", color: colors.success },
                { val: incorrect, label: "Wrong", color: colors.destructive },
                { val: `${acc}%`, label: "Accuracy", color: accent },
                { val: `${avgSec}s`, label: "Avg Time", color: colors.mutedForeground },
              ].map((s) => (
                <View key={s.label} style={styles.doneStat}>
                  <Text style={[styles.doneStatVal, { color: s.color }]}>{s.val}</Text>
                  <Text style={[styles.doneStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => router.replace({ pathname: "/quiz", params: retryParams })}
              style={({ pressed }) => [styles.btn, { backgroundColor: accent, opacity: pressed ? 0.8 : 1 }]}
            >
              <Feather name="refresh-cw" size={18} color="#fff" />
              <Text style={styles.btnText}>Play Again</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.btnOutline, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.btnOutlineText, { color: colors.mutedForeground }]}>Back to Dashboard</Text>
            </Pressable>
          </View>
        </View>
        <AdBanner />
      </View>
    );
  }

  const progressLabel = isInfinity ? `Q${currentIdx + 1}` : `${currentIdx + 1} / ${totalQuestions}`;
  const modeAccent =
    mode === "fraction" ? colors.fractionPct
    : mode === "squarecube" ? colors.squareCube
    : mode === "addition" ? colors.lightning
    : mode === "approximation" ? colors.approximation
    : mode === "series" ? colors.series
    : mode === "percentage" ? colors.percentageCalc
    : mode === "simplification" ? colors.simplification
    : colors.primary;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.quizWrap, { paddingTop: topPad + 8 }]}>
        <View style={styles.topBar}>
          <Pressable onPress={handleCancel} style={styles.backBtn}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
              {progressLabel}
            </Text>
            {isInfinity && (
              <Feather name="infinity" size={13} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
            )}
          </View>
          <View style={styles.scoreRow}>
            <Feather name="check" size={16} color={colors.success} />
            <Text style={[styles.scoreNum, { color: colors.success }]}>{correct}</Text>
            <Feather name="x" size={16} color={colors.destructive} />
            <Text style={[styles.scoreNum, { color: colors.destructive }]}>{incorrect}</Text>
          </View>
        </View>

        <View style={styles.timerRow}>
          <TimerBar progress={progress} />
          <Text style={[styles.timerText, { color: colors.mutedForeground }]}>{timeLeft}s</Text>
        </View>

        <View style={styles.questionArea}>
          <Text style={[styles.modeLabel, { color: modeAccent }]}>
            {modeLabel.toUpperCase()}
          </Text>
          <Text style={[styles.questionText, { color: colors.foreground }]}>
            {currentQ.question}
          </Text>
          {currentQ.hint && (
            <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
              {currentQ.hint}
            </Text>
          )}
          {!isMCQMode && (
            <>
              <View
                style={[
                  styles.inputDisplay,
                  {
                    backgroundColor: colors.card,
                    borderColor: input ? modeAccent : colors.border,
                  },
                ]}
              >
                <Text style={[styles.inputText, { color: input ? colors.foreground : colors.mutedForeground }]}>
                  {input || "—"}
                </Text>
              </View>
              {!showDecimal ? (
                <Text style={[styles.autoHint, { color: colors.mutedForeground }]}>
                  Auto-submits on correct answer
                </Text>
              ) : (
                <Text style={[styles.autoHint, { color: colors.mutedForeground }]}>
                  Use · for decimal point  ·  25s timer
                </Text>
              )}
            </>
          )}
        </View>

        {isMCQMode ? (
          // ── MCQ mode: option grid ──────────────────────────────────────────
          <>
            <View style={styles.optionGrid}>
              {options.map((opt) => {
                const isCorrectOpt = Math.abs(opt - currentQ.answer) <= (currentQ.tolerance ?? 0);
                const isSelected = selectedOption === opt;
                let bg = colors.card;
                let border = colors.border;
                let textCol = colors.foreground;
                if (phase === "result") {
                  if (isCorrectOpt) { bg = "#dcfce7"; border = "#86efac"; textCol = "#15803d"; }
                  else if (isSelected) { bg = "#fee2e2"; border = "#fca5a5"; textCol = "#b91c1c"; }
                  else { bg = colors.card; border = colors.border; textCol = colors.mutedForeground; }
                }
                return (
                  <Pressable
                    key={opt}
                    onPress={() => handleOptionTap(opt)}
                    disabled={phase !== "question"}
                    style={({ pressed }) => [
                      styles.optionBtn,
                      { backgroundColor: bg, borderColor: border, opacity: pressed && phase === "question" ? 0.75 : 1 },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: textCol }]}>
                      {fmtMCQOption(opt, mode, fractionMode)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {phase === "result" && (
              <View style={styles.resultArea}>
                <ResultCard
                  isCorrect={lastCorrect}
                  correctAnswer={currentQ.answer}
                  userAnswer={selectedOption !== null ? fmtMCQOption(selectedOption, mode, fractionMode) : ""}
                  question={currentQ.question}
                  onContinue={lastCorrect ? undefined : handleContinue}
                />
              </View>
            )}
          </>
        ) : phase === "result" ? (
          // ── Other modes: result card ─────────────────────────────────────
          <View style={styles.resultArea}>
            <ResultCard
              isCorrect={lastCorrect}
              correctAnswer={currentQ.answer}
              userAnswer={input}
              question={currentQ.question}
              onContinue={lastCorrect ? undefined : handleContinue}
            />
          </View>
        ) : (
          // ── Other modes: number pad ──────────────────────────────────────
          <NumberPad
            onPress={handleDigit}
            onDelete={handleDelete}
            onClear={handleClear}
            onCancel={handleCancel}
            disabled={phase !== "question"}
            showDecimal={showDecimal}
          />
        )}
      </View>
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  quizWrap: { flex: 1, paddingBottom: 8, gap: 10 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 8 },
  backBtn: { padding: 6 },
  progressInfo: { flex: 1, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  progressText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  scoreNum: { fontSize: 16, fontFamily: "Inter_700Bold", marginRight: 4 },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 },
  timerText: { fontSize: 13, fontFamily: "Inter_500Medium", width: 28, textAlign: "right" },
  questionArea: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 10 },
  modeLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, textTransform: "uppercase" },
  questionText: { fontSize: 38, fontFamily: "Inter_700Bold", textAlign: "center", letterSpacing: -0.5 },
  hintText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  inputDisplay: { minWidth: 140, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 2, alignItems: "center" },
  inputText: { fontSize: 32, fontFamily: "Inter_600SemiBold" },
  autoHint: { fontSize: 11, fontFamily: "Inter_400Regular", letterSpacing: 0.3 },
  resultArea: { paddingBottom: 8 },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  optionBtn: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  doneWrap: { flex: 1, paddingHorizontal: 16, justifyContent: "center" },
  doneCard: { borderRadius: 24, borderWidth: 1, padding: 28, gap: 14, alignItems: "center" },
  doneIconWrap: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  doneModeRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  doneMode: { fontSize: 13, fontFamily: "Inter_400Regular" },
  infinityBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  infinityBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },
  doneStats: {
    flexDirection: "row",
    width: "100%",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 16,
    marginVertical: 4,
  },
  doneStat: { alignItems: "center", flex: 1 },
  doneStatVal: { fontSize: 24, fontFamily: "Inter_700Bold" },
  doneStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14, width: "100%" },
  btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#ffffff" },
  btnOutline: { alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 14, borderWidth: 1, width: "100%" },
  btnOutlineText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
