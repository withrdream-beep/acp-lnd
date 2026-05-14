'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, BookOpen } from 'lucide-react';
import { translations, Lang, T } from '@/lib/translations';

const BLUE = '#1E6FEB';
const BLUE_DARK = '#1454C4';
const YELLOW = '#FFB800';

export default function SelectPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [t, setT] = useState<T>(translations.ko);

  useEffect(() => {
    const id = sessionStorage.getItem('learner_id');
    const nick = sessionStorage.getItem('nickname');
    const lang = (sessionStorage.getItem('lang') || 'ko') as Lang;
    if (!id) { router.push('/'); return; }
    setNickname(nick || '');
    setT(translations[lang] ?? translations.ko);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(150deg, ${BLUE} 0%, ${BLUE_DARK} 60%, #0D3BA8 100%)` }}>
      <div className="text-center px-4 pt-12 pb-6">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-5">
          <div className="w-2 h-2 rounded-full" style={{ background: YELLOW }} />
          <span className="text-white/80 text-xs font-medium tracking-wide">ACP Training Program</span>
        </div>
        <h1 className="text-white text-2xl font-black">Attorney-Client Privilege</h1>
        <p className="text-white/70 text-sm font-medium mt-1.5">Standard Operating Procedures for Korea</p>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <p className="text-white font-black text-xl">{t.welcomeMsg(nickname)}</p>
            <p className="text-white/60 text-sm mt-1">{t.selectTitle}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/case-study')}
              className="w-full bg-white rounded-2xl shadow-xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-all cursor-pointer"
            >
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

            <button
              onClick={() => router.push('/quiz')}
              className="w-full bg-white rounded-2xl shadow-xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-all cursor-pointer"
            >
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
        </div>
      </div>
    </div>
  );
}
