import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { learner_id, question_id, selected_answer, lang } = await request.json();

  if (!learner_id || !question_id || !selected_answer) {
    return NextResponse.json({ error: '필수 값이 누락되었습니다.' }, { status: 400 });
  }

  const { data: question } = await supabase
    .from('questions')
    .select('*')
    .eq('id', question_id)
    .single();

  if (!question) return NextResponse.json({ error: '문제를 찾을 수 없습니다.' }, { status: 404 });

  const is_correct = selected_answer.toUpperCase() === question.correct_answer.toUpperCase();

  await supabase.from('quiz_attempts').insert({
    learner_id, question_id, selected_answer, is_correct, ai_feedback: null,
  });

  const explanation = lang === 'en' && question.explanation_en
    ? question.explanation_en
    : question.explanation;

  return NextResponse.json({ is_correct, correct_answer: question.correct_answer, explanation });
}
