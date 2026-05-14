'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, ChevronRight, Brain } from 'lucide-react';
import { Question } from '@/types';
import { translations, Lang, T } from '@/lib/translations';

type AnswerState = {
  selected: string;
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
};

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answered, setAnswered] = useState<AnswerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [learnerId, setLearnerId] = useState('');
  const [nickname, setNickname] = useState('');
  const [lang, setLang] = useState<Lang>('ko');
  const [t, setT] = useState<T>(translations.ko);

  const loadQuestions = useCallback(async (l: string) => {
    const res = await fetch(`/api/questions?lang=${l}`);
    const data = await res.json();
    setQuestions(data.questions || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const id = sessionStorage.getItem('learner_id');
    const nick = sessionStorage.getItem('nickname');
    const l = (sessionStorage.getItem('lang') || 'ko') as Lang;
    if (!id) { router.push('/'); return; }
    setLearnerId(id);
    setNickname(nick || '');
    setLang(l);
    setT(translations[l] ?? translations.ko);
    loadQuestions(l);
  }, [router, loadQuestions]);

  async function handleAnswer(selected: string) {
    if (submitting || answered) return;
    setSubmitting(true);
    const q = questions[current];
    const res = await fetch('/api/questions/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learner_id: learnerId, question_id: q.id, selected_answer: selected, lang }),
    });
    const data = await res.json();
    setAnswered({ selected, is_correct: data.is_correct, correct_answer: data.correct_answer, explanation: data.explanation });
    setSubmitting(false);
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      router.push('/case-study');
    } else {
      setCurrent((p) => p + 1);
      setAnswered(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F8FF' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">{t.loadingQuestions}</p>
        </div>
      </div>
    );
  }

  if (!questions.length) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">등록된 문제가 없습니다.</p></div>;

  const q = questions[current];
  const progress = ((current + (answered ? 1 : 0)) / questions.length) * 100;
  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen" style={{ background: '#F5F8FF' }}>
      <div style={{ background: '#1E6FEB' }} className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-yellow-300" />
          <span className="text-white font-semibold text-sm">{t.quizStage}</span>
        </div>
        <span className="text-white/70 text-sm">{nickname}</span>
      </div>

      <div className="bg-white shadow-sm px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{t.questionOf(current + 1, questions.length)}</span>
            <span>{t.completedPct(Math.round(progress))}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #1E6FEB, #1454C4)' }} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn" key={q.id}>
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${q.type === 'ox' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {q.type === 'ox' ? t.oxType : t.multipleType}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {q.difficulty === 'easy' ? t.diffEasy : q.difficulty === 'hard' ? t.diffHard : t.diffMedium}
            </span>
          </div>
          <p className="text-gray-900 font-medium text-base leading-relaxed">{q.question_text}</p>
        </div>

        {q.type === 'ox' ? (
          <div className="grid grid-cols-2 gap-4">
            {(['O', 'X'] as const).map((opt) => {
              const isSelected = answered?.selected === opt;
              const isCorrect = answered?.correct_answer === opt;
              let bg = 'bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50';
              if (answered) {
                if (isCorrect) bg = 'bg-green-50 border-2 border-green-400';
                else if (isSelected) bg = 'bg-red-50 border-2 border-red-400';
                else bg = 'bg-white border-2 border-gray-100 opacity-60';
              }
              return (
                <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!answered || submitting}
                  className={`${bg} rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer disabled:cursor-default`}>
                  <span className={`text-5xl font-black ${opt === 'O' ? 'text-blue-600' : 'text-red-500'}`}>{opt}</span>
                  <span className="text-sm text-gray-500 mt-2">{opt === 'O' ? t.trueLabel : t.falseLabel}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {(q.options || []).map((opt, i) => {
              const label = optionLabels[i];
              const isSelected = answered?.selected === label;
              const isCorrect = answered?.correct_answer === label;
              let bg = 'bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-800';
              if (answered) {
                if (isCorrect) bg = 'bg-green-50 border-2 border-green-400 text-green-900';
                else if (isSelected) bg = 'bg-red-50 border-2 border-red-400 text-red-900';
                else bg = 'bg-white border-2 border-gray-100 text-gray-400 opacity-60';
              }
              return (
                <button key={label} onClick={() => handleAnswer(label)} disabled={!!answered || submitting}
                  className={`${bg} w-full text-left rounded-xl p-4 flex items-center gap-3 transition-all cursor-pointer disabled:cursor-default`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${answered ? isCorrect ? 'bg-green-500 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-600'}`}>
                    {answered && isCorrect ? '✓' : answered && isSelected ? '✗' : label}
                  </span>
                  <span className="text-sm leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {answered && (
          <div className="space-y-3 animate-fadeIn">
            <div className={`rounded-2xl p-4 ${answered.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {answered.is_correct ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                <span className={`font-bold text-sm ${answered.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                  {answered.is_correct ? t.correct : t.wrong}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{answered.explanation}</p>
            </div>
            <button onClick={handleNext} className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all" style={{ background: 'linear-gradient(135deg, #1E6FEB, #1454C4)' }}>
              {current + 1 >= questions.length ? t.toCaseStudy : t.nextQuestion}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {submitting && (
          <div className="text-center py-4">
            <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}
