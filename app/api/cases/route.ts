import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('case_studies')
    .select('*')
    .eq('is_active', true)
    .eq('is_ai_generated', false)
    .order('order_num', { ascending: true });

  if (error) {
    return NextResponse.json({ error: '케이스를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ cases: data });
}
