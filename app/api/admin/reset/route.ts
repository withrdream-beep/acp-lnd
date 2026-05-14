import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function verifyAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  // learners 삭제 시 CASCADE로 quiz_attempts, case_attempts, certificates 자동 삭제
  await supabase.from('learners').delete().not('id', 'is', null);

  // 라이브 세션 초기화
  await supabase
    .from('live_settings')
    .update({ current_case_index: -1, is_revealed: false, updated_at: new Date().toISOString() })
    .eq('id', 1);

  return NextResponse.json({ success: true });
}
