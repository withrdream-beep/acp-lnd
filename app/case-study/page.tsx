'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Users, AlertCircle, ChevronRight } from 'lucide-react';
import { CaseStudy } from '@/types';
import { translations, Lang, T } from '@/lib/translations';

interface LiveStatus {
  current_case_index: number;
  is_revealed: boolean;
  case: CaseStudy | null;
  learner_answered: boolean;
  learner_correct: boolean | null;
  group_correct_pct: number | null;
  total_cases: number;
}

export default function CaseStudyPage() {
  const router = useRouter();
  const [learnerId, setLearnerId] = useState('');
  const [lang, setLang] = useState<Lang>('ko');
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localAnswered, setLocalAnswered] = useState(false);
  const [localSelectedAnswer, setLocalSelectedAnswer] = useState<string | null>(null);
  const [readyForNext, setReadyForNext] = useState(false);
  const [displayedIndex, setDisplayedIndex] = useState<number>(-2);
  const [t, setT] = useState<T>(translations.ko);
  const prevCaseIdRef = useRef<string | null>(null);
  const langRef = useRef<string>('ko');

  const fetchStatus = useCallback(async (id: string) => {
    const res = await fetch(`/api/live/status?learner_id=${id}&lang=${langRef.current}`);
    const data: LiveStatus = await res.json();

    const newCaseId = data.case?.id ?? null;

    // 새 케이스가 시작되면: 아직 학습자가 "다음" 버튼을 누르지 않은 경우에만 자동 업데이트
    if (newCaseId !== prevCaseIdRef.current) {
      prevCaseIdRef.current = newCaseId;
      // 새 케이스로 전환 시 초기화
      setLocalAnswered(false);
      setLocalSelectedAnswer(null);
      setReadyForNext(false);
    }

    setStatus(data);
  }, []);

  useEffect(() => {
    const id = sessionStorage.getItem('learner_id');
    const l = (sessionStorage.getItem('lang') || 'ko') as Lang;
    if (!id) { router.push('/'); return; }
    setLearnerId(id);
    setLang(l);
    langRef.current = l;
    setT(translations[l] ?? translations.ko);
    fetchStatus(id);
    const interval = setInterval(() => fetchStatus(id), 3000);
    return () => clearInterval(interval);
  }, [router, fetchStatus]);

  // displayedIndex: 학습자가 보는 화면. 정답 공개 후 "다음" 누를 때까지 현재 케이스 유지
  useEffect(() => {
    if (!status) return;
    const idx = status.current_case_index;
    // 시작 전이거나 종료 시 즉시 반영
    if (idx === -1 || idx >= 99) {
      setDisplayedIndex(idx);
      return;
    }
    // 학습자가 readyForNext를 누르지 않았으면 현재 케이스 유지
    if (displayedIndex === -2) {
      setDisplayedIndex(idx); // 최초 진입
    }
  }, [status, displayedIndex]);

  function handleReadyForNext() {
    if (!status) return;
    setReadyForNext(false);
    setLocalAnswered(false);
    setDisplayedIndex(status.current_case_index); // 이미 다음으로 넘어간 인덱스로 이동
  }

  async function handleAnswer(selected: string) {
    if (!status?.case || submitting || localAnswered || status.learner_answered) return;
    setSubmitting(true);
    const res = await fetch('/api/cases/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learner_id: learnerId, case_id: status.case.id, selected_answer: selected, lang }),
    });
    if (res.ok) {
      setLocalAnswered(true);
      setLocalSelectedAnswer(selected);
      fetchStatus(learnerId);
    }
    setSubmitting(false);
  }

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F8FF' }}>
        <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const optionLabels = ['A', 'B', 'C', 'D'];
  const answered = localAnswered || status.learner_answered;
  const currentIdx = status.current_case_index;

  // 아직 시작 전
  if (currentIdx === -1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#F5F8FF' }}>
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center max-w-sm w-full animate-fadeIn">
          <Clock className="w-12 h-12 text-blue-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t.waitingTitle}</h2>
          <p className="text-gray-500 text-sm whitespace-pre-line">{t.waitingDesc}</p>
          <div className="flex justify-center gap-1 mt-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 교육 종료
  if (currentIdx >= 99 && displayedIndex >= 99) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#F5F8FF' }}>
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center max-w-sm w-full animate-fadeIn">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t.caseComplete}</h2>
          <p className="text-gray-500 text-sm mb-6">{t.caseCompleteDesc}</p>
          <button onClick={() => router.push('/results')} className="w-full py-3 rounded-xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #1E6FEB, #1454C4)' }}>
            {t.viewResults}
          </button>
        </div>
      </div>
    );
  }

  const cs = status.case;
  if (!cs) return null;

  // 정답 공개 후 학습자가 아직 "다음" 버튼을 안 눌렀는데 어드민이 다음 케이스로 넘어간 경우
  const adminMovedOn = currentIdx > displayedIndex && displayedIndex >= 0;
  const showNextPrompt = adminMovedOn && status.is_revealed === false; // 어드민이 다음으로 이동한 상태

  return (
    <div className="min-h-screen" style={{ background: '#F5F8FF' }}>
      <div style={{ background: '#1E6FEB' }} className="px-4 py-3 flex items-center justify-between">
        <span className="text-white font-semibold text-sm">{t.caseStage}</span>
        <span className="text-white/60 text-sm">{displayedIndex + 1} / {status.total_cases}</span>
      </div>

      <div className="h-1.5 bg-gray-200">
        <div className="h-full transition-all duration-500" style={{ width: `${((displayedIndex + 1) / status.total_cases) * 100}%`, background: 'linear-gradient(90deg, #FFB800, #FFD54F)' }} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* 시나리오 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-amber-800 font-semibold text-sm">{t.caseLabel(displayedIndex + 1)}</span>
          </div>
          <div className="p-5">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{cs.scenario_text}</p>
          </div>
        </div>

        {/* 질문 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-gray-900 font-semibold text-base">{cs.question}</p>
        </div>

        {/* 선택지 */}
        <div className="space-y-3">
          {cs.options.map((opt, i) => {
            const label = optionLabels[i];
            const isMyChoice = localSelectedAnswer === label;
            const isCorrect = status.is_revealed && cs.correct_answer.toUpperCase() === label;
            const isMyWrong = status.is_revealed && isMyChoice && !isCorrect;

            let bg = 'bg-white border-2 border-gray-200 text-gray-800';
            let badgeBg = 'bg-amber-100 text-amber-700';
            let badgeContent: React.ReactNode = label;

            if (!answered && !status.is_revealed) {
              // 아직 답변 전
              bg += ' hover:border-yellow-400 hover:bg-yellow-50 cursor-pointer';
            } else if (answered && !status.is_revealed) {
              // 답변 후 공개 전 — 내가 선택한 것만 파란색으로 강조
              if (isMyChoice) {
                bg = 'bg-blue-50 border-2 border-blue-400 text-blue-900';
                badgeBg = 'bg-blue-500 text-white';
                badgeContent = '✓';
              } else {
                bg = 'bg-white border-2 border-gray-100 text-gray-400 opacity-50';
                badgeBg = 'bg-gray-200 text-gray-400';
              }
            } else if (status.is_revealed) {
              // 정답 공개 후
              if (isCorrect) {
                bg = 'bg-green-50 border-2 border-green-400 text-green-900';
                badgeBg = 'bg-green-500 text-white';
                badgeContent = '✓';
              } else if (isMyWrong) {
                bg = 'bg-red-50 border-2 border-red-300 text-red-800';
                badgeBg = 'bg-red-400 text-white';
                badgeContent = '✗';
              } else {
                bg = 'bg-white border-2 border-gray-100 text-gray-400 opacity-50';
                badgeBg = 'bg-gray-200 text-gray-400';
              }
            }

            return (
              <button key={label} onClick={() => handleAnswer(label)}
                disabled={answered || submitting || status.is_revealed}
                className={`${bg} w-full text-left rounded-xl p-4 flex items-start gap-3 transition-all duration-200 disabled:cursor-default`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${badgeBg}`}>
                  {badgeContent}
                </span>
                <span className="text-sm leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* 상태 메시지 */}
        {!answered && !status.is_revealed && (
          <div className="text-center py-2 text-gray-400 text-sm">{t.selectAnswer}</div>
        )}

        {answered && !status.is_revealed && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center animate-fadeIn">
            <div className="flex justify-center gap-1 mb-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <p className="text-blue-700 font-medium text-sm">{t.submitted}</p>
            <p className="text-blue-500 text-xs mt-1">{t.waitingReveal}</p>
          </div>
        )}

        {/* 정답 공개 후 결과 + 다음 버튼 */}
        {status.is_revealed && (
          <div className="space-y-3 animate-fadeIn">
            {answered ? (
              <div className={`rounded-2xl p-4 ${status.learner_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {status.learner_correct ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                  <span className={`font-bold text-sm ${status.learner_correct ? 'text-green-700' : 'text-red-700'}`}>
                    {status.learner_correct ? t.correct : t.wrong}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{cs.explanation}</p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <p className="text-sm text-gray-600 leading-relaxed">{cs.explanation}</p>
              </div>
            )}

            {status.group_correct_pct !== null && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-gray-700">{t.groupCorrectRate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${status.group_correct_pct}%`, background: status.group_correct_pct >= 70 ? '#22c55e' : '#f59e0b' }} />
                  </div>
                  <span className="text-2xl font-black" style={{ color: status.group_correct_pct >= 70 ? '#16a34a' : '#d97706' }}>
                    {status.group_correct_pct}%
                  </span>
                </div>
              </div>
            )}

            {/* 다음 케이스 / 결과 버튼 */}
            {currentIdx > displayedIndex ? (
              <button
                onClick={() => currentIdx >= 99 ? router.push('/results') : handleReadyForNext()}
                className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 animate-fadeIn"
                style={{ background: currentIdx >= 99
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #FFB800, #D49A00)'
                }}
              >
                {currentIdx >= 99 ? (lang === 'en' ? 'View My Results' : '내 결과 보기') : `다음 케이스`}
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="text-center py-2 text-gray-400 text-sm">{t.waitingNext}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
