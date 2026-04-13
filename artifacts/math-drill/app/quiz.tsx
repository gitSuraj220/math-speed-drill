import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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
  getCubeQuestions,
  getSquareQuestions,
  getTableQuestions,
} from "@/utils/mathData";

const TOTAL_QUESTIONS = 10;
const QUESTION_TIME = 25;

type Mode = "tables" | "squarecube" | "addition";

function getModeLabel(mode: Mode) {
  if (mode === "tables") return "Table Master";
  if (mode === "squarecube") return "Square / Cube";
  return "Lightning Addition";
}

function getQuestions(mode: Mode): Question[] {
  if (mode === "tables") return getTableQuestions(TOTAL_QUESTIONS);
  if (mode === "squarecube") {
    const sq = getSquareQuestions(5);
    const cb = getCubeQuestions(5);
    return [...sq, ...cb].sort(() => Math.random() - 0.5);
  }
  return getAdditionQuestions(TOTAL_QUESTIONS);
}

export default function QuizScreen() {
  const params = useLocalSearchParams<{ mode: string }>();
  const mode = (params.mode as Mode) || "tables";
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addSession } = useStats();

  const [questions] = useState<Question[]>(() => getQuestions(mode));
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

  const currentQ = questions[currentIdx];
  const progress = timeLeft / QUESTION_TIME;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(QUESTION_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopTimer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [stopTimer]);

  useEffect(() => {
    if (phase === "question") {
      questionStartRef.current = Date.now();
      startTimer();
    }
    return stopTimer;
  }, [phase, currentIdx]);

  useEffect(() => {
    if (timeLeft === 0 && phase === "question") {
      handleSubmit(true);
    }
  }, [timeLeft, phase]);

  const handleSubmit = useCallback(
    (timeout = false) => {
      stopTimer();
      const elapsed = Date.now() - questionStartRef.current;
      const userAnswer = timeout ? "" : input;
      const isCorrect =
        !timeout && parseInt(userAnswer, 10) === currentQ.answer;

      setLastCorrect(isCorrect);
      setAnswerTimes((prev) => [...prev, elapsed]);

      if (isCorrect) {
        setCorrect((c) => c + 1);
      } else {
        setIncorrect((ic) => ic + 1);
      }

      setPhase("result");

      setTimeout(async () => {
        if (currentIdx + 1 >= TOTAL_QUESTIONS) {
          const totalTime = [...answerTimes, elapsed];
          const avg = Math.round(
            totalTime.reduce((a, b) => a + b, 0) / totalTime.length
          );
          await addSession({
            mode: getModeLabel(mode),
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
      }, 1200);
    },
    [input, currentQ, currentIdx, correct, incorrect, answerTimes, mode, addSession, stopTimer]
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (phase === "done") {
    const total = correct + incorrect;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    const avgMs =
      answerTimes.length > 0
        ? Math.round(answerTimes.reduce((a, b) => a + b, 0) / answerTimes.length / 1000)
        : 0;

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.doneContainer, { paddingTop: topPad + 24 }]}>
          <View
            style={[
              styles.doneCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.doneTitle, { color: colors.primary }]}>
              Session Complete
            </Text>
            <Text style={[styles.doneMode, { color: colors.mutedForeground }]}>
              {getModeLabel(mode)}
            </Text>

            <View style={styles.doneStats}>
              <View style={styles.doneStat}>
                <Text style={[styles.doneStatVal, { color: colors.success }]}>
                  {correct}
                </Text>
                <Text
                  style={[styles.doneStatLabel, { color: colors.mutedForeground }]}
                >
                  Correct
                </Text>
              </View>
              <View style={styles.doneStat}>
                <Text
                  style={[styles.doneStatVal, { color: colors.destructive }]}
                >
                  {incorrect}
                </Text>
                <Text
                  style={[styles.doneStatLabel, { color: colors.mutedForeground }]}
                >
                  Wrong
                </Text>
              </View>
              <View style={styles.doneStat}>
                <Text
                  style={[styles.doneStatVal, { color: colors.secondary }]}
                >
                  {acc}%
                </Text>
                <Text
                  style={[styles.doneStatLabel, { color: colors.mutedForeground }]}
                >
                  Accuracy
                </Text>
              </View>
              <View style={styles.doneStat}>
                <Text
                  style={[styles.doneStatVal, { color: colors.primary }]}
                >
                  {avgMs}s
                </Text>
                <Text
                  style={[styles.doneStatLabel, { color: colors.mutedForeground }]}
                >
                  Avg. Time
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.replace({ pathname: "/quiz", params: { mode } })}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="refresh-cw" size={18} color="#fff" />
              <Text style={styles.btnText}>Try Again</Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.btnOutline,
                {
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.btnOutlineText, { color: colors.foreground }]}>
                Back to Dashboard
              </Text>
            </Pressable>
          </View>
        </View>
        <AdBanner />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.quizContainer, { paddingTop: topPad + 8 }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => { stopTimer(); router.back(); }}
            style={styles.backBtn}
          >
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
              {currentIdx + 1} / {TOTAL_QUESTIONS}
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
          <Text style={[styles.timerText, { color: colors.mutedForeground }]}>
            {timeLeft}s
          </Text>
        </View>

        <View style={styles.questionArea}>
          <Text style={[styles.modeLabel, { color: colors.mutedForeground }]}>
            {getModeLabel(mode).toUpperCase()}
          </Text>
          <Text style={[styles.questionText, { color: colors.foreground }]}>
            {currentQ.question}
          </Text>

          <View
            style={[
              styles.inputDisplay,
              {
                backgroundColor: colors.card,
                borderColor: input ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.inputText,
                { color: input ? colors.foreground : colors.mutedForeground },
              ]}
            >
              {input || "—"}
            </Text>
          </View>
        </View>

        {phase === "result" ? (
          <View style={styles.resultArea}>
            <ResultCard
              isCorrect={lastCorrect}
              correctAnswer={currentQ.answer}
              userAnswer={input}
            />
          </View>
        ) : (
          <NumberPad
            onPress={(d) => setInput((prev) => (prev.length < 8 ? prev + d : prev))}
            onDelete={() => setInput((prev) => prev.slice(0, -1))}
            onSubmit={() => handleSubmit(false)}
            disabled={phase !== "question"}
          />
        )}
      </View>
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  quizContainer: {
    flex: 1,
    paddingBottom: 8,
    gap: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  backBtn: {
    padding: 6,
  },
  progressInfo: {
    flex: 1,
    alignItems: "center",
  },
  progressText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scoreNum: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginRight: 4,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  timerText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    width: 28,
    textAlign: "right",
  },
  questionArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  modeLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  questionText: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  inputDisplay: {
    minWidth: 140,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
  },
  inputText: {
    fontSize: 32,
    fontFamily: "Inter_600SemiBold",
  },
  resultArea: {
    paddingBottom: 8,
  },
  doneContainer: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  doneCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    gap: 12,
  },
  doneTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  doneMode: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  doneStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  doneStat: {
    alignItems: "center",
    flex: 1,
  },
  doneStatVal: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  doneStatLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  btnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
  btnOutline: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  btnOutlineText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
