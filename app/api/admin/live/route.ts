import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function verifyAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

// GET: 현재 라이브 상태 + 결과
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  const { data: settings } = await supabase
    .from('live_settings')
    .select('*')
    .eq('id', 1)
    .single();

  const { data: cases } = await supabase
    .from('case_studies')
    .select('*')
    .eq('is_active', true)
    .eq('is_ai_generated', false)
    .order('order_num', { ascending: true });

  const currentIdx = settings?.current_case_index ?? -1;
  const currentCase = cases && currentIdx >= 0 && currentIdx < (cases.length ?? 0)
    ? cases[currentIdx]
    : null;

  let distribution: Record<string, { count: number; pct: number }> = {};
  let total_answered = 0;
  let correct_count = 0;

  if (currentCase) {
    const { data: attempts } = await supabase
      .from('case_attempts')
      .select('selected_answer, is_correct')
      .eq('case_id', currentCase.id);

    total_answered = attempts?.length ?? 0;
    correct_count = attempts?.filter((a) => a.is_correct).length ?? 0;

    const labels = ['A', 'B', 'C', 'D'];
    labels.forEach((label) => {
      const count = attempts?.filter((a) => a.selected_answer.toUpperCase() === label).length ?? 0;
      distribution[label] = {
        count,
        pct: total_answered > 0 ? Math.round((count / total_answered) * 100) : 0,
      };
    });
  }

  return NextResponse.json({
    settings,
    cases: cases ?? [],
    current_case: currentCase,
    distribution,
    total_answered,
    correct_count,
    correct_pct: total_answered > 0 ? Math.round((correct_count / total_answered) * 100) : 0,
  });
}

// POST: 라이브 제어
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  const { action } = await request.json();

  const { data: settings } = await supabase
    .from('live_settings')
    .select('*')
    .eq('id', 1)
    .single();

  const { data: cases } = await supabase
    .from('case_studies')
    .select('id')
    .eq('is_active', true)
    .eq('is_ai_generated', false)
    .order('order_num', { ascending: true });

  const totalCases = cases?.length ?? 0;
  const currentIdx = settings?.current_case_index ?? -1;

  let updates: { current_case_index?: number; is_revealed?: boolean; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (action === 'start') {
    updates = { ...updates, current_case_index: 0, is_revealed: false };
  } else if (action === 'reveal') {
    updates = { ...updates, is_revealed: true };
  } else if (action === 'next') {
    const next = currentIdx + 1;
    updates = {
      ...updates,
      current_case_index: next >= totalCases ? 99 : next,
      is_revealed: false,
    };
  } else if (action === 'reset') {
    updates = { ...updates, current_case_index: -1, is_revealed: false };
  }

  await supabase.from('live_settings').update(updates).eq('id', 1);

  return NextResponse.json({ success: true });
}
