import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function verifyAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  const [{ data: learners }, { data: certificates }, { data: quizAttempts }, { data: caseAttempts }] =
    await Promise.all([
      supabase.from('learners').select('*').order('created_at', { ascending: false }),
      supabase.from('certificates').select('*'),
      supabase.from('quiz_attempts').select('learner_id, is_correct'),
      supabase.from('case_attempts').select('learner_id, is_correct'),
    ]);

  const rows = (learners ?? []).map((learner) => {
    const cert = (certificates ?? []).find((c) => c.learner_id === learner.id);
    const lQuiz = (quizAttempts ?? []).filter((a) => a.learner_id === learner.id);
    const lCase = (caseAttempts ?? []).filter((a) => a.learner_id === learner.id);

    return {
      닉네임: learner.nickname,
      접속코드: learner.access_code,
      퀴즈점수: cert?.quiz_score ?? (lQuiz.length > 0 ? Math.round((lQuiz.filter((a) => a.is_correct).length / lQuiz.length) * 100) : '-'),
      케이스점수: cert?.case_score ?? (lCase.length > 0 ? Math.round((lCase.filter((a) => a.is_correct).length / lCase.length) * 100) : '-'),
      총점: cert?.total_score ?? '-',
      합격여부: cert ? (cert.passed ? '합격' : '불합격') : '미완료',
      수료증코드: cert?.certificate_code ?? '-',
      퀴즈응답수: lQuiz.length,
      케이스응답수: lCase.length,
      접속일시: new Date(learner.created_at).toLocaleString('ko-KR'),
    };
  });

  const headers = Object.keys(rows[0] ?? {});
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h as keyof typeof row] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const bom = '﻿';
  return new NextResponse(bom + csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="acp_results_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
