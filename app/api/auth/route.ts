import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { code, name } = await request.json();

  if (!code) {
    return NextResponse.json({ error: '접속코드를 입력해주세요.' }, { status: 400 });
  }
  if (!name || !name.trim()) {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 });
  }

  const { data: accessCode } = await supabase
    .from('access_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('is_active', true)
    .single();

  if (!accessCode) {
    return NextResponse.json({ error: '유효하지 않은 접속코드입니다.' }, { status: 401 });
  }

  const nickname = name.trim();

  // 같은 이름+코드로 이미 접속한 경우 기존 ID 반환
  const { data: existing } = await supabase
    .from('learners')
    .select('*')
    .eq('nickname', nickname)
    .eq('access_code', code.trim().toUpperCase())
    .single();

  if (existing) {
    return NextResponse.json({ learner_id: existing.id, nickname: existing.nickname });
  }

  const { data: learner, error } = await supabase
    .from('learners')
    .insert({ nickname, access_code: code.trim().toUpperCase() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: '접속 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ learner_id: learner.id, nickname: learner.nickname });
}
