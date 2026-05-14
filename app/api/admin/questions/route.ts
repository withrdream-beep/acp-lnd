import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function verifyAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('order_num', { ascending: true });

  if (error) return NextResponse.json({ error: '조회 실패' }, { status: 500 });

  return NextResponse.json({ questions: data });
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  const body = await request.json();
  const { type, question_text, options, correct_answer, explanation, difficulty, order_num } = body;

  const { data, error } = await supabase
    .from('questions')
    .insert({ type, question_text, options, correct_answer, explanation, difficulty, order_num: order_num ?? 0, is_active: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: '저장 실패' }, { status: 500 });

  return NextResponse.json({ question: data });
}

export async function PUT(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: '수정 실패' }, { status: 500 });

  return NextResponse.json({ question: data });
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });

  await supabase.from('questions').update({ is_active: false }).eq('id', id);

  return NextResponse.json({ success: true });
}
