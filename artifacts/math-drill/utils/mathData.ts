export interface Question {
  question: string;
  answer: number;
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
