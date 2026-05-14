'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Award, CheckCircle, XCircle, Download, RotateCcw } from 'lucide-react';
import { translations, Lang, T } from '@/lib/translations';

interface Results {
  quiz_score: number;
  case_score: number;
  total_score: number;
  quiz_correct: number;
  quiz_total: number;
  case_correct: number;
  case_total: number;
  passed: boolean;
  certificate: { id: string; certificate_code: string } | null;
}

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [learnerId, setLearnerId] = useState('');
  const [nickname, setNickname] = useState('');
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
    setLearnerId(id);
    setNickname(nick || '');
    setT(translations[lang] ?? translations.ko);
    loadResults(id);
  }, [router, loadResults]);

  async function issueCertificate() {
    setIssuing(true);
    const res = await fetch('/api/certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learner_id: learnerId }),
    });
    const data = await res.json();
    if (data.certificate) router.push(`/certificate/${data.certificate.id}`);
    setIssuing(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F8FF' }}>
        <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!results) return null;

  const scoreColor = results.total_score >= 90 ? '#22c55e' : results.total_score >= 70 ? '#3b82f6' : '#ef4444';

  return (
    <div className="min-h-screen" style={{ background: '#F5F8FF' }}>
      <div style={{ background: '#1E6FEB' }} className="px-4 py-10 text-center">
        <Award className="w-10 h-10 text-yellow-300 mx-auto mb-3" />
        <h1 className="text-white text-2xl font-bold">{t.trainingComplete}</h1>
        <p className="text-white/70 text-sm mt-1">{t.yourResults(nickname)}</p>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* 총점 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center animate-fadeIn">
          <p className="text-gray-500 text-sm mb-2">{t.finalScore}</p>
          <div className="relative inline-flex items-center justify-center w-32 h-32 mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor} strokeWidth="3"
                strokeDasharray={`${results.total_score} ${100 - results.total_score}`} strokeLinecap="round" />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-black" style={{ color: scoreColor }}>{results.total_score}</span>
              <span className="text-gray-400 text-xs block">점</span>
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold ${results.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {results.passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {results.passed ? t.passedLabel : t.failedLabel}
          </div>
        </div>

        {/* 세부 점수 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 animate-fadeIn">
          <h3 className="font-bold text-gray-800 mb-4">{t.scoreBreakdown}</h3>
          <div className="space-y-4">
            {[
              { label: t.quizLabel, score: results.quiz_score, correct: results.quiz_correct, total: results.quiz_total, color: '#1E6FEB' },
              { label: t.caseStudyLabel, score: results.case_score, correct: results.case_correct, total: results.case_total, color: '#FFB800' },
            ].map(({ label, score, correct, total, color }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="text-sm font-bold" style={{ color }}>{correct}/{total} ({score}점)</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="space-y-3 animate-fadeIn">
          {results.passed && !results.certificate && (
            <button onClick={issueCertificate} disabled={issuing}
              className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #FFB800, #D49A00)' }}>
              <Download className="w-5 h-5" />
              {issuing ? t.issuingCert : t.issueCert}
            </button>
          )}
          {results.certificate && (
            <button onClick={() => router.push(`/certificate/${results.certificate!.id}`)}
              className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #FFB800, #D49A00)' }}>
              <Award className="w-5 h-5" /> {t.viewCert}
            </button>
          )}
          <button onClick={() => { sessionStorage.clear(); router.push('/'); }}
            className="w-full py-3 rounded-xl font-medium text-gray-500 flex items-center justify-center gap-2 bg-white border border-gray-200">
            <RotateCcw className="w-4 h-4" /> {t.goHome}
          </button>
        </div>
      </div>
    </div>
  );
}
