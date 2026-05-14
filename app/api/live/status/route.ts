import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function applyLang(cs: Record<string, unknown>, lang: string) {
  if (lang !== 'en') return cs;
  return {
    ...cs,
    scenario_text: cs.scenario_text_en || cs.scenario_text,
    question: cs.question_en || cs.question,
    options: cs.options_en || cs.options,
    explanation: cs.explanation_en || cs.explanation,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const learner_id = searchParams.get('learner_id');
  const lang = searchParams.get('lang') || 'ko';

  const { data: settings } = await supabase
    .from('live_settings').select('*').eq('id', 1).single();

  if (!settings) {
    return NextResponse.json({ current_case_index: -1, is_revealed: false, case: null });
  }

  const { current_case_index, is_revealed } = settings;

  if (current_case_index < 0 || current_case_index >= 99) {
    return NextResponse.json({ current_case_index, is_revealed: false, case: null, learner_answered: false, learner_correct: null, group_correct_pct: null });
  }

  const { data: cases } = await supabase
    .from('case_studies').select('*').eq('is_active', true).eq('is_ai_generated', false)
    .order('order_num', { ascending: true });

  const rawCase = cases?.[current_case_index] ?? null;
  const currentCase = rawCase ? applyLang(rawCase, lang) : null;

  let learner_answered = false;
  let learner_correct: boolean | null = null;
  let group_correct_pct: number | null = null;

  if (rawCase && learner_id) {
    const { data: attempt } = await supabase
      .from('case_attempts').select('is_correct').eq('learner_id', learner_id).eq('case_id', rawCase.id).single();
    if (attempt) { learner_answered = true; learner_correct = attempt.is_correct; }
  }

  if (rawCase && is_revealed) {
    const { data: allAttempts } = await supabase
      .from('case_attempts').select('is_correct').eq('case_id', rawCase.id);
    if (allAttempts && allAttempts.length > 0) {
      group_correct_pct = Math.round((allAttempts.filter((a) => a.is_correct).length / allAttempts.length) * 100);
    }
  }

  return NextResponse.json({
    current_case_index, is_revealed, case: currentCase,
    learner_answered, learner_correct, group_correct_pct,
    total_cases: cases?.length ?? 0,
  });
}
