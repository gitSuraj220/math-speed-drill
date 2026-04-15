export interface Question {
  question: string;
  answer: number;
  tolerance?: number;
  hint?: string;
  /** Unique key used to track per-question performance e.g. "12x7" */
  adaptiveKey?: string;
}

export function getTableQuestionsForRange(
  from: number,
  to: number,
  count: number = 10
): Question[] {
  if (from === to) {
    const base = from;
    const questions: Question[] = [];
    let remaining = count;
    while (remaining > 0) {
      const shuffled = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort(
        () => Math.random() - 0.5
      );
      const take = Math.min(remaining, 10);
      for (let i = 0; i < take; i++) {
        questions.push({
          question: `${base} × ${shuffled[i]} = ?`,
          answer: base * shuffled[i],
        });
      }
      remaining -= take;
    }
    return questions;
  }
  const rangeSize = to - from + 1;
  return Array.from({ length: count }, () => {
    const base = from + Math.floor(Math.random() * rangeSize);
    const multiplier = Math.ceil(Math.random() * 10);
    return { question: `${base} × ${multiplier} = ?`, answer: base * multiplier };
  });
}

export function getTableQuestions(count: number = 10): Question[] {
  return getTableQuestionsForRange(1, 50, count);
}

export function getSquareQuestionsForRange(
  from: number,
  to: number,
  count: number = 10
): Question[] {
  const rangeSize = to - from + 1;
  return Array.from({ length: count }, () => {
    const n = from + Math.floor(Math.random() * rangeSize);
    return { question: `${n}² = ?`, answer: n * n };
  });
}

export function getSquareQuestions(count: number = 10): Question[] {
  return getSquareQuestionsForRange(1, 100, count);
}

export function getCubeQuestionsForRange(
  from: number,
  to: number,
  count: number = 10
): Question[] {
  const rangeSize = to - from + 1;
  return Array.from({ length: count }, () => {
    const n = from + Math.floor(Math.random() * rangeSize);
    return { question: `${n}³ = ?`, answer: n * n * n };
  });
}

export function getCubeQuestions(count: number = 10): Question[] {
  return getCubeQuestionsForRange(1, 50, count);
}

export function getAdditionQuestions(count: number = 10): Question[] {
  return Array.from({ length: count }, () => {
    const a = Math.floor(Math.random() * 9000) + 1000;
    const b = Math.floor(Math.random() * 9000) + 1000;
    return { question: `${a} + ${b} = ?`, answer: a + b };
  });
}

// ── Digit range helpers ───────────────────────────────────────────────────
function digitMin(d: number): number {
  if (d === 1) return 1;
  return Math.pow(10, d - 1);
}
function digitMax(d: number): number {
  return Math.pow(10, d) - 1;
}
function randInDigits(d: number): number {
  return Math.floor(Math.random() * (digitMax(d) - digitMin(d) + 1)) + digitMin(d);
}

// ── Digit-specific addition ───────────────────────────────────────────────
/**
 * Generates addition questions for specific digit combinations.
 * e.g. digits1=2, digits2=3 → "45 + 312 = ?"
 */
export function getDigitAdditionQuestions(
  digits1: number,
  digits2: number,
  count: number
): Question[] {
  return Array.from({ length: count }, () => {
    const a = randInDigits(digits1);
    const b = randInDigits(digits2);
    return { question: `${a} + ${b} = ?`, answer: a + b };
  });
}

// ── Digit-specific subtraction ────────────────────────────────────────────
/**
 * Generates subtraction questions. Always ensures result ≥ 0.
 * e.g. digits1=2, digits2=2 → "87 - 34 = ?"
 */
export function getDigitSubtractionQuestions(
  digits1: number,
  digits2: number,
  count: number
): Question[] {
  return Array.from({ length: count }, () => {
    let a = randInDigits(digits1);
    let b = randInDigits(digits2);
    // Make sure a >= b so answer is never negative
    if (b > a) [a, b] = [b, a];
    return { question: `${a} − ${b} = ?`, answer: a - b };
  });
}

// ── Mixed operation questions ─────────────────────────────────────────────
/**
 * Mixes addition and subtraction questions for given digit combo.
 */
export function getMixedOperationQuestions(
  digits1: number,
  digits2: number,
  count: number
): Question[] {
  return Array.from({ length: count }, () => {
    const isAdd = Math.random() > 0.5;
    let a = randInDigits(digits1);
    let b = randInDigits(digits2);
    if (!isAdd && b > a) [a, b] = [b, a];
    return isAdd
      ? { question: `${a} + ${b} = ?`, answer: a + b }
      : { question: `${a} − ${b} = ?`, answer: a - b };
  });
}

interface FractionEntry {
  num: number;
  den: number;
  pct: number;
  pctStr: string;
}

function buildFractionTable(): FractionEntry[] {
  const entries: FractionEntry[] = [];
  for (let d = 1; d <= 16; d++) {
    for (let n = 1; n <= Math.min(d, 10); n++) {
      const raw = (n / d) * 100;
      const pct = Math.floor(raw * 100) / 100;
      const pctStr =
        Number.isInteger(pct) ? `${pct}` : pct.toFixed(2);
      entries.push({ num: n, den: d, pct, pctStr });
    }
  }
  return entries;
}

const FRACTION_TABLE = buildFractionTable();

export function getFractionToPercentQuestions(count: number): Question[] {
  return Array.from({ length: count }, () => {
    const e = FRACTION_TABLE[Math.floor(Math.random() * FRACTION_TABLE.length)];
    const isInteger = Number.isInteger(e.pct);
    return {
      question: `${e.num} / ${e.den}  =  ? %`,
      answer: e.pct,
      tolerance: 0.5,
      hint: isInteger ? "Whole number" : "e.g. 33.33",
    };
  });
}

export function getPercentToFractionQuestions(count: number): Question[] {
  return Array.from({ length: count }, () => {
    const e = FRACTION_TABLE[Math.floor(Math.random() * FRACTION_TABLE.length)];
    return {
      question: `? / ${e.den}  =  ${e.pctStr}%`,
      answer: e.num,
      tolerance: 0,
      hint: "Enter numerator",
    };
  });
}

export function getFractionMixedQuestions(count: number): Question[] {
  const half = Math.ceil(count / 2);
  return [
    ...getFractionToPercentQuestions(half),
    ...getPercentToFractionQuestions(count - half),
  ].sort(() => Math.random() - 0.5);
}

// ── Smart Adaptive Table Generator ───────────────────────────────────────
/**
 * Builds the FULL pool of all (base × multiplier) questions for a range.
 * Every question has an adaptiveKey like "12x7".
 */
export function buildFullTablePool(from: number, to: number): Question[] {
  const pool: Question[] = [];
  for (let base = from; base <= to; base++) {
    for (let mul = 1; mul <= 10; mul++) {
      pool.push({
        question: `${base} × ${mul} = ?`,
        answer: base * mul,
        adaptiveKey: `${base}x${mul}`,
      });
    }
  }
  return pool;
}

/**
 * Weighted random pick — items with higher weight appear more often.
 */
function weightedPick<T>(
  items: T[],
  weights: number[],
  alreadyPicked: Set<number>
): number {
  // Only consider items not already picked in this batch
  const candidates = items
    .map((_, i) => i)
    .filter((i) => !alreadyPicked.has(i));
  if (candidates.length === 0) return -1;

  const totalWeight = candidates.reduce((sum, i) => sum + weights[i], 0);
  let rand = Math.random() * totalWeight;
  for (const i of candidates) {
    rand -= weights[i];
    if (rand <= 0) return i;
  }
  return candidates[candidates.length - 1];
}

/**
 * Smart adaptive table question selector.
 *
 * Algorithm:
 *  1. Separate pool into UNSEEN and SEEN buckets.
 *  2. UNSEEN questions always fill the batch first (coverage priority).
 *  3. Remaining slots are filled via weighted random from ALL questions,
 *     where weight reflects difficulty (slow / wrong = higher weight).
 *  4. Batch is shuffled before returning.
 *
 * @param from       Table range start
 * @param to         Table range end
 * @param count      How many questions to return
 * @param perfMap    Per-question performance data from AdaptiveContext
 * @param getWeight  Weight function from AdaptiveContext
 */
export function getSmartTableQuestions(
  from: number,
  to: number,
  count: number,
  perfMap: Record<string, { attempts: number; avgTimeMs: number; errorCount: number }>,
  getWeight: (perf: { attempts: number; avgTimeMs: number; errorCount: number } | undefined) => number
): Question[] {
  const pool = buildFullTablePool(from, to);
  const weights = pool.map((q) => getWeight(q.adaptiveKey ? perfMap[q.adaptiveKey] : undefined));

  const unseen = pool
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => !q.adaptiveKey || !perfMap[q.adaptiveKey] || perfMap[q.adaptiveKey].attempts === 0);

  const picked = new Set<number>();
  const result: Question[] = [];

  // Phase 1: coverage — add unseen questions first (shuffled)
  const shuffledUnseen = unseen.sort(() => Math.random() - 0.5);
  for (const { i } of shuffledUnseen) {
    if (result.length >= count) break;
    picked.add(i);
    result.push(pool[i]);
  }

  // Phase 2: fill remaining with weighted picks (hard questions prioritised)
  while (result.length < count) {
    const idx = weightedPick(pool, weights, picked);
    if (idx === -1) break; // all questions exhausted
    picked.add(idx);
    result.push(pool[idx]);
  }

  // Shuffle final batch so unseen and repetition questions are interleaved
  return result.sort(() => Math.random() - 0.5);
}
