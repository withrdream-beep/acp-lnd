'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, BookOpen } from 'lucide-react';
import { translations, Lang } from '@/lib/translations';

type Step = 'lang' | 'login' | 'select';

const BLUE = '#1E6FEB';
const BLUE_DARK = '#1454C4';
const YELLOW = '#FFB800';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('lang');
  const [lang, setLang] = useState<Lang>('ko');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = translations[lang];

  function selectLang(l: Lang) {
    setLang(l);
    sessionStorage.setItem('lang', l);
    setStep('login');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.invalidCode); return; }
      sessionStorage.setItem('learner_id', data.learner_id);
      sessionStorage.setItem('nickname', data.nickname);
      setNickname(data.nickname);
      setStep('select');
    } catch {
      setError(t.serverError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(150deg, ${BLUE} 0%, ${BLUE_DARK} 60%, #0D3BA8 100%)` }}>

      {/* 중앙 타이틀 */}
      <div className="text-center px-4 pt-12 pb-6">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-5">
          <div className="w-2 h-2 rounded-full" style={{ background: YELLOW }} />
          <span className="text-white/80 text-xs font-medium tracking-wide">ACP Training Program</span>
        </div>
        <h1 className="text-white text-2xl font-black leading-tight">
          Attorney-Client Privilege
        </h1>
        <p className="text-white/70 text-sm font-medium mt-1.5">
          Standard Operating Procedures for Korea
        </p>
      </div>

      {/* 카드 영역 */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-md">

          {/* STEP 1: 언어 선택 */}
          {step === 'lang' && (
            <div className="animate-fadeIn space-y-3">
              <p className="text-center text-white/70 text-sm mb-4">언어를 선택해주세요 · Select your language</p>
              {([
                { l: 'ko' as Lang, primary: '한국어', secondary: 'Korean', char: '가' },
                { l: 'en' as Lang, primary: 'English', secondary: '영어', char: 'A' },
              ]).map(({ l, primary, secondary, char }) => (
                <button key={l} onClick={() => selectLang(l)}
                  className="w-full bg-white rounded-2xl shadow-xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-all duration-200 cursor-pointer">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black shrink-0"
                    style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`, color: 'white' }}>
                    {char}
                  </div>
                  <div className="text-left">
                    <p className="font-black text-gray-900 text-lg leading-tight">{primary}</p>
                    <p className="text-gray-400 text-sm">{secondary}</p>
                  </div>
                  <span className="ml-auto text-gray-300 text-2xl font-light">›</span>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2: 로그인 */}
          {step === 'login' && (
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
              <div className="px-6 py-5" style={{ background: `linear-gradient(135deg, ${YELLOW}, #FFCA28)` }}>
                <h2 className="text-gray-900 font-black text-lg">{t.loginTitle}</h2>
                <p className="text-gray-700 text-sm mt-0.5">{t.loginSubtitle}</p>
              </div>

              <form onSubmit={handleLogin} className="px-6 py-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">{t.accessCode}</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder=""
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 font-mono text-center text-lg tracking-widest uppercase focus:outline-none transition-colors"
                    style={{ '--tw-ring-color': BLUE } as React.CSSProperties}
                    onFocus={e => e.target.style.borderColor = BLUE}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    required autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">{t.name}</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none transition-colors"
                    onFocus={e => e.target.style.borderColor = BLUE}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    maxLength={20} required />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm animate-fadeIn">{error}</div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-black text-white text-base disabled:opacity-60 cursor-pointer transition-all"
                  style={{ background: loading ? '#9ca3af' : `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})` }}>
                  {loading ? t.checking : t.startBtn}
                </button>
                <button type="button" onClick={() => setStep('lang')}
                  className="w-full text-center text-sm pt-1" style={{ color: BLUE }}>
                  ← {lang === 'ko' ? '언어 선택으로 돌아가기' : 'Back to language selection'}
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: 모드 선택 */}
          {step === 'select' && (
            <div className="animate-fadeIn space-y-3">
              <div className="text-center mb-6">
                <p className="text-white font-black text-xl">{t.welcomeMsg(nickname)}</p>
                <p className="text-white/60 text-sm mt-1">{t.selectTitle}</p>
              </div>

              <button onClick={() => router.push('/case-study')}
                className="w-full bg-white rounded-2xl shadow-xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-all cursor-pointer">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${YELLOW}, #FFCA28)` }}>
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-lg">{t.caseStudy}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{t.caseStudyDesc}</p>
                </div>
                <span className="ml-auto text-gray-300 text-2xl font-light">›</span>
              </button>

              <button onClick={() => router.push('/quiz')}
                className="w-full bg-white rounded-2xl shadow-xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-all cursor-pointer">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})` }}>
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-lg">{t.quiz}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{t.quizDesc}</p>
                </div>
                <span className="ml-auto text-gray-300 text-2xl font-light">›</span>
              </button>
            </div>
          )}

          <p className="text-center text-white/40 text-xs mt-5">{t.contactHelp}</p>
        </div>
      </div>
    </div>
  );
}
