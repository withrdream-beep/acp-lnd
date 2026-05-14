import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const learner_id = searchParams.get('learner_id');

  if (!learner_id) {
    return NextResponse.json({ error: '학습자 정보가 없습니다.' }, { status: 400 });
  }

  const [{ data: quizAttempts }, { data: caseAttempts }, { data: certificate }] =
    await Promise.all([
      supabase
        .from('quiz_attempts')
        .select('*, questions(*)')
        .eq('learner_id', learner_id),
      supabase
        .from('case_attempts')
        .select('*, case_studies(*)')
        .eq('learner_id', learner_id),
      supabase
        .from('certificates')
        .select('*')
        .eq('learner_id', learner_id)
        .single(),
    ]);

  const totalQuiz = quizAttempts?.length ?? 0;
  const correctQuiz = quizAttempts?.filter((a) => a.is_correct).length ?? 0;
  const quizScore = totalQuiz > 0 ? Math.round((correctQuiz / totalQuiz) * 100) : 0;

  const totalCase = caseAttempts?.length ?? 0;
  const correctCase = caseAttempts?.filter((a) => a.is_correct).length ?? 0;
  const caseScore = totalCase > 0 ? Math.round((correctCase / totalCase) * 100) : 0;

  const totalScore = Math.round((quizScore + caseScore) / 2);

  return NextResponse.json({
    quiz_score: quizScore,
    case_score: caseScore,
    total_score: totalScore,
    quiz_correct: correctQuiz,
    quiz_total: totalQuiz,
    case_correct: correctCase,
    case_total: totalCase,
    passed: totalScore >= 70,
    certificate,
    quiz_attempts: quizAttempts,
    case_attempts: caseAttempts,
  });
}
