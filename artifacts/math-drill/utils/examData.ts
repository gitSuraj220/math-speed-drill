import { Question } from './mathData';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Adds ±3–8% noise so round numbers look messy: 20 → 19.7
function addNoise(n: number): number {
  const pct = (Math.random() * 0.05 + 0.02) * (Math.random() > 0.5 ? 1 : -1);
  return Math.round(n * (1 + pct) * 10) / 10;
}

// ── Approximation ────────────────────────────────────────────────────────────
export function generateApproximationQuestions(
  difficulty: 'easy' | 'medium' | 'hard',
  count: number
): Question[] {
  return Array.from({ length: count }, () => {
    if (difficulty === 'easy') {
      // a × b, both multiples of 10
      const a = randInt(2, 9) * 10;
      const b = randInt(2, 9) * 10;
      return {
        question: `${addNoise(a)} × ${addNoise(b)} ≈ ?`,
        answer: a * b,
        tolerance: Math.round(a * b * 0.1 / 10) * 10,
        hint: 'Round each to nearest 10 first',
      };
    }
    if (difficulty === 'medium') {
      // X% of Y
      const pcts = [5, 10, 15, 20, 25, 30, 40, 50];
      const pct = pcts[randInt(0, pcts.length - 1)];
      const base = randInt(3, 20) * 50;
      const ans = Math.round((pct / 100) * base);
      return {
        question: `${addNoise(pct)}% of ${addNoise(base)} ≈ ?`,
        answer: ans,
        tolerance: Math.max(5, Math.round(ans * 0.1 / 5) * 5),
        hint: `≈ ${pct}% of ${base}`,
      };
    }
    // hard: (a × b) ÷ c
    const a = randInt(2, 9) * 100;
    const b = randInt(2, 8);
    const c = randInt(2, 8) * 10;
    const ans = Math.round((a * b) / c);
    return {
      question: `(${addNoise(a)} × ${addNoise(b)}) ÷ ${addNoise(c)} ≈ ?`,
      answer: ans,
      tolerance: Math.max(5, Math.round(ans * 0.12 / 5) * 5),
      hint: 'Round each number, then calculate',
    };
  });
}

export function generateApproximationOptions(answer: number, tolerance: number): number[] {
  const step = Math.max(10, Math.round(answer * 0.15 / 10) * 10);
  const candidates = [-3, -2, -1, 1, 2, 3]
    .map((m) => answer + m * step)
    .filter((c) => c > 0 && Math.abs(c - answer) > tolerance);
  const result = new Set<number>([answer]);
  for (const c of candidates.sort(() => Math.random() - 0.5)) {
    if (result.size >= 4) break;
    result.add(c);
  }
  let extra = step;
  while (result.size < 4) { result.add(answer + extra * 4); extra += step; }
  return Array.from(result).sort(() => Math.random() - 0.5);
}

// ── Number Series ────────────────────────────────────────────────────────────
type SeriesPattern = 'arithmetic' | 'geometric' | 'squares' | 'cubes' | 'diff_series' | 'alt_diff';

function buildSeries(pattern: SeriesPattern): { terms: number[]; answer: number } {
  if (pattern === 'arithmetic') {
    const a = randInt(1, 20), d = randInt(2, 12);
    const t = Array.from({ length: 6 }, (_, i) => a + i * d);
    return { terms: t.slice(0, 5), answer: t[5] };
  }
  if (pattern === 'geometric') {
    const a = randInt(1, 4), r = randInt(2, 3);
    const t = Array.from({ length: 5 }, (_, i) => a * Math.pow(r, i));
    return { terms: t.slice(0, 4), answer: t[4] };
  }
  if (pattern === 'squares') {
    const s = randInt(1, 8);
    const t = Array.from({ length: 5 }, (_, i) => (s + i) ** 2);
    return { terms: t.slice(0, 4), answer: t[4] };
  }
  if (pattern === 'cubes') {
    const s = randInt(1, 5);
    const t = Array.from({ length: 5 }, (_, i) => (s + i) ** 3);
    return { terms: t.slice(0, 4), answer: t[4] };
  }
  if (pattern === 'diff_series') {
    // differences form arithmetic: +2,+4,+6,+8...
    const a = randInt(2, 15), d = randInt(2, 5);
    const t = [a];
    for (let i = 1; i <= 5; i++) t.push(t[i - 1] + i * d);
    return { terms: t.slice(0, 5), answer: t[5] };
  }
  // alt_diff: alternates +d1, +d2
  const a = randInt(5, 30), d1 = randInt(2, 8), d2 = randInt(10, 25);
  const t = [a, a+d1, a+d1+d2, a+d1+d2+d1, a+d1+d2+d1+d2, a+d1+d2+d1+d2+d1];
  return { terms: t.slice(0, 5), answer: t[5] };
}

export function generateSeriesQuestions(count: number): Question[] {
  const patterns: SeriesPattern[] = ['arithmetic', 'geometric', 'squares', 'cubes', 'diff_series', 'alt_diff'];
  return Array.from({ length: count }, () => {
    const pattern = patterns[randInt(0, patterns.length - 1)];
    const { terms, answer } = buildSeries(pattern);
    return {
      question: `${terms.join(', ')}, ?`,
      answer,
      hint: 'Find the pattern in the sequence',
    };
  });
}

export function generateSeriesOptions(answer: number): number[] {
  const deltas = [1,2,3,4,5,6,8,10,12,15,-1,-2,-3,-4,-5,-6,-8,-10].filter(d => answer + d > 0);
  const result = new Set<number>([answer]);
  for (const d of deltas.sort(() => Math.random() - 0.5)) {
    if (result.size >= 4) break;
    const c = answer + d;
    if (c > 0) result.add(c);
  }
  return Array.from(result).sort(() => Math.random() - 0.5);
}

// ── Percentage Calculations ──────────────────────────────────────────────────
export type PctType = 'find_pct_of' | 'what_pct_is' | 'after_increase' | 'after_decrease' | 'mixed';

export function generatePercentageQuestions(type: PctType, count: number): Question[] {
  const types: PctType[] = ['find_pct_of', 'what_pct_is', 'after_increase', 'after_decrease'];
  return Array.from({ length: count }, () => {
    const t: PctType = type === 'mixed' ? types[randInt(0, 3)] : type;

    if (t === 'find_pct_of') {
      const pcts = [5,10,15,20,25,30,40,50,60,75,80];
      const pct = pcts[randInt(0, pcts.length - 1)];
      const base = randInt(2, 20) * 20;
      return {
        question: `${pct}% of ${base} = ?`,
        answer: (pct / 100) * base,
        hint: `${pct}/100 × ${base}`,
      };
    }
    if (t === 'what_pct_is') {
      const whole = randInt(2, 10) * 100;
      const pct = [10, 20, 25, 40, 50, 75][randInt(0, 5)];
      const part = (pct / 100) * whole;
      return {
        question: `${part} is what % of ${whole}?`,
        answer: pct,
        hint: `(${part} ÷ ${whole}) × 100`,
      };
    }
    if (t === 'after_increase') {
      const base = randInt(4, 20) * 25;
      const pct = [5,10,15,20,25,30,40,50][randInt(0, 7)];
      const ans = base + (pct / 100) * base;
      return {
        question: `${base} after ${pct}% increase = ?`,
        answer: ans,
        hint: `${base} × ${(1 + pct/100).toFixed(2)}`,
      };
    }
    // after_decrease
    const base = randInt(4, 20) * 25;
    const pct = [5,10,15,20,25,30][randInt(0, 5)];
    const ans = base - (pct / 100) * base;
    return {
      question: `${base} after ${pct}% decrease = ?`,
      answer: ans,
      hint: `${base} × ${(1 - pct/100).toFixed(2)}`,
    };
  });
}

export function generatePercentageOptions(answer: number): number[] {
  const step = Math.max(5, Math.round(answer * 0.1 / 5) * 5);
  const candidates = [-3,-2,-1,1,2,3].map(m => answer + m * step).filter(c => c > 0);
  const result = new Set<number>([answer]);
  for (const c of candidates.sort(() => Math.random() - 0.5)) {
    if (result.size >= 4) break;
    result.add(c);
  }
  return Array.from(result).sort(() => Math.random() - 0.5);
}

// ── Simplification (BODMAS) ──────────────────────────────────────────────────
export function generateSimplificationQuestions(
  difficulty: 'easy' | 'medium' | 'hard',
  count: number
): Question[] {
  const questions: Question[] = [];
  let attempts = 0;
  while (questions.length < count && attempts < count * 10) {
    attempts++;
    let q: Question | null = null;
    if (difficulty === 'easy') {
      const a = randInt(2, 30), b = randInt(2, 12), c = randInt(2, 12);
      const ans = a + b * c;
      q = { question: `${a} + ${b} × ${c} = ?`, answer: ans, hint: '× before +' };
    } else if (difficulty === 'medium') {
      const a = randInt(2, 15), b = randInt(2, 15), c = randInt(2, 8), d = randInt(1, 20);
      const ans = (a + b) * c - d;
      if (ans > 0) q = { question: `(${a} + ${b}) × ${c} − ${d} = ?`, answer: ans, hint: 'Brackets → × → −' };
    } else {
      // hard: a² + b × c − d
      const a = randInt(2, 9), b = randInt(2, 9), c = randInt(2, 9), d = randInt(1, 20);
      const ans = a * a + b * c - d;
      if (ans > 0) q = { question: `${a}² + ${b} × ${c} − ${d} = ?`, answer: ans, hint: '² → × → + and −' };
    }
    if (q) questions.push(q);
  }
  return questions;
}
