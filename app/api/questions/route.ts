import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const lang = new URL(request.url).searchParams.get('lang') || 'ko';

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('is_active', true)
    .eq('is_ai_generated', false)
    .order('order_num', { ascending: true });

  if (error) return NextResponse.json({ error: '문제를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });

  const questions = (data ?? []).map((q) => ({
    ...q,
    question_text: lang === 'en' && q.question_text_en ? q.question_text_en : q.question_text,
    options: lang === 'en' && q.options_en ? q.options_en : q.options,
    explanation: lang === 'en' && q.explanation_en ? q.explanation_en : q.explanation,
  }));

  return NextResponse.json({ questions });
}
