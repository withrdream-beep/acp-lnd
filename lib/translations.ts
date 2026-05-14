export const translations = {
  ko: {
    // 언어 선택
    langTitle: 'ACP 직무교육',
    langSubtitle: '언어를 선택해주세요',
    langKo: '한국어',
    langEn: 'English',

    // 로그인
    loginTitle: '직무교육 참여하기',
    loginSubtitle: '접속코드와 이름을 입력해주세요',
    accessCode: '접속코드',
    accessCodePlaceholder: '예: ACP2024',
    name: '이름',
    namePlaceholder: '본인 이름 입력',
    startBtn: '시작하기 →',
    checking: '확인 중...',
    invalidCode: '유효하지 않은 접속코드입니다.',
    serverError: '서버 연결 오류가 발생했습니다.',
    contactHelp: '접속코드가 없으신 경우 교육 담당자에게 문의해주세요',

    // 모드 선택
    welcomeMsg: (name: string) => `안녕하세요, ${name}님!`,
    selectTitle: '학습할 내용을 선택해주세요',
    caseStudy: '케이스 스터디',
    caseStudyDesc: '실무 시나리오를 보고 올바른 판단을 선택하세요',
    quiz: '퀴즈',
    quizDesc: 'OX 및 객관식 문제로 ACP 지식을 확인하세요',

    // 퀴즈
    quizStage: '퀴즈 단계',
    questionOf: (c: number, t: number) => `문제 ${c} / ${t}`,
    completedPct: (p: number) => `${p}% 완료`,
    oxType: 'O / X',
    multipleType: '객관식',
    diffEasy: '기본',
    diffMedium: '중급',
    diffHard: '심화',
    trueLabel: '맞다',
    falseLabel: '틀리다',
    correct: '정답입니다!',
    wrong: '오답입니다',
    nextQuestion: '다음 문제',
    toCaseStudy: '케이스 스터디로 이동',
    loadingQuestions: '문제를 불러오는 중...',

    // 케이스 스터디
    caseStage: '케이스 스터디',
    caseLabel: (n: number) => `케이스 ${n}`,
    waitingTitle: '잠시 기다려주세요',
    waitingDesc: '교육 담당자가 케이스 스터디를\n곧 시작할 예정입니다',
    submitted: '답변 제출 완료',
    waitingReveal: '정답 공개를 기다리는 중...',
    waitingNext: '다음 케이스를 기다리는 중...',
    groupCorrectRate: '전체 정답률',
    caseComplete: '케이스 스터디 완료!',
    caseCompleteDesc: '모든 케이스를 완료했습니다',
    viewResults: '결과 보기',
    selectAnswer: '선택지를 고르세요',
    loadingCases: '케이스를 불러오는 중...',

    // 결과
    trainingComplete: '교육 완료!',
    yourResults: (name: string) => `${name}님의 결과`,
    finalScore: '최종 점수',
    passedLabel: '합격 (70점 이상)',
    failedLabel: '불합격 (70점 미만)',
    scoreBreakdown: '세부 점수',
    quizLabel: '퀴즈',
    caseStudyLabel: '케이스 스터디',
    issueCert: '수료증 발급받기',
    issuingCert: '수료증 발급 중...',
    viewCert: '수료증 보기',
    goHome: '처음으로 돌아가기',
  },

  en: {
    // Language
    langTitle: 'ACP Training',
    langSubtitle: 'Select your language',
    langKo: '한국어',
    langEn: 'English',

    // Login
    loginTitle: 'Join the Training',
    loginSubtitle: 'Enter your access code and name',
    accessCode: 'Access Code',
    accessCodePlaceholder: 'e.g. ACP2024',
    name: 'Name',
    namePlaceholder: 'Enter your name',
    startBtn: 'Start →',
    checking: 'Verifying...',
    invalidCode: 'Invalid access code.',
    serverError: 'Server connection error. Please try again.',
    contactHelp: 'Contact the training coordinator if you do not have an access code',

    // Mode select
    welcomeMsg: (name: string) => `Welcome, ${name}!`,
    selectTitle: 'Select what to study',
    caseStudy: 'Case Study',
    caseStudyDesc: 'Review real workplace scenarios and choose the right decision',
    quiz: 'Quiz',
    quizDesc: 'Test your ACP knowledge with T/F and multiple choice questions',

    // Quiz
    quizStage: 'Quiz',
    questionOf: (c: number, t: number) => `Question ${c} / ${t}`,
    completedPct: (p: number) => `${p}% Complete`,
    oxType: 'True / False',
    multipleType: 'Multiple Choice',
    diffEasy: 'Basic',
    diffMedium: 'Intermediate',
    diffHard: 'Advanced',
    trueLabel: 'True',
    falseLabel: 'False',
    correct: 'Correct!',
    wrong: 'Incorrect',
    nextQuestion: 'Next Question',
    toCaseStudy: 'Go to Case Study',
    loadingQuestions: 'Loading questions...',

    // Case Study
    caseStage: 'Case Study',
    caseLabel: (n: number) => `Case ${n}`,
    waitingTitle: 'Please wait',
    waitingDesc: 'The trainer will start\nthe case study shortly',
    submitted: 'Answer Submitted',
    waitingReveal: 'Waiting for answer reveal...',
    waitingNext: 'Waiting for next case...',
    groupCorrectRate: 'Group Correct Rate',
    caseComplete: 'Case Study Complete!',
    caseCompleteDesc: 'All cases have been completed',
    viewResults: 'View Results',
    selectAnswer: 'Select an answer',
    loadingCases: 'Loading cases...',

    // Results
    trainingComplete: 'Training Complete!',
    yourResults: (name: string) => `${name}'s Results`,
    finalScore: 'Final Score',
    passedLabel: 'Passed (70 or above)',
    failedLabel: 'Failed (below 70)',
    scoreBreakdown: 'Score Breakdown',
    quizLabel: 'Quiz',
    caseStudyLabel: 'Case Study',
    issueCert: 'Get Certificate',
    issuingCert: 'Issuing...',
    viewCert: 'View Certificate',
    goHome: 'Back to Home',
  },
} as const;

export type Lang = keyof typeof translations;
export type T = (typeof translations)['ko'] | (typeof translations)['en'];
