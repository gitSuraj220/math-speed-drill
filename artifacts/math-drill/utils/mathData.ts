export const generateTables = () => {
  const tables: Record<number, number[]> = {};
  for (let i = 1; i <= 50; i++) {
    tables[i] = Array.from({ length: 10 }, (_, t) => i * (t + 1));
  }
  return tables;
};

export const generateSquares = () => {
  const squares: Record<number, number> = {};
  for (let i = 1; i <= 100; i++) {
    squares[i] = i * i;
  }
  return squares;
};

export const generateCubes = () => {
  const cubes: Record<number, number> = {};
  for (let i = 1; i <= 50; i++) {
    cubes[i] = i * i * i;
  }
  return cubes;
};

export interface Question {
  question: string;
  answer: number;
  hint?: string;
}

export function getTableQuestions(count: number = 10): Question[] {
  return getTableQuestionsForRange(1, 50, count);
}

export function getTableQuestionsForRange(
  from: number,
  to: number,
  count: number = 10
): Question[] {
  const questions: Question[] = [];
  const rangeSize = to - from + 1;
  for (let i = 0; i < count; i++) {
    const base = from + Math.floor(Math.random() * rangeSize);
    const multiplier = Math.ceil(Math.random() * 10);
    questions.push({
      question: `${base} × ${multiplier} = ?`,
      answer: base * multiplier,
    });
  }
  return questions;
}

export function getSquareQuestions(count: number = 10): Question[] {
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    const n = Math.ceil(Math.random() * 100);
    questions.push({
      question: `${n}² = ?`,
      answer: n * n,
    });
  }
  return questions;
}

export function getCubeQuestions(count: number = 10): Question[] {
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    const n = Math.ceil(Math.random() * 50);
    questions.push({
      question: `${n}³ = ?`,
      answer: n * n * n,
    });
  }
  return questions;
}

export function getAdditionQuestions(count: number = 10): Question[] {
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    const a = Math.floor(Math.random() * 9000) + 1000;
    const b = Math.floor(Math.random() * 9000) + 1000;
    questions.push({
      question: `${a} + ${b} = ?`,
      answer: a + b,
    });
  }
  return questions;
}
