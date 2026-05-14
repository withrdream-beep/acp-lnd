import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { learner_id, case_id, selected_answer, lang } = await request.json();

  if (!learner_id || !case_id || !selected_answer) {
    return NextResponse.json({ error: '필수 값이 누락되었습니다.' }, { status: 400 });
  }

  const { data: cs } = await supabase
    .from('case_studies').select('*').eq('id', case_id).single();

  if (!cs) return NextResponse.json({ error: '케이스를 찾을 수 없습니다.' }, { status: 404 });

  const is_correct = selected_answer.toUpperCase() === cs.correct_answer.toUpperCase();

  await supabase.from('case_attempts').insert({
    learner_id, case_id, selected_answer, is_correct, ai_feedback: null,
  });

  const explanation = lang === 'en' && cs.explanation_en ? cs.explanation_en : cs.explanation;

  return NextResponse.json({ is_correct, correct_answer: cs.correct_answer, explanation });
}
