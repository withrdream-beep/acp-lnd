import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function generateCertCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'ACP-';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  const { learner_id } = await request.json();

  if (!learner_id) {
    return NextResponse.json({ error: '학습자 정보가 없습니다.' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('certificates')
    .select('*')
    .eq('learner_id', learner_id)
    .single();

  if (existing) {
    return NextResponse.json({ certificate: existing });
  }

  const [{ data: quizAttempts }, { data: caseAttempts }] = await Promise.all([
    supabase.from('quiz_attempts').select('is_correct').eq('learner_id', learner_id),
    supabase.from('case_attempts').select('is_correct').eq('learner_id', learner_id),
  ]);

  const totalQuiz = quizAttempts?.length ?? 0;
  const correctQuiz = quizAttempts?.filter((a) => a.is_correct).length ?? 0;
  const quizScore = totalQuiz > 0 ? Math.round((correctQuiz / totalQuiz) * 100) : 0;

  const totalCase = caseAttempts?.length ?? 0;
  const correctCase = caseAttempts?.filter((a) => a.is_correct).length ?? 0;
  const caseScore = totalCase > 0 ? Math.round((correctCase / totalCase) * 100) : 0;

  const totalScore = Math.round((quizScore + caseScore) / 2);
  const passed = totalScore >= 70;

  const { data: certificate, error } = await supabase
    .from('certificates')
    .insert({
      learner_id,
      quiz_score: quizScore,
      case_score: caseScore,
      total_score: totalScore,
      passed,
      certificate_code: generateCertCode(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: '수료증 발급 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ certificate });
}
