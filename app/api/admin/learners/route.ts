import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function verifyAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  const [{ data: learners }, { data: certificates }, { data: quizAttempts }, { data: caseAttempts }] =
    await Promise.all([
      supabase.from('learners').select('*').order('created_at', { ascending: false }),
      supabase.from('certificates').select('*'),
      supabase.from('quiz_attempts').select('learner_id, is_correct'),
      supabase.from('case_attempts').select('learner_id, is_correct'),
    ]);

  const results = (learners ?? []).map((learner) => {
    const cert = (certificates ?? []).find((c) => c.learner_id === learner.id);
    const lQuiz = (quizAttempts ?? []).filter((a) => a.learner_id === learner.id);
    const lCase = (caseAttempts ?? []).filter((a) => a.learner_id === learner.id);

    let quiz_score = null;
    let case_score = null;
    if (lQuiz.length > 0) {
      quiz_score = Math.round((lQuiz.filter((a) => a.is_correct).length / lQuiz.length) * 100);
    }
    if (lCase.length > 0) {
      case_score = Math.round((lCase.filter((a) => a.is_correct).length / lCase.length) * 100);
    }

    return {
      learner,
      quiz_score: cert?.quiz_score ?? quiz_score,
      case_score: cert?.case_score ?? case_score,
      total_score: cert?.total_score ?? null,
      passed: cert?.passed ?? null,
      certificate_code: cert?.certificate_code ?? null,
      completed: !!cert,
      quiz_answered: lQuiz.length,
      case_answered: lCase.length,
    };
  });

  return NextResponse.json({ learners: results });
}
