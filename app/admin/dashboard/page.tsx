'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Award, TrendingUp, Target, Download, Trophy, Medal,
  Star, BarChart3, LogOut, RefreshCw, Play, ChevronRight,
  RotateCcw, Eye, CheckCircle
} from 'lucide-react';
import { CaseStudy } from '@/types';

interface Stats {
  total_learners: number;
  completed_learners: number;
  avg_quiz_score: number;
  avg_case_score: number;
  avg_total_score: number;
  pass_rate: number;
}

interface LeaderboardEntry {
  learner_id: string;
  nickname: string;
  quiz_rate: number | null;
  case_rate: number | null;
  combined_rate: number;
  rank: number;
}

interface LiveCase extends CaseStudy {
  scenario_text_en?: string;
  question_en?: string;
  options_en?: string[];
  explanation_en?: string;
}

interface LiveData {
  settings: { current_case_index: number; is_revealed: boolean };
  cases: LiveCase[];
  current_case: LiveCase | null;
  distribution: Record<string, { count: number; pct: number }>;
  total_answered: number;
  correct_count: number;
  correct_pct: number;
}

type Tab = 'overview' | 'live' | 'leaderboard';

// 한/영 병기 텍스트 컴포넌트
function Bi({ ko, en, className = '' }: { ko: string; en: string; className?: string }) {
  return (
    <span className={className}>
      {ko} <span className="opacity-50">/ {en}</span>
    </span>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('live');
  const [stats, setStats] = useState<Stats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminPw, setAdminPw] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStats = useCallback(async (pw: string) => {
    const res = await fetch('/api/admin/stats', { headers: { 'x-admin-password': pw } });
    if (res.status === 401) { router.push('/admin'); return; }
    const data = await res.json();
    setStats(data.stats);
    setLeaderboard(data.leaderboard || []);
    setLoading(false);
  }, [router]);

  const loadLive = useCallback(async (pw: string) => {
    const res = await fetch('/api/admin/live', { headers: { 'x-admin-password': pw } });
    if (res.ok) setLiveData(await res.json());
  }, []);

  useEffect(() => {
    const pw = sessionStorage.getItem('admin_password');
    if (!pw) { router.push('/admin'); return; }
    setAdminPw(pw);
    loadStats(pw);
    loadLive(pw);
  }, [router, loadStats, loadLive]);

  useEffect(() => {
    if (!adminPw) return;
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);

    if (tab === 'live') {
      liveIntervalRef.current = setInterval(() => loadLive(adminPw), 3000);
    } else if (tab === 'leaderboard') {
      liveIntervalRef.current = setInterval(() => loadStats(adminPw), 5000);
    }

    return () => { if (liveIntervalRef.current) clearInterval(liveIntervalRef.current); };
  }, [tab, adminPw, loadLive, loadStats]);

  async function liveControl(action: string) {
    await fetch('/api/admin/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPw },
      body: JSON.stringify({ action }),
    });
    loadLive(adminPw);
  }

  async function handleReset() {
    setResetting(true);
    await fetch('/api/admin/reset', {
      method: 'POST',
      headers: { 'x-admin-password': adminPw },
    });
    setShowResetConfirm(false);
    setResetting(false);
    await Promise.all([loadStats(adminPw), loadLive(adminPw)]);
  }

  function handleExport() {
    const req = new XMLHttpRequest();
    req.open('GET', '/api/admin/export', true);
    req.setRequestHeader('x-admin-password', adminPw);
    req.responseType = 'blob';
    req.onload = () => {
      const url = URL.createObjectURL(req.response);
      const link = document.createElement('a');
      link.href = url;
      link.download = `acp_results_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    };
    req.send();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F8FF' }}>
        <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { key: Tab; label: React.ReactNode }[] = [
    { key: 'live',        label: <Bi ko="문항 분석" en="Case Analysis" /> },
    { key: 'overview',    label: <Bi ko="전체 현황" en="Overview" /> },
    { key: 'leaderboard', label: <Bi ko="Top 3 어워드" en="Top 3 Award" /> },
  ];

  const live = liveData;
  const currentIdx = live?.settings?.current_case_index ?? -1;
  const isRevealed = live?.settings?.is_revealed ?? false;
  const totalCases = live?.cases?.length ?? 0;
  const notStarted = currentIdx === -1;
  const isFinished = currentIdx >= 99;
  const isActive = !notStarted && !isFinished;
  const optionLabels = ['A', 'B', 'C', 'D'];
  const optionColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
  const cs = live?.current_case;

  return (
    <div className="min-h-screen" style={{ background: '#F5F8FF' }}>

      {/* 초기화 확인 모달 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-black text-gray-900 text-lg text-center mb-1">
              <Bi ko="초기화 확인" en="Confirm Reset" />
            </h3>
            <p className="text-gray-500 text-sm text-center mb-1">
              모든 학습자 데이터를 삭제하고 교육을 처음 상태로 초기화합니다.
            </p>
            <p className="text-gray-400 text-xs text-center italic mb-4">
              All learner data will be deleted and the session will be reset.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-5 text-center">
              <p className="text-red-600 text-sm font-bold">이 작업은 되돌릴 수 없습니다</p>
              <p className="text-red-400 text-xs italic">This action cannot be undone</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                취소 / Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                style={{ background: resetting ? '#9ca3af' : '#ef4444' }}
              >
                {resetting ? '삭제 중...' : '네, 삭제합니다'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#1E6FEB' }} className="px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg">
            <Bi ko="ACP 교육 관리자" en="ACP Training Admin" />
          </h1>
          <p className="text-white/60 text-xs">ACP Standard Operating Procedures for Korea</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { loadStats(adminPw); loadLive(adminPw); }} className="p-2 text-white/60 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => { sessionStorage.removeItem('admin_password'); router.push('/admin'); }}
            className="flex items-center gap-1.5 px-3 py-2 text-white/70 hover:text-white text-sm">
            <LogOut className="w-4 h-4" />
            <Bi ko="로그아웃" en="Logout" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-4xl mx-auto flex overflow-x-auto">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === key ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {key === 'live' && <BarChart3 className="w-4 h-4" />}
              {key === 'overview' && <Target className="w-4 h-4" />}
              {key === 'leaderboard' && <Trophy className="w-4 h-4" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── 문항 분석 / Case Analysis ── */}
        {tab === 'live' && (
          <div className="space-y-4 animate-fadeIn">

            {/* 상태 헤더 */}
            <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
                <div>
                  <p className="font-bold text-gray-800">
                    {notStarted && <Bi ko="교육 시작 전" en="Not Started" />}
                    {isFinished && <Bi ko="교육 종료" en="Session Ended" />}
                    {isActive && <Bi ko={`케이스 ${currentIdx + 1} / ${totalCases} 진행 중`} en={`Case ${currentIdx + 1} / ${totalCases} In Progress`} />}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {notStarted && '아래 버튼으로 교육을 시작하세요 · Press Start to begin'}
                    {isFinished && '모든 케이스가 완료되었습니다 · All cases completed'}
                    {isActive && !isRevealed && '학습자들이 답변 중입니다 · Learners are answering'}
                    {isActive && isRevealed && '정답 공개됨 — 다음 케이스로 이동하세요 · Answer revealed — proceed to next case'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {notStarted && (
                  <button onClick={() => liveControl('start')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm"
                    style={{ background: 'linear-gradient(135deg, #1E6FEB, #1454C4)' }}>
                    <Play className="w-4 h-4" />
                    <Bi ko="교육 시작" en="Start" />
                  </button>
                )}
                {(notStarted || isActive || isFinished) && (
                  <button onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-red-500 text-sm bg-red-50 hover:bg-red-100 border border-red-200">
                    <RotateCcw className="w-4 h-4" />
                    <Bi ko="초기화" en="Reset" />
                  </button>
                )}
              </div>
            </div>

            {/* 현재 케이스 카드 */}
            {isActive && cs && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

                {/* 케이스 헤더 */}
                <div className="bg-amber-50 border-b border-amber-100 px-5 py-3">
                  <p className="text-amber-800 font-semibold text-sm">
                    <Bi ko={`케이스 ${currentIdx + 1} 시나리오`} en={`Case ${currentIdx + 1} Scenario`} />
                  </p>
                </div>

                {/* 시나리오 — 한/영 병기 */}
                <div className="p-5 border-b border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="pr-4 border-r border-gray-100">
                      <p className="text-xs font-bold text-blue-700 mb-1.5">한국어</p>
                      <p className="text-gray-700 text-sm leading-relaxed">{cs.scenario_text}</p>
                      <p className="text-gray-900 font-semibold text-sm mt-3">{cs.question}</p>
                    </div>
                    <div className="pl-4">
                      <p className="text-xs font-bold text-green-700 mb-1.5">English</p>
                      <p className="text-gray-600 text-sm leading-relaxed">{cs.scenario_text_en || cs.scenario_text}</p>
                      <p className="text-gray-800 font-semibold text-sm mt-3">{cs.question_en || cs.question}</p>
                    </div>
                  </div>
                </div>

                {/* 응답 현황 — 선택지 항상 표시, 응답률·정답은 공개 후에만 */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-gray-700 text-sm">
                      <Bi ko="응답 현황" en="Response Status" />
                    </p>
                    <div className="flex items-center gap-2">
                      {!isRevealed && (
                        <div className="flex gap-1">
                          {[0,1,2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                          ))}
                        </div>
                      )}
                      <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                        {live.total_answered} <Bi ko="명 응답" en="responded" />
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(cs.options || []).map((opt, i) => {
                      const enOpt = cs.options_en?.[i] || opt;
                      const label = optionLabels[i];
                      const stat = live.distribution[label] ?? { count: 0, pct: 0 };
                      const isCorrect = isRevealed && cs.correct_answer.toUpperCase() === label;

                      return (
                        <div key={label} className={`rounded-xl p-3 border transition-all duration-300 ${
                          isRevealed
                            ? isCorrect ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-100'
                            : 'bg-white border-gray-200'
                        }`}>
                          <div className="flex items-start gap-3">
                            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white transition-all duration-300"
                              style={{ backgroundColor: isRevealed ? isCorrect ? '#22c55e' : '#d1d5db' : optionColors[i] }}>
                              {isRevealed && isCorrect ? '✓' : label}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium leading-snug ${isRevealed && isCorrect ? 'text-green-800' : 'text-gray-700'}`}>{opt}</p>
                              <p className="text-xs text-gray-400 leading-snug mt-0.5 italic">{enOpt}</p>
                              {/* 응답률 바 — 공개 후에만 표시 */}
                              {isRevealed && (
                                <div className="mt-2">
                                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700"
                                      style={{ width: `${stat.pct}%`, backgroundColor: isCorrect ? '#22c55e' : '#d1d5db' }} />
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* 응답률 수치 — 공개 후에만 표시 */}
                            {isRevealed && (
                              <div className="text-right shrink-0 ml-2 animate-fadeIn">
                                <span className={`text-lg font-black ${isCorrect ? 'text-green-600' : 'text-gray-400'}`}>
                                  {stat.pct}%
                                </span>
                                <span className="text-xs text-gray-400 block">{stat.count}명</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 전체 정답률 (공개 후) */}
                {isRevealed && live.total_answered > 0 && (
                  <div className="px-5 py-4 bg-green-50 border-b border-green-100 flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-bold text-green-800">
                        <Bi ko="전체 정답률" en="Overall Correct Rate" />
                      </span>
                    </div>
                    <span className="text-2xl font-black text-green-700">{live.correct_pct}%</span>
                  </div>
                )}

                {/* 컨트롤 버튼 */}
                <div className="p-4 flex gap-3">
                  {!isRevealed && (
                    <button onClick={() => liveControl('reveal')}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm"
                      style={{ background: 'linear-gradient(135deg, #FFB800, #D49A00)' }}>
                      <Eye className="w-4 h-4" />
                      <Bi ko="정답 공개" en="Reveal Answer" />
                    </button>
                  )}
                  {isRevealed && (
                    <button onClick={() => liveControl('next')}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm"
                      style={{ background: 'linear-gradient(135deg, #1E6FEB, #1454C4)' }}>
                      {currentIdx + 1 >= totalCases
                        ? <Bi ko="교육 종료" en="End Session" />
                        : <Bi ko={`케이스 ${currentIdx + 2}로 이동`} en={`Go to Case ${currentIdx + 2}`} />
                      }
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 케이스 목록 */}
            {live && live.cases.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <p className="font-bold text-gray-700 text-sm">
                    <Bi ko="케이스 목록" en="Case List" />
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {live.cases.map((c, i) => (
                    <div key={c.id} className={`px-5 py-3.5 flex items-start gap-3 ${i === currentIdx && isActive ? 'bg-blue-50' : ''}`}>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        i < currentIdx ? 'bg-green-100 text-green-700' :
                        i === currentIdx && isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {i < currentIdx ? '✓' : i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 line-clamp-1">{c.scenario_text.slice(0, 50)}...</p>
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5 italic">{(c.scenario_text_en || '').slice(0, 50)}...</p>
                      </div>
                      {i === currentIdx && isActive && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium shrink-0 mt-1">
                          <Bi ko="진행 중" en="Live" />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 전체 현황 / Overview ── */}
        {tab === 'overview' && stats && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { ko: '총 학습자', en: 'Total Learners', value: stats.total_learners, unit: '명', icon: Users, color: '#1E6FEB' },
                { ko: '교육 완료', en: 'Completed', value: stats.completed_learners, unit: '명', icon: Award, color: '#22c55e' },
                { ko: '합격률', en: 'Pass Rate', value: stats.pass_rate, unit: '%', icon: TrendingUp, color: '#FFB800' },
                { ko: '평균 퀴즈', en: 'Avg Quiz', value: stats.avg_quiz_score, unit: '점', icon: Target, color: '#3b82f6' },
                { ko: '평균 케이스', en: 'Avg Case', value: stats.avg_case_score, unit: '점', icon: Target, color: '#8b5cf6' },
                { ko: '평균 총점', en: 'Avg Total', value: stats.avg_total_score, unit: '점', icon: Star, color: '#ef4444' },
              ].map(({ ko, en, value, unit, icon: Icon, color }) => (
                <div key={ko} className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-gray-700 text-xs font-semibold">{ko}</p>
                      <p className="text-gray-400 text-xs">{en}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + '20' }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                  </div>
                  <p className="text-3xl font-black" style={{ color }}>
                    {value}<span className="text-base font-medium text-gray-400 ml-1">{unit}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={handleExport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm"
                style={{ background: '#1E6FEB' }}>
                <Download className="w-4 h-4" />
                <Bi ko="전체 결과 CSV 다운로드" en="Export CSV" />
              </button>
            </div>
          </div>
        )}

        {/* ── Top 3 어워드 / Top 3 Award ── */}
        {tab === 'leaderboard' && (() => {
          const rank1 = leaderboard.filter(e => e.rank === 1);
          const rank2 = leaderboard.filter(e => e.rank === 2);
          const rank3 = leaderboard.filter(e => e.rank === 3);

          // 시상대 설정: [0]=1위, [1]=2위, [2]=3위
          const podiumConfig = [
            { blockH: 130, bg: 'linear-gradient(135deg, #1E6FEB, #1454C4)', medalBg: '#FFB800', icon: Trophy, scoreColor: '#FFD700', nameColor: '#fff', labelColor: 'rgba(255,255,255,0.7)', koLabel: '1위', enLabel: '1st' },
            { blockH: 85,  bg: 'linear-gradient(135deg, #9ca3af, #6b7280)', medalBg: '#C0C0C0', icon: Medal,  scoreColor: '#fff',    nameColor: '#fff', labelColor: 'rgba(255,255,255,0.7)', koLabel: '2위', enLabel: '2nd' },
            { blockH: 55,  bg: 'linear-gradient(135deg, #d97706, #b45309)', medalBg: '#CD7F32', icon: Medal,  scoreColor: '#fff',    nameColor: '#fff', labelColor: 'rgba(255,255,255,0.7)', koLabel: '3위', enLabel: '3rd' },
          ];

          // 이름+점수는 시상대 블록 위, 블록 자체는 고정 높이로 시상대 표현
          const PodiumCol = ({ entries, cfgIdx }: { entries: LeaderboardEntry[]; cfgIdx: number }) => {
            if (!entries.length) return <div className="flex-1" />;
            const c = podiumConfig[cfgIdx];
            const I = c.icon;
            return (
              <div className="flex-1 flex flex-col items-center">
                {/* 시상대 위: 메달 + 이름 + 점수 */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: c.medalBg }}>
                  <I className="w-5 h-5 text-white" />
                </div>
                <div className="text-center mb-2 px-1">
                  {entries.map(e => (
                    <p key={e.learner_id} className="font-black text-gray-800 text-sm leading-tight">{e.nickname}</p>
                  ))}
                  <p className="font-black text-base mt-0.5" style={{ color: '#1E6FEB' }}>{entries[0].combined_rate}%</p>
                </div>
                {/* 시상대 블록: 고정 높이 */}
                <div
                  className="w-full rounded-t-xl flex items-center justify-center"
                  style={{ background: c.bg, height: `${c.blockH}px` }}
                >
                  <p className="text-xs font-bold" style={{ color: c.labelColor }}>{c.koLabel} / {c.enLabel}</p>
                </div>
              </div>
            );
          };

          return (
            <div className="animate-fadeIn space-y-6">
              {leaderboard.length > 0 ? (
                <>
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-center font-bold text-gray-800 text-lg mb-1 flex items-center justify-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <Bi ko="Top 3 우수 학습자" en="Top 3 Outstanding Learners" />
                    </h2>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <p className="text-xs text-green-600 font-medium">
                        <Bi ko="실시간 업데이트" en="Live Updates" />
                      </p>
                    </div>
                    <p className="text-center text-xs text-gray-400 mb-6">
                      완료한 항목 기준 정답률 / Correct rate based on completed activities · 동점자 모두 포함 / Ties included
                    </p>
                    {/* items-end 로 시상대 블록 바닥을 맞춤 */}
                    <div className="flex items-end justify-center gap-2">
                      <PodiumCol entries={rank2} cfgIdx={1} />
                      <PodiumCol entries={rank1} cfgIdx={0} />
                      <PodiumCol entries={rank3} cfgIdx={2} />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100">
                      <p className="font-bold text-gray-700 text-sm">
                        <Bi ko="전체 순위" en="Full Rankings" />
                      </p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {leaderboard.map(e => (
                        <div key={e.learner_id} className="px-5 py-3 flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            e.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                            e.rank === 2 ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'
                          }`}>{e.rank}</span>
                          <span className="flex-1 font-semibold text-gray-800 text-sm">{e.nickname}</span>
                          <div className="text-right text-xs text-gray-400">
                            <span>퀴즈/Quiz {e.quiz_rate ?? '-'}%</span>
                            <span className="mx-1">·</span>
                            <span>케이스/Case {e.case_rate ?? '-'}%</span>
                          </div>
                          <span className="font-black text-base ml-2" style={{ color: '#1E6FEB' }}>{e.combined_rate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  아직 응답한 학습자가 없습니다. / No responses yet.
                </div>
              )}
            </div>
          );
        })()}

      </div>
    </div>
  );
}
