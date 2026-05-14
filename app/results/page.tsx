'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { translations, Lang, T } from '@/lib/translations';

interface Results {
  quiz_score: number;
  case_score: number;
  total_score: number;
  quiz_correct: number;
  quiz_total: number;
  case_correct: number;
  case_total: number;
}

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [lang, setLang] = useState<Lang>('ko');
  const [t, setT] = useState<T>(translations.ko);

  const loadResults = useCallback(async (id: string) => {
    const res = await fetch(`/api/results?learner_id=${id}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const id = sessionStorage.getItem('learner_id');
    const nick = sessionStorage.getItem('nickname');
    const lang = (sessionStorage.getItem('lang') || 'ko') as Lang;
    if (!id) { router.push('/'); return; }
    setNickname(nick || '');
    setLang(lang);
    setT(translations[lang] ?? translations.ko);
    loadResults(id);
  }, [router, loadResults]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F8FF' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1E6FEB', borderTopColor: 'transparent' }} />
      </div>
    );
  }
  if (!results) return null;

  return (
    <div className="min-h-screen" style={{ background: '#F5F8FF' }}>
      {/* 헤더 */}
      <div style={{ background: '#1E6FEB' }} className="px-4 py-10 text-center">
        <h1 className="text-white text-2xl font-bold">{t.trainingComplete}</h1>
        <p className="text-white/70 text-sm mt-1">{t.yourResults(nickname)}</p>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* 세부 점수 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 animate-fadeIn">
          <h3 className="font-bold text-gray-800 mb-5">{t.scoreBreakdown}</h3>
          <div className="space-y-5">
            {[
              { label: t.quizLabel, correct: results.quiz_correct, total: results.quiz_total, score: results.quiz_score, color: '#1E6FEB' },
              { label: t.caseStudyLabel, correct: results.case_correct, total: results.case_total, score: results.case_score, color: '#FFB800' },
            ].map(({ label, correct, total, score, color }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                  <span className="text-sm font-bold" style={{ color }}>
                    {correct}/{total} ({score}점)
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${score}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 첫 페이지로 버튼 (빨간색) */}
        <button
          onClick={() => router.push('/select')}
          className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 animate-fadeIn shadow-lg"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
        >
          <RotateCcw className="w-5 h-5" />
          {lang === 'en' ? 'Back to Home' : '첫 페이지로'}
        </button>
      </div>
    </div>
  );
}
