export enum GameState {
  START = 'START',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
  ERROR = 'ERROR',
  REVIEW = 'REVIEW', // Review specific mistakes
  HISTORY = 'HISTORY', // View past scores
  MISTAKES_MENU = 'MISTAKES_MENU' // View all mistakes from menu
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Language = 'en' | 'zh';

export interface MathProblem {
  id: string;
  questionText: string;
  answer: number;
  type: 'multiplication' | 'division' | 'mixed' | 'addition' | 'subtraction';
  difficulty: number; // 1-3
}

export interface MistakeRecord {
  id: string; // Unique ID for persistence
  problem: MathProblem;
  userAnswer: number;
  timestamp: number;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  score: number;
  totalQuestions: number;
  totalTimeSeconds: number;
  difficulty: Difficulty;
}

export interface QuestionBatch {
  problems: MathProblem[];
}