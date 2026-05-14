'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Scale, Award, CheckCircle, Printer } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CertData {
  id: string;
  learner_id: string;
  quiz_score: number;
  case_score: number;
  total_score: number;
  passed: boolean;
  certificate_code: string;
  issued_at: string;
  nickname?: string;
}

export default function CertificatePage() {
  const { id } = useParams();
  const router = useRouter();
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: certificate } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', id)
        .single();

      if (!certificate) { setLoading(false); return; }

      const { data: learner } = await supabase
        .from('learners')
        .select('nickname')
        .eq('id', certificate.learner_id)
        .single();

      setCert({ ...certificate, nickname: learner?.nickname });
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F8FF' }}>
        <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cert || !cert.passed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">수료증을 찾을 수 없습니다.</p>
          <button onClick={() => router.push('/')} className="text-blue-600 underline text-sm">홈으로</button>
        </div>
      </div>
    );
  }

  const issuedDate = new Date(cert.issued_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#F5F8FF' }}>
      {/* Print Button */}
      <div className="mb-6 flex gap-3 no-print">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm"
          style={{ background: '#1E6FEB' }}
        >
          <Printer className="w-4 h-4" />
          인쇄 / PDF 저장
        </button>
        <button
          onClick={() => router.push('/results')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-gray-700 text-sm bg-white border border-gray-200"
        >
          결과로 돌아가기
        </button>
      </div>

      {/* Certificate */}
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-scaleIn"
        style={{ border: '6px solid #1E6FEB' }}
      >
        {/* Top Bar */}
        <div style={{ background: '#1E6FEB' }} className="py-3 px-4 sm:px-8 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-xs sm:text-sm leading-tight">Attorney-Client Privilege</p>
            <p className="text-white/60 text-xs leading-tight">Standard Operating Procedures for Korea</p>
          </div>
          <span className="text-white/60 text-xs">{cert.certificate_code}</span>
        </div>

        {/* Yellow Stripe */}
        <div style={{ background: 'linear-gradient(90deg, #FFB800, #FFD54F, #FFB800)', height: '5px' }} />

        {/* Content */}
        <div className="px-5 sm:px-10 py-8 sm:py-10 text-center">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFB800, #D49A00)' }}>
                <Award className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>

          <p className="text-gray-400 text-xs tracking-widest uppercase mb-2">Certificate of Completion</p>
          <h1 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: '#1E6FEB' }}>수료증</h1>
          <div style={{ width: '50px', height: '3px', background: '#FFB800', margin: '10px auto 20px' }} />

          <p className="text-gray-500 text-sm mb-2">이 수료증은 아래 학습자가</p>
          <p className="text-gray-700 text-sm mb-4">
            <strong>Attorney-Client Privilege (ACP)</strong> 직무교육을<br />
            성공적으로 이수하였음을 증명합니다.
          </p>

          <div className="my-5 py-3 px-4 sm:px-8 rounded-2xl" style={{ background: '#F5F8FF' }}>
            <p className="text-2xl sm:text-3xl font-black mb-1 break-all" style={{ color: '#1E6FEB' }}>{cert.nickname}</p>
            <p className="text-gray-400 text-sm">학습자</p>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
            {[
              { label: '퀴즈', value: cert.quiz_score },
              { label: '케이스', value: cert.case_score },
              { label: '최종', value: cert.total_score },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-xl sm:text-2xl font-black" style={{ color: '#FFB800' }}>{value}점</div>
                <div className="text-gray-400 text-xs">{label}</div>
              </div>
            ))}
          </div>

          <p className="text-gray-400 text-sm">{issuedDate} 발급</p>
        </div>

        {/* Bottom */}
        <div style={{ background: '#1E6FEB' }} className="py-3 px-4 sm:px-8 flex justify-between items-center">
          <p className="text-white/50 text-xs truncate">발급코드: {cert.certificate_code}</p>
          <p className="text-white/50 text-xs shrink-0 ml-2">ACP SOP Korea</p>
        </div>
      </div>
    </div>
  );
}
