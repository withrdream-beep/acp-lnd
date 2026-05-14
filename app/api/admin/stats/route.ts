import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function verifyAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  const [{ data: learners }, { data: quizAttempts }, { data: caseAttempts }, { data: questions }, { data: cases }] =
    await Promise.all([
      supabase.from('learners').select('*').order('created_at', { ascending: false }),
      supabase.from('quiz_attempts').select('question_id, is_correct, learner_id'),
      supabase.from('case_attempts').select('case_id, is_correct, learner_id'),
      supabase.from('questions').select('*').eq('is_active', true).eq('is_ai_generated', false).order('order_num'),
      supabase.from('case_studies').select('*').eq('is_active', true).eq('is_ai_generated', false).order('order_num'),
    ]);

  const totalLearners = learners?.length ?? 0;

  // 퀴즈 평균: 응답한 학습자 기준
  const learnerQuizRates = (learners ?? []).map((l) => {
    const lq = (quizAttempts ?? []).filter((a) => a.learner_id === l.id);
    return lq.length > 0 ? (lq.filter((a) => a.is_correct).length / lq.length) * 100 : null;
  }).filter((r) => r !== null) as number[];

  const avgQuizScore = learnerQuizRates.length > 0
    ? Math.round(learnerQuizRates.reduce((s, r) => s + r, 0) / learnerQuizRates.length)
    : 0;

  // 케이스 평균: 응답한 학습자 기준
  const learnerCaseRates = (learners ?? []).map((l) => {
    const lc = (caseAttempts ?? []).filter((a) => a.learner_id === l.id);
    return lc.length > 0 ? (lc.filter((a) => a.is_correct).length / lc.length) * 100 : null;
  }).filter((r) => r !== null) as number[];

  const avgCaseScore = learnerCaseRates.length > 0
    ? Math.round(learnerCaseRates.reduce((s, r) => s + r, 0) / learnerCaseRates.length)
    : 0;

  // 퀴즈 문항별 정답률 (낮은 순)
  const questionStats = (questions ?? []).map((q) => {
    const attempts = (quizAttempts ?? []).filter((a) => a.question_id === q.id);
    const correct = attempts.filter((a) => a.is_correct).length;
    return {
      id: q.id,
      type: q.type,
      question_text: q.question_text,
      explanation: q.explanation,
      attempt_count: attempts.length,
      correct_rate: attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : null,
    };
  }).filter((q) => q.attempt_count > 0).sort((a, b) => (a.correct_rate ?? 100) - (b.correct_rate ?? 100));

  // 케이스 문항별 정답률 (낮은 순)
  const caseStats = (cases ?? []).map((cs) => {
    const attempts = (caseAttempts ?? []).filter((a) => a.case_id === cs.id);
    const correct = attempts.filter((a) => a.is_correct).length;
    return {
      id: cs.id,
      scenario_text: cs.scenario_text,
      question: cs.question,
      explanation: cs.explanation,
      attempt_count: attempts.length,
      correct_rate: attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : null,
    };
  }).filter((c) => c.attempt_count > 0).sort((a, b) => (a.correct_rate ?? 100) - (b.correct_rate ?? 100));

  // 리더보드
  const rankings = (learners ?? []).map((learner) => {
    const lQuiz = (quizAttempts ?? []).filter((a) => a.learner_id === learner.id);
    const lCase = (caseAttempts ?? []).filter((a) => a.learner_id === learner.id);
    const quizRate = lQuiz.length > 0 ? (lQuiz.filter((a) => a.is_correct).length / lQuiz.length) * 100 : null;
    const caseRate = lCase.length > 0 ? (lCase.filter((a) => a.is_correct).length / lCase.length) * 100 : null;
    const rates = [quizRate, caseRate].filter((r) => r !== null) as number[];
    const combinedRate = rates.length > 0 ? rates.reduce((s, r) => s + r, 0) / rates.length : null;
    return {
      learner_id: learner.id,
      nickname: learner.nickname,
      quiz_rate: quizRate !== null ? Math.round(quizRate) : null,
      case_rate: caseRate !== null ? Math.round(caseRate) : null,
      combined_rate: combinedRate !== null ? Math.round(combinedRate) : null,
    };
  }).filter((r) => r.combined_rate !== null)
    .sort((a, b) => (b.combined_rate ?? 0) - (a.combined_rate ?? 0));

  let rank = 1;
  const ranked = rankings.map((entry, i) => {
    if (i > 0 && entry.combined_rate! < rankings[i - 1].combined_rate!) rank = i + 1;
    return { ...entry, rank };
  });

  return NextResponse.json({
    stats: { total_learners: totalLearners, avg_quiz_score: avgQuizScore, avg_case_score: avgCaseScore },
    question_stats: questionStats,
    case_stats: caseStats,
    leaderboard: ranked.filter((e) => e.rank <= 3),
  });
}
