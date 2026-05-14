import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'AI 기능이 비활성화되어 있습니다.' }, { status: 410 });
}
