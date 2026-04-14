export interface Question {
  question: string;
  answer: number;
  tolerance?: number;
  hint?: string;
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
