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
  getAdditionQuestions,
  getCubeQuestionsForRange,
  getSquareQuestionsForRange,
  getTableQuestionsForRange,
  getFractionToPercentQuestions,
  getPercentToFractionQuestions,
  getFractionMixedQuestions,
  getSmartTableQuestions,
} from "@/utils/mathData";

const QUESTION_TIME = 25;
const INFINITY_BATCH = 30;
const INFINITY_REFILL_AT = 8;

type Mode = "tables" | "squarecube" | "addition" | "fraction";
type DrillType = "squares" | "cubes" | "mixed";
type FractionMode = "frac_to_pct" | "pct_to_frac" | "mixed";

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
  return "Lightning Addition";
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
  return getAdditionQuestions(count);
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

  const currentQ = questions[currentIdx];
  const progress = timeLeft / QUESTION_TIME;

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

      const delay = isCorrect ? 700 : 1400;
      setTimeout(async () => {
        const sessionOver = !isInfinity && currentIdx + 1 >= totalQuestions;
        if (sessionOver) {
          await finishSession(newCorrect, newIncorrect, newTimes);
          setPhase("done");
        } else {
          setCurrentIdx((i) => i + 1);
          setInput("");
          setPhase("question");
        }
      }, delay);
    },
    [input, currentQ, currentIdx, correct, incorrect, answerTimes, isInfinity, totalQuestions, finishSession, stopTimer]
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

    const accent =
      mode === "fraction" ? colors.fractionPct
      : mode === "squarecube" ? colors.squareCube
      : mode === "addition" ? colors.lightning
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
          {!showDecimal && (
            <Text style={[styles.autoHint, { color: colors.mutedForeground }]}>
              Auto-submits on correct answer
            </Text>
          )}
          {showDecimal && (
            <Text style={[styles.autoHint, { color: colors.mutedForeground }]}>
              Use · for decimal point  ·  25s timer
            </Text>
          )}
        </View>

        {phase === "result" ? (
          <View style={styles.resultArea}>
            <ResultCard
                isCorrect={lastCorrect}
                correctAnswer={currentQ.answer}
                userAnswer={input}
                question={currentQ.question}
              />
          </View>
        ) : (
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
