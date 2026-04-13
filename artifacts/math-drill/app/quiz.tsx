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
} from "@/utils/mathData";

const QUESTION_TIME = 25;

type Mode = "tables" | "squarecube" | "addition";
type DrillType = "squares" | "cubes" | "mixed";

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
  return "Lightning Addition";
}

function buildQuestions(
  mode: Mode,
  count: number,
  params: Record<string, string | undefined>
): Question[] {
  if (mode === "tables") {
    const from = params.tableFrom ? parseInt(params.tableFrom, 10) : 1;
    const to = params.tableTo ? parseInt(params.tableTo, 10) : 50;
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
    const sq = getSquareQuestionsForRange(sqFrom, sqTo, half);
    const cb = getCubeQuestionsForRange(cbFrom, cbTo, count - half);
    return [...sq, ...cb].sort(() => Math.random() - 0.5);
  }
  return getAdditionQuestions(count);
}

export default function QuizScreen() {
  const rawParams = useLocalSearchParams<Record<string, string>>();
  const mode = (rawParams.mode as Mode) || "tables";
  const totalQuestions = rawParams.questionCount
    ? Math.max(10, Math.min(50, parseInt(rawParams.questionCount, 10)))
    : 10;

  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addSession } = useStats();

  const [questions] = useState<Question[]>(() =>
    buildQuestions(mode, totalQuestions, rawParams)
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
  const modeLabel = getModeLabel(mode, rawParams);

  const currentQ = questions[currentIdx];
  const progress = timeLeft / QUESTION_TIME;

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(QUESTION_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { stopTimer(); return 0; }
        return t - 1;
      });
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

  const handleSubmit = useCallback(
    (timeout = false, forcedInput?: string) => {
      if (autoSubmitRef.current) { clearTimeout(autoSubmitRef.current); autoSubmitRef.current = null; }
      stopTimer();
      const elapsed = Date.now() - questionStartRef.current;
      const userAnswer = timeout ? "" : (forcedInput ?? input);
      const isCorrect = !timeout && parseInt(userAnswer, 10) === currentQ.answer;

      setLastCorrect(isCorrect);
      setAnswerTimes((prev) => [...prev, elapsed]);
      if (isCorrect) setCorrect((c) => c + 1);
      else setIncorrect((ic) => ic + 1);
      setPhase("result");

      const delay = isCorrect ? 700 : 1400;
      setTimeout(async () => {
        if (currentIdx + 1 >= totalQuestions) {
          const times = [...answerTimes, elapsed];
          const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
          await addSession({
            mode: modeLabel,
            correct: isCorrect ? correct + 1 : correct,
            incorrect: isCorrect ? incorrect : incorrect + 1,
            avgTimeMs: avg,
          });
          setPhase("done");
        } else {
          setCurrentIdx((i) => i + 1);
          setInput("");
          setPhase("question");
        }
      }, delay);
    },
    [input, currentQ, currentIdx, correct, incorrect, answerTimes, modeLabel, addSession, stopTimer, totalQuestions]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (phase !== "question") return;
      setInput((prev) => {
        if (prev.length >= 8) return prev;
        const newInput = prev + digit;
        if (parseInt(newInput, 10) === currentQ.answer) {
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

  const handleCancel = useCallback(() => {
    if (Platform.OS === "web") {
      stopTimer();
      router.back();
      return;
    }
    Alert.alert("Exit Drill", "Are you sure you want to exit?", [
      { text: "Keep Going", style: "cancel" },
      { text: "Exit", style: "destructive", onPress: () => { stopTimer(); router.back(); } },
    ]);
  }, [stopTimer, router]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (phase === "done") {
    const total = correct + incorrect;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    const avgSec =
      answerTimes.length > 0
        ? Math.round(answerTimes.reduce((a, b) => a + b, 0) / answerTimes.length / 1000)
        : 0;
    const retryParams: Record<string, string> = { mode, questionCount: String(totalQuestions) };
    if (rawParams.tableFrom) retryParams.tableFrom = rawParams.tableFrom;
    if (rawParams.tableTo) retryParams.tableTo = rawParams.tableTo;
    if (rawParams.drillType) retryParams.drillType = rawParams.drillType;
    if (rawParams.sqFrom) retryParams.sqFrom = rawParams.sqFrom;
    if (rawParams.sqTo) retryParams.sqTo = rawParams.sqTo;
    if (rawParams.cbFrom) retryParams.cbFrom = rawParams.cbFrom;
    if (rawParams.cbTo) retryParams.cbTo = rawParams.cbTo;

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.doneWrap, { paddingTop: topPad + 24, paddingBottom: bottomPad + 8 }]}>
          <View style={[styles.doneCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.doneTitle, { color: colors.primary }]}>Session Complete</Text>
            <Text style={[styles.doneMode, { color: colors.mutedForeground }]}>{modeLabel} · {totalQuestions} Questions</Text>

            <View style={styles.doneStats}>
              {[
                { val: correct, label: "Correct", color: colors.success },
                { val: incorrect, label: "Wrong", color: colors.destructive },
                { val: `${acc}%`, label: "Accuracy", color: colors.secondary },
                { val: `${avgSec}s`, label: "Avg Time", color: colors.primary },
              ].map((s) => (
                <View key={s.label} style={styles.doneStat}>
                  <Text style={[styles.doneStatVal, { color: s.color }]}>{s.val}</Text>
                  <Text style={[styles.doneStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => router.replace({ pathname: "/quiz", params: retryParams })}
              style={({ pressed }) => [styles.btn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            >
              <Feather name="refresh-cw" size={18} color="#fff" />
              <Text style={styles.btnText}>Try Again</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.btnOutline, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.btnOutlineText, { color: colors.foreground }]}>Back</Text>
            </Pressable>
          </View>
        </View>
        <AdBanner />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.quizWrap, { paddingTop: topPad + 8 }]}>
        <View style={styles.topBar}>
          <Pressable onPress={handleCancel} style={styles.backBtn}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
              {currentIdx + 1} / {totalQuestions}
            </Text>
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
          <Text style={[styles.modeLabel, { color: colors.mutedForeground }]}>
            {modeLabel.toUpperCase()}
          </Text>
          <Text style={[styles.questionText, { color: colors.foreground }]}>
            {currentQ.question}
          </Text>
          <View
            style={[
              styles.inputDisplay,
              { backgroundColor: colors.card, borderColor: input ? colors.primary : colors.border },
            ]}
          >
            <Text style={[styles.inputText, { color: input ? colors.foreground : colors.mutedForeground }]}>
              {input || "—"}
            </Text>
          </View>
          <Text style={[styles.autoHint, { color: colors.mutedForeground }]}>
            Auto-submits on correct answer
          </Text>
        </View>

        {phase === "result" ? (
          <View style={styles.resultArea}>
            <ResultCard isCorrect={lastCorrect} correctAnswer={currentQ.answer} userAnswer={input} />
          </View>
        ) : (
          <NumberPad
            onPress={handleDigit}
            onDelete={handleDelete}
            onClear={handleClear}
            onCancel={handleCancel}
            disabled={phase !== "question"}
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
  progressInfo: { flex: 1, alignItems: "center" },
  progressText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  scoreNum: { fontSize: 16, fontFamily: "Inter_700Bold", marginRight: 4 },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 },
  timerText: { fontSize: 13, fontFamily: "Inter_500Medium", width: 28, textAlign: "right" },
  questionArea: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 12 },
  modeLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, textTransform: "uppercase" },
  questionText: { fontSize: 40, fontFamily: "Inter_700Bold", textAlign: "center", letterSpacing: -0.5 },
  inputDisplay: { minWidth: 140, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 2, alignItems: "center" },
  inputText: { fontSize: 32, fontFamily: "Inter_600SemiBold" },
  autoHint: { fontSize: 11, fontFamily: "Inter_400Regular", letterSpacing: 0.3 },
  resultArea: { paddingBottom: 8 },
  doneWrap: { flex: 1, paddingHorizontal: 16, justifyContent: "center" },
  doneCard: { borderRadius: 20, borderWidth: 1, padding: 28, gap: 12 },
  doneTitle: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  doneMode: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  doneStats: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 16 },
  doneStat: { alignItems: "center", flex: 1 },
  doneStatVal: { fontSize: 26, fontFamily: "Inter_700Bold" },
  doneStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
  btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#ffffff" },
  btnOutline: { alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  btnOutlineText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
