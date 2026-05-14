export interface Learner {
  id: string;
  nickname: string;
  access_code: string;
  created_at: string;
}

export interface Question {
  id: string;
  type: 'ox' | 'multiple';
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  is_ai_generated: boolean;
  order_num: number;
  is_active: boolean;
  created_at: string;
}

export interface CaseStudy {
  id: string;
  scenario_text: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  is_ai_generated: boolean;
  order_num: number;
  is_active: boolean;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  learner_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  ai_feedback: string | null;
  created_at: string;
}

export interface CaseAttempt {
  id: string;
  learner_id: string;
  case_id: string;
  selected_answer: string;
  is_correct: boolean;
  ai_feedback: string | null;
  created_at: string;
}

export interface Certificate {
  id: string;
  learner_id: string;
  quiz_score: number;
  case_score: number;
  total_score: number;
  passed: boolean;
  certificate_code: string;
  issued_at: string;
}

export interface LearnerSession {
  learner_id: string;
  nickname: string;
}

export interface QuizResult {
  question: Question;
  selected: string;
  is_correct: boolean;
  ai_feedback: string | null;
}

export interface CaseResult {
  case: CaseStudy;
  selected: string;
  is_correct: boolean;
  ai_feedback: string | null;
}

export interface AdminStats {
  total_learners: number;
  completed_learners: number;
  avg_quiz_score: number;
  avg_case_score: number;
  avg_total_score: number;
  pass_rate: number;
}

export interface QuestionStat {
  question: Question;
  attempt_count: number;
  correct_count: number;
  correct_rate: number;
}

export interface LearnerResult {
  learner: Learner;
  quiz_score: number | null;
  case_score: number | null;
  total_score: number | null;
  passed: boolean | null;
  certificate_code: string | null;
  completed: boolean;
}
