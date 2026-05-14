import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function verifyAdmin(request: NextRequest): boolean {
  const auth = request.headers.get('x-admin-password');
  return auth === process.env.ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  const [{ data: learners }, { data: certificates }, { data: quizAttempts }, { data: caseAttempts }, { data: questions }] =
    await Promise.all([
      supabase.from('learners').select('*').order('created_at', { ascending: false }),
      supabase.from('certificates').select('*'),
      supabase.from('quiz_attempts').select('*, questions(*)'),
      supabase.from('case_attempts').select('*, case_studies(*)'),
      supabase.from('questions').select('*').eq('is_active', true).eq('is_ai_generated', false),
    ]);

  const totalLearners = learners?.length ?? 0;
  const completedLearners = certificates?.length ?? 0;

  const avgQuizScore = certificates?.length
    ? Math.round(certificates.reduce((sum, c) => sum + c.quiz_score, 0) / certificates.length)
    : 0;
  const avgCaseScore = certificates?.length
    ? Math.round(certificates.reduce((sum, c) => sum + c.case_score, 0) / certificates.length)
    : 0;
  const avgTotalScore = certificates?.length
    ? Math.round(certificates.reduce((sum, c) => sum + c.total_score, 0) / certificates.length)
    : 0;
  const passRate = certificates?.length
    ? Math.round((certificates.filter((c) => c.passed).length / certificates.length) * 100)
    : 0;

  const questionStats = (questions ?? []).map((q) => {
    const attempts = (quizAttempts ?? []).filter((a) => a.question_id === q.id);
    const correct = attempts.filter((a) => a.is_correct).length;
    return {
      question: q,
      attempt_count: attempts.length,
      correct_count: correct,
      correct_rate: attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 0,
    };
  }).sort((a, b) => a.correct_rate - b.correct_rate);

  // 퀴즈+케이스 정답률 기반 순위 (동점 포함)
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

  // 동점 포함 rank 부여, Top3 rank까지만 포함
  let rank = 1;
  const ranked = rankings.map((entry, i) => {
    if (i > 0 && entry.combined_rate! < rankings[i - 1].combined_rate!) rank = i + 1;
    return { ...entry, rank };
  });
  const leaderboardData = ranked.filter((e) => e.rank <= 3);

  return NextResponse.json({
    stats: {
      total_learners: totalLearners,
      completed_learners: completedLearners,
      avg_quiz_score: avgQuizScore,
      avg_case_score: avgCaseScore,
      avg_total_score: avgTotalScore,
      pass_rate: passRate,
    },
    question_stats: questionStats,
    leaderboard: leaderboardData,
    learners: learners ?? [],
    certificates: certificates ?? [],
  });
}
