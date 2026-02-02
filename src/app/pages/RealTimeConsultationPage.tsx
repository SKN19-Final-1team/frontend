import MainLayout from '../components/layout/MainLayout';
import { Phone, PhoneOff, Save, Send, Lightbulb, Copy, Bot, User, ChevronLeft, ChevronRight, X, FileText, HelpCircle, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import { scenarios, getScenarioByCategory, type Scenario, type ScenarioCard } from '../../data/scenarios';
import { generateConsultationId } from '@/utils/consultationId';
import { generateCustomerGuide, getCustomerTraitSummary, getTraitColor, getTraitIcon } from '@/utils/customerTraitGuide';
import { maskName, maskPhone, maskCardNumber } from '@/utils/mask';
import { InlineMaskedText } from '@/app/components/ui/MaskedText';
import { ProductAttributesGrid } from '@/app/components/cards/ProductAttributesGrid';
import { toast } from 'sonner';
import { USE_CUSTOMER_MASKING } from '@/config/mockConfig';
import { formatBirthDateWithAge } from '@/utils/age';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { convertToMarkdown } from '@/utils/textFormatter';
import { TutorialGuide, type TutorialStep } from '@/app/components/tutorial/TutorialGuide';
import { tutorialStepsPhase1, tutorialStepsPhase2 } from '@/data/tutorialSteps';
import { InfoCard } from '@/app/components/consultation/InfoCard';
import { addTimestampToCard } from '@/utils/timeFormatter';
import { SearchHistoryDropdown } from '@/app/components/consultation/SearchHistoryDropdown';
import { simulateSearch, getSearchHistory, clearSearchHistory, saveSearchHistory, type SearchHistoryItem } from '@/utils/searchSimulator';
import { useVoiceRecorder } from "./../hooks/useVoiceRecoders"

// Mock Data (기본값 - 통화 전)
const defaultCustomerInfo = {
  id: 'CUST-TEDDY-00000', // FK용 (화면 표시 안함)
  name: '홍길동',
  phone: '010-1234-5678',
  birthDate: '1985-03-15',
  address: '서울시 강남구 테헤란로 123',
  cardName: undefined,
  cardNumber: undefined,
  cardIssueDate: undefined,
  cardExpiryDate: undefined,
};

const defaultRecentConsultations = [
  { id: 1, title: '카드 재발급 문의', date: '2025-01-03 10:30', category: '카드분실', status: '완료' },
  { id: 2, title: '해외 결제 문의', date: '2024-12-28 14:20', category: '해외결제', status: '진행중' },
  { id: 3, title: '수수료 환불 요청', date: '2024-12-20 09:15', category: '수수료문의', status: '완료' },
];

// ⭐ 인입 케이스별 키워드 (통화 전 이미 분류되어 있음) - ⭐ Phase 14: 8개 대분류로 통일
const incomingKeywordsByCase: Record<string, string[]> = {
  '분실/도난': ['카드분실', '분실신고', '재발급', '도난', '긴급정지', '즉시정지', '카드정지'],
  '한도': ['한도증액', '한도조회', '신용한도', '증액신청', '한도상향', '한도부족'],
  '결제/승인': ['결제', '승인', '선결제', '즉시출금', '결제대금', '승인취소', '매출취소', '결제오류'],
  '이용내역': ['이용내역', '이용내역조회', '거래내역', '사용내역', '명세서'],
  '수수료/연체': ['연체', '연체문의', '연체이자', '수수료문의', '연회비', '이자', '할부수수료', '미납', '납부'],
  '포인트/혜택': ['포인트', '마일리지', '캐시백', '적립', '혜택조회', '이벤트', '혜택'],
  '정부지원': ['정부지원', '바우처', '등유', '임신', '육아', '복지카드', '정부지원금'],
  '기타': ['일반상담', '안내', '기타문의', '카드발급', '서비스', '문의', '해외결제', '해외사용', '결제일변경'],
};

// ⭐ 교육 모드 튜토리얼 단계
const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: '교육 시뮬레이션에 오신 것을 환영합니다!',
    description: `실전과 같은 상담 환경에서 안전하게 연습할 수 있습니다.\n\n이 가이드는 상담 화면의 주요 기능을 7단계로 안내합니다.\n각 단계를 천천히 확인하며 익숙해지세요.`,
  },
  {
    id: 'step-1',
    targetId: 'scenario-selector',
    title: '대기 콜 현황',
    description: '실제 업무에서는 이 화면에서 8개 대분류 인입케이스(분실/도난, 한도, 결제/승인 등)를 선택하여 통화를 시작합니다. 다이렉트 콜은 우측 상단에서 바로 받을 수 있습니다.',
    position: 'bottom',
  },
  {
    id: 'step-2',
    targetId: 'call-button',
    title: '통화 시작/종료',
    description: '이제 통화 버튼을 눌러 상담을 시작해보세요. 통화 시간이 자동으로 기록되며, 통화 중에는 녹음이 진행됩니다.',
    position: 'bottom',
  },
  {
    id: 'step-3',
    targetId: 'stt-area',
    title: '실시간 음성 텍스트 (STT)',
    description: '통화 시작 후 고객과의 대화가 실시간으로 텍스트로 변환되어 표시됩니다. 중요한 키워드는 자동으로 강조되며 AI가 문의 유형을 분석합니다.',
    position: 'bottom',
  },
  {
    id: 'step-4',
    targetId: 'keyword-area',
    title: '키워드 자동 추출',
    description: '통화 중 대화에서 자동 추출된 핵심 키워드가 표시됩니다. 이를 통해 고객의 문의 유형과 상황을 빠르게 파악할 수 있습니다.',
    position: 'bottom',
  },
  {
    id: 'step-5',
    targetId: 'info-cards-area',
    title: '현재 상황 정보 카드',
    description: '키워드 분석 후 현재 상황에 필요한 상품 정보, 약관, 처리 절차가 자동으로 표시됩니다. "자세히 보기"를 클릭해 상세 내용을 확인하세요.',
    position: 'bottom',
  },
  {
    id: 'step-6',
    targetId: 'next-step-button',
    title: 'Step 진행 인디케이터',
    description: '상담이 진행되면 다음 Step으로 자동 전환됩니다. 인디케이터를 클릭하거나 카드를 드래그하여 이전 단계를 다시 볼 수 있습니다.',
    position: 'bottom',
  },
  {
    id: 'step-7',
    targetId: 'memo-area',
    title: '상담 메모',
    description: '상담 중 중요한 내용을 메모할 수 있습니다. 메모는 5초마다 자동 저장되며 상담 종료 후 후처리 페이지에서 활용됩니다.',
    position: 'left',
  },
];

// ⭐ 키워드 사전 (백엔드에서 받아올 데이터 구조) - 8개 대분류에 맞춰 확장 및 가중치 키워드 추가
const keywordDictionary = {
  "카드종류": ["신용카드", "체크카드", "법인카드", "가족카드", "선불카드", "하이브리드카드"],
  "분실도난": ["분실", "도난", "분실신고", "긴급정지", "즉시정지", "정지", "잃어버렸", "없어졌", "찾을수없"],
  "재발급": ["재발급", "재신청", "신규발급", "발급", "배송", "카드받기", "교체"],
  "결제승인": ["결제", "승인", "취소", "환불", "거절", "한도", "거래", "결제오류", "승인거부"],
  "포인트마일": ["포인트", "마일리지", "캐시백", "적립", "사용", "혜택", "리워드", "보너스"],
  "수수료연회비": ["수수료", "연회비", "이자", "할부", "수수료문의", "면제", "면제조건", "할부수수료"],
  "해외사용": ["해외", "해외결제", "해외사용", "외화", "환전", "달러", "해외승인", "해외가맹점"],
  "한도관리": ["한도", "한도증액", "한도조회", "신용한도", "증액", "증액신청", "한도상향", "한도부족"],
  "연체납부": ["연체", "연체이자", "납부", "결제지연", "미납", "입금", "가상계좌", "즉시납부"],
  "결제일": ["결제일", "결제일변경", "이체일", "출금일", "납부일", "급여일", "변경신청"],
};

// 모든 키워드를 하나의 배열로 변환
const allKeywords = Object.values(keywordDictionary).flat();

// 키워드 카테고리별 색상 매핑
const getKeywordCategory = (text: string): string | null => {
  for (const [category, keywords] of Object.entries(keywordDictionary)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  return null;
};

// 카테고리별 색상 - 8개 대분류에 맞춰 확장
const categoryColors: Record<string, string> = {
  "카드종류": "bg-[#E3F2FD] text-[#1976D2]",
  "분실도난": "bg-[#FFEBEE] text-[#C62828]",
  "재발급": "bg-[#E8F5E9] text-[#2E7D32]",
  "결제승인": "bg-[#FFF3E0] text-[#EF6C00]",
  "포인트마일": "bg-[#FCE4EC] text-[#C2185B]",
  "수수료연회비": "bg-[#F3E5F5] text-[#7B1FA2]",
  "해외사용": "bg-[#E0F2F1] text-[#00695C]",
  "한도관리": "bg-[#E1F5FE] text-[#0277BD]",
  "연체납부": "bg-[#FFF8E1] text-[#F57C00]",
  "결제일": "bg-[#F1F8E9] text-[#558B2F]",
};

// 대기 콜 현황 초기 데이터 (함수로 변경 - 매번 새로 생성) - ⭐ Phase 14: 8개 대분류로 통일
const getInitialWaitingCalls = () => [
  { category: '분실/도난', count: 3, waitTimeSeconds: 155, priority: 'urgent' as const },
  { category: '한도', count: 4, waitTimeSeconds: 115, priority: 'normal' as const },
  { category: '결제/승인', count: 12, waitTimeSeconds: 90, priority: 'normal' as const },
  { category: '이용내역', count: 7, waitTimeSeconds: 80, priority: 'normal' as const },
  { category: '수수료/연체', count: 2, waitTimeSeconds: 190, priority: 'urgent' as const },
  { category: '포인트/혜택', count: 2, waitTimeSeconds: 65, priority: 'normal' as const },
  { category: '정부지원', count: 1, waitTimeSeconds: 120, priority: 'normal' as const },
  { category: '기타', count: 11, waitTimeSeconds: 45, priority: 'normal' as const },
];

// 시간을 MM:SS 포맷으로 변환
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const currentSituationCards: ScenarioCard[] = [
  {
    id: '1',
    title: '카드 분실 신고 처리 절차',
    keywords: ['#분실신고', '#즉시정지', '#재발급'],
    content: '고객의 카드 분실 신고를 접수하고 즉시 카드 사용을 정지합니다.',
    systemPath: '고객관리 > 카드관리 > 분실신고 > 즉시정지',
    requiredChecks: [
      '✓ 본인 확인: 주민번호 뒷자리 4자리 필수',
      '✓ 분실 일시 및 장소 확인',
      '✓ 최근 3일 거래내역 이상여부 확인',
      '✓ 재발급 신청 의사 확인'
    ],
    exceptions: [
      '⚠️ 법인카드: 담당자 승인 필요 (승인번호 기재)',
      '⚠️ 가족카드: 주카드 회원 동의 필수',
      '⚠️ 해외 분실: 긴급 카드 발급 가능 (수수료 $30)'
    ],
    regulation: '카드업무 취급요령 제34조 (분실신고 및 재발급)',
    fullText: `제34조 (카드의 분실신고 및 재발급)

① 회원은 카드를 분실한 경우 즉시 회사에 신고하여야 하며, 회사는 신고 접수 즉시 해당 카드의 이용을 정지하여야 한다.

② 회사는 회원의 분실신고 접수 시점 이후 발생한 제3자의 부정사용으로 인한 손해에 대하여 책임을 지며, 신고 접수 이전 72시간 이내 발생한 손해에 대해서는 보험 처리를 통해 보상한다.

③ 재발급 신청 시 회원은 본인확인 절차를 거쳐야 하며, 재발급 수수료는 면제한다. 단, 긴급 재발급의 경우 별도 수수료가 부과될 수 있다.

④ 재발급 카드는 신청일로부터 3-5 영업일 내 등록된 주소로 등기우편으로 발송되며, 회원은 SMS를 통해 배송 추적 번호를 제공받는다.

⑤ 법인카드의 경우 법인 담당자의 서면 승인이 필요하며, 가족카드는 주카드 회원의 동의가 필요하다.`,
    time: '처리 시간: 약 3-5분',
    note: '분실 신고 후 72시간 내 부정 사용 보상 가능'
  },
  {
    id: '2',
    title: '긴급 카드 정지 안내',
    keywords: ['#긴급처리', '#즉시정지'],
    content: '카드 분실 시 즉시 사용 정지가 가능하며 부정 사용을 방지합니다.',
    systemPath: '시스템 > 긴급처리 > 카드즉시정지 (단축키: Ctrl+Shift+S)',
    requiredChecks: [
      '✓ 정지 사유 코드 선택 (분실/도난/기타)',
      '✓ 정지 시각 자동 기록 확인',
      '✓ 고객 휴대폰 번호 재확인',
      '✓ SMS 발송 완료 확인'
    ],
    exceptions: [
      '⚠️ 정기결제: 72시간 유예 (자동이체 포함)',
      '⚠️ 교통카드: 별도 정지 필요 (교통카드 메뉴)',
      '⚠️ 해외 가맹점: 최대 24시간 지연 가능'
    ],
    regulation: '카드 이용약관 제8조 (카드의 이용정지)',
    fullText: `제8조 (카드의 이용정지)

① 회원이 카드의 이용정지를 요청하는 경우 회사는 즉시 카드 이용을 정지하며, 정지 시점은 시스템에 자동 기록된다.

② 카드 이용정지 시 회사는 회원에게 SMS, 이메일, 앱 푸시 알림을 통해 정지 사실을 통지한다.

③ 정지된 카드로는 신규 거래가 불가능하나, 정지 이전 승인된 거래 중 아직 매입되지 않은 거래는 정상 처리될 수 있다.

④ 정기결제 거래의 경우 카드 정지 후 72시간의 유예기간이 적용되며, 이 기간 동안 승인된 정기결제는 정상 처리된다.

⑤ 교통카드 기능이 포함된 카드의 경우 별도의 교통카드 정지 절차가 필요하며, 카드 정지 메뉴의 교통카드 탭에서 추가 정지를 진행해야 한다.

⑥ 해외 가맹점에서의 거래는 네트워크 지연으로 인해 카드 정지 후 최대 24시간까지 승인될 수 있다.`,
    time: '처리 시간: 즉시',
    note: '정지 후에도 정기 결제는 72시간 유예'
  },
];

const nextStepCards: ScenarioCard[] = [
  {
    id: '3',
    title: '재발급 카드 배송 안내',
    keywords: ['#배송', '#3-5일', '#주소확인'],
    content: '재발급 카드는 등록된 주소로 3-5일 내 배송되며 배송 추적이 가능합니다.',
    systemPath: '카드관리 > 재발급관리 > 배송조회 (단축키: Ctrl+D)',
    requiredChecks: [
      '✓ 등록 주소 정확성 확인 (우편번호 포함)',
      '✓ 수령 가능 시간대 확인',
      '✓ 대리 수령 가능 여부 안내',
      '✓ 배송 추적 SMS 수신 동의'
    ],
    exceptions: [
      '⚠️ 주소 변경: 발송 전까지만 가능 (고객센터 연락)',
      '⚠️ 긴급 배송: 익일 배송 가능 (수수료 5,000원)',
      '⚠️ 해외 주소: 국제 배송 불가 (국내만 가능)'
    ],
    regulation: '카드업무 취급요령 제35조 (카드의 배송 및 수령)',
    fullText: `제35조 (카드의 배송 및 수령)

① 재발급 카드는 회원이 등록한 주소로 등기우편을 통해 배송되며, 배송 기간은 신청일로부터 3-5 영업일이다.

② 회사는 카드 발송 시 회원에게 SMS를 통해 택배 송장 번호를 제공하며, 회원은 택배사 홈페이지에서 실시간 배송 추적이 가능하다.

③ 배송비는 회사가 부담하며, 회원의 추가 비용 부담은 없다. 단, 긴급 배송(익일 배송)을 요청하는 경우 별도의 수수료가 부과될 수 있다.

④ 카드는 본인 또는 동거 가족이 수령할 수 있으며, 대리 수령 시 신분증 확인이 필요하다.

⑤ 배송 주소 변경은 카드 발송 전까지만 가능하며, 발송 후에는 택배사를 통한 주소 변경이 불가능하다.

⑥ 카드 수령 후에는 즉시 카드 뒷면에 서명하고, 앱 또는 ARS를 통해 카드를 활성화해야 사용이 가능하다.`,
    time: '배송 기간: 3-5 영업일',
    note: '배송비 무료 / 등기 배송으로 안전 배송'
  },
  {
    id: '4',
    title: '분실 카드 부정 사용 보상',
    keywords: ['#보상', '#부정사용', '#보험'],
    content: '분실 신고 후 발생한 부정 사용은 보험 처리로 보상 가능합니다.',
    systemPath: '보상관리 > 부정사용보상 > 보상신청 (단축키: Ctrl+I)',
    requiredChecks: [
      '✓ 분실 신고 접수 시각 확인 (시스템 자동 기록)',
      '✓ 부정 사용 거래 내역 확인 (금액, 시각, 가맹점)',
      '✓ 경찰서 분실 신고 확인서 (고액일 경우)',
      '✓ 보험 청구 서류 안내 및 이메일 발송'
    ],
    exceptions: [
      '⚠️ 신고 전 72시간 이전 거래: 회원 부담 50%',
      '⚠️ 가족/지인 사용: 보상 불가 (본인 책임)',
      '⚠️ 비밀번호 유출: 보상 제외 (회원 과실)'
    ],
    regulation: '카드 이용약관 제23조 (분실·도난 카드의 부정사용)',
    fullText: `제23조 (분���·도난 카드의 부정사용)

① 회원이 카드의 분실 또는 도난 사실을 회사에 신고한 경우, 회사는 신고 접수 시점 이후 발생한 제3자의 부정사용으로 인한 손해를 전액 부담한다.

② 신고 접수 시점 이전 72시간 이내에 발생한 부정사용 손해에 대해서는 회사가 가입한 보험을 통해 보상하며, 보상 한도는 거래 건당 100만원, 연간 1,000만원으로 한다.

③ 72시간 이전에 발생한 부정사용에 대해서는 회원이 50%를 부담하고, 회사가 50%를 부담한다.

④ 다음 각 호의 경우에는 회사가 책임을 지지 않는다:
   1. 회원의 고의 또는 중대한 과실로 카드가 분실 또는 도난된 경우
   2. 회원이 비밀번호를 제3자에게 누설하거나 카드에 비밀번호를 기재한 경우
   3. 회원의 가족, 동거인 등 회원과 생계를 같이하는 자가 사용한 경우

⑤ 보상 처리는 필요 서류 접수 후 7-10 영업일 내에 완료되며, 보상금은 회원의 카드 대금 청구액에서 차감된다.

⑥ 고액의 부정사용(100만원 초과)이 발생한 경우 경찰서 분실 신고 확인서를 제출해야 한다.`,
    time: '처리 기간: 7-10 영업일',
    note: '신고 후 72시간 내 거래는 100% 보상'
  }
];

const guidanceScript = '고객님, 카드 분실 신고 접수되었습니다. 즉시 카드 사용이 정지되며, 3-5일 내 재발급 카드가 등록된 주소로 배송됩니다.';

// STT 실시간 스트림 데이터 (시뮬레이션) - ⭐ 딜레이 추가 및 자연스러운 타이밍
const sttStreamData = [
  { text: '안녕하세요', delay: 3000, isKeyword: false },  // 3초 딜레이 후 시작
  { text: ' 고객님', delay: 3400, isKeyword: false },
  { text: ' 테디카드입니다', delay: 4000, isKeyword: false },
  { text: ' 카드를', delay: 5500, isKeyword: false },
  { text: ' 분실', delay: 6200, isKeyword: true },
  { text: '하셨다고요?', delay: 6800, isKeyword: false },
  { text: ' 분실신고', delay: 8000, isKeyword: true },
  { text: ' 접수', delay: 8700, isKeyword: false },
  { text: ' 도와드리겠습니다', delay: 9500, isKeyword: false },
  { text: ' 먼저', delay: 11000, isKeyword: false },
  { text: ' 본인', delay: 11500, isKeyword: false },
  { text: ' 확인을', delay: 12000, isKeyword: false },
  { text: ' 위해', delay: 12500, isKeyword: false },
  { text: ' 주민번호', delay: 13000, isKeyword: false },
  { text: ' 뒷자리', delay: 13500, isKeyword: false },
  { text: ' 4자리를', delay: 14000, isKeyword: false },
  { text: ' 말씀해주시겠어요?', delay: 14800, isKeyword: false },
  { text: ' 네', delay: 18000, isKeyword: false },
  { text: ' 확인되었습니다', delay: 18700, isKeyword: false },
  { text: ' 언제', delay: 20000, isKeyword: false },
  { text: ' 어디서', delay: 20500, isKeyword: false },
  { text: ' 분실', delay: 21000, isKeyword: true },
  { text: '하셨나요?', delay: 21600, isKeyword: false },
  { text: ' 오늘', delay: 24000, isKeyword: false },
  { text: ' 오전', delay: 24400, isKeyword: false },
  { text: ' 강남역', delay: 24900, isKeyword: false },
  { text: ' 근처에서', delay: 25500, isKeyword: false },
  { text: ' 분실', delay: 26100, isKeyword: true },
  { text: '하셨군요', delay: 26700, isKeyword: false },
  { text: ' 즉시정지', delay: 28000, isKeyword: true },
  { text: ' 처리해드리겠습니다', delay: 28900, isKeyword: false },
  { text: ' 최근', delay: 30500, isKeyword: false },
  { text: ' 3일간', delay: 31000, isKeyword: false },
  { text: ' 거래내역', delay: 31600, isKeyword: false },
  { text: ' 확인', delay: 32100, isKeyword: false },
  { text: ' 중입니다', delay: 32700, isKeyword: false },
  { text: ' 이상', delay: 35000, isKeyword: false },
  { text: ' 거래는', delay: 35500, isKeyword: false },
  { text: ' 발견되지', delay: 36000, isKeyword: false },
  { text: ' 않았습니다', delay: 36700, isKeyword: false },
  { text: ' 재발급', delay: 38500, isKeyword: true },
  { text: ' 신청하시겠습니까?', delay: 39400, isKeyword: false },
  { text: ' 네', delay: 42000, isKeyword: false },
  { text: ' 재발급', delay: 42500, isKeyword: true },
  { text: ' 신청', delay: 43000, isKeyword: false },
  { text: ' 도와드리겠습니다', delay: 43800, isKeyword: false },
  { text: ' 등록된', delay: 45500, isKeyword: false },
  { text: ' 주소로', delay: 46000, isKeyword: false },
  { text: ' 3-5', delay: 46500, isKeyword: false },
  { text: ' 영업일', delay: 47000, isKeyword: false },
  { text: ' 내', delay: 47400, isKeyword: false },
  { text: ' 배송', delay: 47900, isKeyword: true },
  { text: '됩니다', delay: 48500, isKeyword: false },
];

interface ChatMessage {
  id: number;
  type: 'user' | 'ai';
  text: string;
  timestamp: string;
}

// ⭐ 페르소나 기반 상담 안내 멘트 생성 함수
const getPersonaMessage = (baseMessage: string, traits: string[] = []) => {
  if (!traits || traits.length === 0) return baseMessage;

  // 1. 성격급함/실용주의 (N1) -> 핵심만 간결하게
  if (traits.some(t => ['성격급함', '신속처리', '결론중시', '급한 성향', '빠른 답변 선호'].includes(t))) {
    // 문장이 길면 첫 문장만 사용하거나 요약
    const summary = baseMessage.split(/(?:니다|시오)\./)[0] + '니다.';
    return `(핵심 요약) 고객님, 결론부터 말씀드리면 ${summary} 바로 처리해드리겠습니다.`;
  }

  // 2. 꼼꼼함/분석형 (C3) -> 상세하게, 절차 강조
  if (traits.some(t => ['꼼꼼함', '데이터중시', '절차중시', '상세설명선호', '기술 친화적'].includes(t))) {
    return `(상세 안내) 고객님, 문의하신 내용은 규정에 따라 정확하게 처리되며, ${baseMessage} 처리 과정은 문자로도 안내해 드립니다.`;
  }

  // 3. 불만/감정형 (S5) -> 공감, 사과 먼저
  if (traits.some(t => ['불만', '감정적', '보상심리', '화남', '불편'].includes(t))) {
    return `(공감 화법) 고객님, 많이 불편하셨겠습니다. 죄송합니다. ${baseMessage} 제가 책임지고 빠르게 해결해 드리겠습니다.`;
  }
  
  // 4. 친절/관계지향 (I2) -> 친근하게
  if (traits.some(t => ['친절함', '대화선호', '라포형성'].includes(t))) {
    return `(친근하게) 네, 고객님! 걱정 마세요. ${baseMessage} 제가 꼼꼼히 챙겨서 처리해 드리겠습니다.`;
  }

  return baseMessage;
};

export default function RealTimeConsultationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ⭐ sessionStorage를 우선 확인하고, 없으면 location.state 확인
  const isSimulationMode = sessionStorage.getItem('simulationMode') === 'true' || location.state?.mode === 'simulation';
  const educationType = sessionStorage.getItem('educationType') || location.state?.educationType || 'basic'; // 'basic' or 'advanced'
  
  // ⭐ sessionStorage에 시뮬레이션 모드 저장 (후처리 페이지에서 사용)
  useEffect(() => {
    if (location.state?.mode === 'simulation') {
      sessionStorage.setItem('simulationMode', 'true');
      sessionStorage.setItem('educationType', location.state?.educationType || 'basic');
    }
  }, [location.state]);
  
  // ⭐ Theme Colors based on Mode
  const themePrimary = isSimulationMode ? '#10B981' : '#0047AB'; // Emerald-500 vs Blue-700
  const themePrimaryHover = isSimulationMode ? '#059669' : '#003580';
  const themeSecondary = isSimulationMode ? '#ECFDF5' : '#E8F1FC'; // Light Emerald vs Light Blue
  const themeBorder = isSimulationMode ? '#10B981' : '#0047AB';
  const themeText = isSimulationMode ? '#059669' : '#0047AB';

  const chatEndRef = useRef<HTMLDivElement>(null);
  const sttEndRef = useRef<HTMLDivElement>(null); // ⭐ STT 자동 스크롤용
  
  // ⭐ 드래그 관련 ref
  const currentSituationDragRef = useRef<HTMLDivElement>(null);
  const nextStepDragRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const dragDistanceRef = useRef(0); // 드래그 거리 추적
  const activeContainerRef = useRef<'current' | 'next' | null>(null); // 어느 컨테이너를 드래그 중인지
  
  // ⭐ 카드 타임스탬프 캐싱 ref (페이지 리렌더링에도 유지)
  const cardTimestampsRef = useRef<Record<string, { timestamp: string; displayTime: string }>>({});
  
  // Sidebar Context 사용
  const { isSidebarExpanded } = useSidebar();
  
  // Local state
  // ⭐ 통화 상태 - 초기값을 localStorage에서 확인
  const [isCallActive, setIsCallActive] = useState(() => {
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        console.log('🔍 초기 렌더링 - 진행 중인 통화 발견:', state.isActive);
        return state.isActive;
      } catch {
        return false;
      }
    }
    return false;
  });
  const [isIncomingCall, setIsIncomingCall] = useState(() => {
    // ⭐ 교육 모드일 때는 "통화 연결 중" 상태로 시작
    const isSimulation = sessionStorage.getItem('simulationMode') === 'true';
    const isGuideMode = localStorage.getItem('isGuideModeActive') === 'true';
    
    // 교육 모드이고 가이드 모드가 아닐 때 "통화 연결 중" 상태로 시작
    if (isSimulation && !isGuideMode) {
      return true;
    }
    return false;
  }); // ⭐ 인입 콜 상태 (전화벨이 울리는 중)
  const [callTime, setCallTime] = useState(() => {
    // ⭐ 복원 시 경과 시간 계산
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        if (state.startTimestamp) {
          const elapsed = Math.floor((Date.now() - state.startTimestamp) / 1000);
          console.log('🔍 초기 렌더링 - callTime 계산:', elapsed, '초');
          return elapsed;
        }
      } catch {
        return 0;
      }
    }
    return 0;
  }); // 0부터 시작
  // ⭐ 복원된 통화 플래그 - 초기값을 localStorage에서 확인
  const [isRestoredCall, setIsRestoredCall] = useState(() => {
    return !!localStorage.getItem('activeCallState');
  });
  const [memo, setMemo] = useState(() => {
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        console.log('🔍 초기 렌더링 - memo 복원:', state.memo);
        return state.memo || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [cardTimestamps, setCardTimestamps] = useState<Record<string, { timestamp: string; displayTime: string }>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchHistoryOpen, setIsSearchHistoryOpen] = useState(false); // 검색 이력 폴딩 상태
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(true); // ⭐ Phase 13: 최초 닫힌 상태로 시작
  const [selectedDetailCard, setSelectedDetailCard] = useState<ScenarioCard | null>(null);
  const [isEndCallModalOpen, setIsEndCallModalOpen] = useState(false); // 통화 종료 확인 모달
  const [isSaving, setIsSaving] = useState(false); // 저장 상태
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle'); // 저장 상태 표시
  
  // STT 실시간 분석 state ⭐ NEW
  const [sttTexts, setSttTexts] = useState<{text: string, isKeyword: boolean, speaker?: 'agent' | 'customer'}[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // 칸반보드 로딩 상태
  const [incomingKeywords, setIncomingKeywords] = useState<string[]>(() => {
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        console.log('🔍 초기 렌더링 - incomingKeywords 복원:', state.incomingKeywords);
        return state.incomingKeywords || [];
      } catch {
        return [];
      }
    }
    return [];
  }); // ⭐ 인입 키워드 (3개 고정)
  const [currentCase, setCurrentCase] = useState<string>(''); // ⭐ 현재 인입 케이스
  const [isKeywordDetected, setIsKeywordDetected] = useState(() => {
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        // 통화 중이면 키워드 감지됨
        return state.isActive === true;
      } catch {
        return false;
      }
    }
    return false;
  }); // ⭐ 키워드 감지 여부
  const [showNextStepCards, setShowNextStepCards] = useState(() => {
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        // 통화 중이면 다음 단계 카드 표시
        return state.isActive === true;
      } catch {
        return false;
      }
    }
    return false;
  }); // ⭐ 다음 단계 카드 표시 여부
  const [consultationStartTime, setConsultationStartTime] = useState<string>(() => {
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        console.log('🔍 초기 렌더링 - consultationStartTime 복원:', state.consultationStartTime);
        return state.consultationStartTime || '';
      } catch {
        return '';
      }
    }
    return '';
  }); // ⭐ 상담 시작 시간 기록
  const [startTimestamp, setStartTimestamp] = useState<number>(() => {
    // ⭐ 복원 시 타임스탬프도 즉시 로드
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        console.log('🔍 초기 렌더링 - 타임스탬프 복원:', state.startTimestamp);
        return state.startTimestamp || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }); // ⭐ 통화 시작 타임스탬프 (고정값)
  const [isDirectIncoming, setIsDirectIncoming] = useState(() => {
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        console.log('🔍 초기 렌더링 - isDirectIncoming 복원:', state.isDirectIncoming);
        return state.isDirectIncoming || false;
      } catch {
        return false;
      }
    }
    return false;
  }); // ⭐ 다이렉트 인입 여부 (통화 버튼 직접 클릭)
  
  // ⭐ Phase 3: 시나리오 기반 시뮬레이션
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(() => {
    // 복원 시 시나리오도 즉시 로드
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        if (state.activeScenario) {
          const scenario = getScenarioByCategory(state.activeScenario.category);
          console.log('🔍 초기 렌더링 - 시나리오 복원:', scenario?.category);
          return scenario || null;
        }
      } catch {
        return null;
      }
    }
    return null;
  });
  const [currentStep, setCurrentStep] = useState(() => {
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        return state.currentStep || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }); // 0: 대기, 1: Step1, 2: Step2, 3: Step3
  const [previousStep, setPreviousStep] = useState(0); // 이전 step (슬라이딩 방향 결정용)
  const [maxReachedStep, setMaxReachedStep] = useState(() => {
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        return state.maxReachedStep || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }); // 최대 도달 Step (STT 키워드로만 증가)
  const [customerInfo, setCustomerInfo] = useState(() => {
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        console.log('🔍 초기 렌더링 - customerInfo 복원:', state.customerInfo);
        return state.customerInfo || defaultCustomerInfo;
      } catch {
        return defaultCustomerInfo;
      }
    }
    return defaultCustomerInfo;
  });
  const [recentConsultations, setRecentConsultations] = useState(defaultRecentConsultations);
  const [showCustomerInfo, setShowCustomerInfo] = useState(() => {
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        // 통화 중이면 고객 정보 표시
        return state.isActive === true;
      } catch {
        return false;
      }
    }
    return false;
  }); // 고객 정보 표시 여부
  const [showRecentConsultations, setShowRecentConsultations] = useState(() => {
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        // 통화 중이면 최근 상담 내역 표시
        return state.isActive === true;
      } catch {
        return false;
      }
    }
    return false;
  }); // 최근 상담 내역 표시 여부
  const [displayedKeywords, setDisplayedKeywords] = useState<string[]>(() => {
    const activeCallState = localStorage.getItem('activeCallState');
    if (activeCallState) {
      try {
        const state = JSON.parse(activeCallState);
        console.log('🔍 초기 렌더링 - displayedKeywords 복원:', state.displayedKeywords);
        return state.displayedKeywords || [];
      } catch {
        return [];
      }
    }
    return [];
  }); // 실제 화면에 표시되는 키워드
  const [isExtractingKeywords, setIsExtractingKeywords] = useState(false); // 키워드 추출 중 로딩
  
  // ⭐ Phase 8-1: 참조 문서 추적 (Step별로 표시된 카드 ID 저장)
  const [referencedDocuments, setReferencedDocuments] = useState<{
    step1: string[];
    step2: string[];
    step3: string[];
  }>({ step1: [], step2: [], step3: [] });
  
  // ⭐ 현재 세션의 검색 문서 추적 (검색 결과 카드 ID 저장)
  const [searchedDocuments, setSearchedDocuments] = useState<string[]>([]);
  
  // 모바일 탭 상태 (모바일/태블릿 전용)
  const [mobileTab, setMobileTab] = useState<'customer' | 'consultation' | 'control'>('consultation');
  
  // 대기 콜 현황 상태
  const [waitingCalls, setWaitingCalls] = useState(getInitialWaitingCalls());
  const [totalWaitingCalls, setTotalWaitingCalls] = useState(
    getInitialWaitingCalls().reduce((sum, call) => sum + call.count, 0)
  );

  // ⭐ 교육 모드 튜토리얼 상태
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialPhase, setTutorialPhase] = useState<1 | 2>(1); // 1: 대기중, 2: 통화중
  const [currentTutorialSteps, setCurrentTutorialSteps] = useState<TutorialStep[]>(tutorialStepsPhase1);
  
  // ⭐ 가이드 모드 플래그 (localStorage에서 관리)
  const [isGuideModeActive, setIsGuideModeActive] = useState(() => {
    return localStorage.getItem('isGuideModeActive') === 'true';
  });
  
  // ⭐ 다이렉트 콜 차단 모달 (가이드 모드용)
  const [showDirectCallBlockModal, setShowDirectCallBlockModal] = useState(false);
  
  // ⭐ 대기콜 차단 모달 (교육 모드용)
  const [showWaitingCallBlockModal, setShowWaitingCallBlockModal] = useState(false);

  // 타이머 ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waitingCallsTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 전화 웹소켓
  const { start: startRecording, stop: stopRecording, wsStatus } = useVoiceRecorder();



  // Phase 3-2: 이미 표시된 STT 메시지 인덱스 추적
  const displayedSttIndexRef = useRef<number>(0);
  
  // ⭐ 단어 큐 시스템 (누락 방지)
  const wordQueueRef = useRef<Array<{
    text: string;
    isKeyword: boolean;
    speaker: 'agent' | 'customer';
    matchedKeyword?: string;
  }>>([]);
  const isProcessingQueueRef = useRef(false);



  // ⭐ 디버깅: 교육 모드 상태 확인
  useEffect(() => {
    console.log('🔍 [상태 확인] isSimulationMode:', isSimulationMode);
    console.log('🔍 [상태 확인] sessionStorage.simulationMode:', sessionStorage.getItem('simulationMode'));
    console.log('🔍 [상태 확인] location.state:', location.state);
    console.log('🔍 [상태 확인] educationType:', educationType);
    console.log('🔍 [상태 확인] isCallActive:', isCallActive);
    console.log('🔍 [상태 확인] isRestoredCall:', isRestoredCall);
    console.log('🔍 [상태 확인] activeScenario:', activeScenario?.category);
  }, [isSimulationMode, educationType, location.state, isCallActive, isRestoredCall, activeScenario]);

  // ⭐ 교육 모드 진입 시 튜토리얼 완료 상태 초기화 (가이드 모드는 건드리지 않음)
  useEffect(() => {
    if (isSimulationMode && !isGuideModeActive) {
      console.log('🎓 교육 모드 진입 → 튜토리얼 완료 상태 초기화');
      localStorage.removeItem('tutorial-phase1-completed');
      localStorage.removeItem('tutorial-phase2-completed');
      localStorage.removeItem('tutorial-completed');
    }
  }, [isSimulationMode, isGuideModeActive]);

  // ⭐ 가이드 모드 상태 동기화 (localStorage ↔ state)
  useEffect(() => {
    if (isGuideModeActive) {
      localStorage.setItem('isGuideModeActive', 'true');
    } else {
      localStorage.removeItem('isGuideModeActive');
    }
  }, [isGuideModeActive]);

  // ⭐ 헤더의 가이드 버튼 클릭 감지 (localStorage 이벤트)
  useEffect(() => {
    const handleStartGuideRequest = () => {
      const requested = localStorage.getItem('startGuideRequested');
      if (requested === 'true') {
        console.log('🎓 헤더 가이드 버튼 클릭 감지 → 가이드 모드 시작');
        
        // 플래그 제거
        localStorage.removeItem('startGuideRequested');
        
        // 가이드 모드 활성화
        setIsGuideModeActive(true);
        localStorage.setItem('isGuideModeActive', 'true');
        
        // 가이드 모드용 기본 시나리오 설정
        sessionStorage.setItem('simulationMode', 'true');
        // ⭐ educationType 유지 (이미 advanced 모드면 그대로 유지)
        if (!sessionStorage.getItem('educationType')) {
          sessionStorage.setItem('educationType', 'basic');
        }
        sessionStorage.setItem('scenarioId', 'SIM-001');
        
        // 현재 상태에 맞는 Phase의 튜토리얼 시작
        if (isCallActive) {
          setTutorialPhase(2);
          setCurrentTutorialSteps(tutorialStepsPhase2);
        } else {
          setTutorialPhase(1);
          setCurrentTutorialSteps(tutorialStepsPhase1);
        }
        setIsTutorialActive(true);
      }
    };
    
    // 초기 확인
    handleStartGuideRequest();
    
    // 1초마다 폴링 (간단한 방식)
    const interval = setInterval(handleStartGuideRequest, 500);
    
    return () => clearInterval(interval);
  }, [isCallActive]);

  // ⭐ 교육 모드 튜토리얼 Phase 전환 (자동 시작 제거!)
  useEffect(() => {
    if (isSimulationMode && isGuideModeActive) {
      const phase1Completed = localStorage.getItem('tutorial-phase1-completed');
      const phase2Completed = localStorage.getItem('tutorial-phase2-completed');
      
      // Phase 판단: 통화 중이면 Phase 2, 대기 중이면 Phase 1
      if (isCallActive) {
        // 통화 중
        if (!phase2Completed) {
          console.log('🎓 가이드 모드: Phase 2 튜토리얼 준비');
          setTutorialPhase(2);
          setCurrentTutorialSteps(tutorialStepsPhase2);
          // 1초 후 Phase 2 튜토리얼 시작
          const timer = setTimeout(() => {
            console.log('🎓 가이드 모드: Phase 2 튜토리얼 시작');
            setIsTutorialActive(true);
          }, 1000);
          return () => clearTimeout(timer);
        }
      } else {
        // 대기 중
        if (!phase1Completed) {
          console.log('🎓 가이드 모드: Phase 1 튜토리얼 준비');
          setTutorialPhase(1);
          setCurrentTutorialSteps(tutorialStepsPhase1);
          // 1초 후 Phase 1 튜토리얼 시작
          const timer = setTimeout(() => {
            console.log('🎓 가이드 모드: Phase 1 튜토리얼 시작');
            setIsTutorialActive(true);
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [isSimulationMode, isGuideModeActive, isCallActive]);

  // ⭐ 교육 시나리오 진행 안내 모달 자동 포커스
  useEffect(() => {
    if (showWaitingCallBlockModal) {
      // 모달이 열리면 div에 포커스 (Enter 키 이벤트 활성화)
      setTimeout(() => {
        const modalElement = document.querySelector('.fixed.inset-0[tabindex="-1"]') as HTMLElement;
        if (modalElement) {
          modalElement.focus();
        }
      }, 100);
    }
  }, [showWaitingCallBlockModal]);

  // 대기 콜 실시간 타이머 (매초마다 대기 시간 증가)
  useEffect(() => {
    waitingCallsTimerRef.current = setInterval(() => {
      setWaitingCalls(prev => {
        // 1. 대기 시간 업데이트
        const updated = prev.map(call => {
          const newWaitTime = call.waitTimeSeconds + Math.floor(Math.random() * 3); // 랜덤하게 0-2초 증가
          return {
            ...call,
            waitTimeSeconds: newWaitTime,
            priority: 'normal' as const // 일단 모두 normal로 초기화
          };
        });
        
        // 2. 3분 이상 대기 중인 콜 찾기
        const overThreeMinutes = updated.filter(call => call.waitTimeSeconds >= 180);
        
        if (overThreeMinutes.length === 0) {
          return updated;
        }
        
        // 3. 제일 오래 기다린 1개 찾기
        const longestWaitCall = overThreeMinutes.reduce((longest, current) => 
          current.waitTimeSeconds > longest.waitTimeSeconds ? current : longest
        );
        
        // 4. 우선순위 재설정
        return updated.map(call => {
          if (call.category === longestWaitCall.category && call.waitTimeSeconds >= 180) {
            return { ...call, priority: 'urgent' as const }; // 제일 오래된 1개 → 빨간색
          } else if (call.waitTimeSeconds >= 180) {
            return { ...call, priority: 'warning' as const }; // 나머지 3분 이상 → 주황색
          }
          return call;
        });
      });
    }, 1000);

    return () => {
      if (waitingCallsTimerRef.current) {
        clearInterval(waitingCallsTimerRef.current);
      }
    };
  }, []);

  // 통화 시작 시 타이머 시작
  useEffect(() => {
    if (isCallActive && startTimestamp > 0) {
      timerRef.current = setInterval(() => {
        // ⭐ startTimestamp 기반 정확한 시간 계산
        const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
        setCallTime(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isCallActive, startTimestamp]);

  // ⭐ 통화 중 상태 자동 저장 (1초마다)
  useEffect(() => {
    if (isCallActive) {
      const activeCallState = {
        isActive: true,
        startTimestamp: startTimestamp || Date.now(), // ⭐ 고정된 타임스탬프 사용
        memo,
        customerInfo,
        displayedKeywords,
        incomingKeywords,
        currentStep,
        maxReachedStep,
        consultationStartTime,
        isDirectIncoming,
        activeScenario: activeScenario ? {
          category: activeScenario.category,
          type: activeScenario.type
        } : null,
        // 교육 모드 정보
        isSimulationMode,
        educationType: sessionStorage.getItem('educationType')
      };
      localStorage.setItem('activeCallState', JSON.stringify(activeCallState));
    } else {
      // 통화 종료 시 삭제 (통화 종료 버튼 클릭 시에만)
      localStorage.removeItem('activeCallState');
    }
  }, [isCallActive, callTime, memo, customerInfo, displayedKeywords, incomingKeywords, currentStep, maxReachedStep, consultationStartTime, isDirectIncoming, activeScenario, isSimulationMode, startTimestamp]);

  // 메모 자동저장 (5초마다)
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (memo.trim()) {
        localStorage.setItem('currentConsultationMemo', memo);
      }
    }, 5000);

    return () => clearTimeout(autoSaveTimer);
  }, [memo]);

  // 페이지 로드 시 추가 설정 (대부분의 상태는 useState 초기화 함수에서 이미 복원됨)
  useEffect(() => {
    // ⭐ 진행 중인 통화가 있는지 확인
    const activeCallStateStr = localStorage.getItem('activeCallState');
    console.log('🔍 페이지 로드 - activeCallState 확인:', activeCallStateStr ? 'O 있음' : 'X 없음');
    
    if (activeCallStateStr) {
      try {
        const savedState = JSON.parse(activeCallStateStr);
        console.log('📞 진행 중인 통화 발견 - 복원 완료 (useState 초기화에서 처리됨)');
        console.log('🔄 복원된 통화 시간:', Math.floor((Date.now() - savedState.startTimestamp) / 1000), '초');
        
        // ⭐ UI 상태만 추가로 설정
        setIsLeftSidebarCollapsed(false); // 고객 정보 섹션 열림
        
        // 교육 모드 복원 (sessionStorage 설정)
        if (savedState.isSimulationMode) {
          sessionStorage.setItem('simulationMode', 'true');
          if (savedState.educationType) {
            sessionStorage.setItem('educationType', savedState.educationType);
          }
          console.log('✅ 교육 모드 복원 완료:', savedState.educationType);
        }
        
        console.log('✅✅✅ 통화 복원 완료 - 모든 상태 확인 완료');
      } catch (error) {
        console.error('❌ 통화 상태 복원 실패:', error);
        localStorage.removeItem('activeCallState');
      }
    }
  }, []);

  // ⭐ 교육 모드: 페이지 로드 시 시나리오 자동 로드
  useEffect(() => {
    console.log('🎓 시나리오 자동 로드 useEffect 실행 - isRestoredCall:', isRestoredCall);
    
    // ⭐ 복원된 통화는 시나리오를 덮어쓰지 않음
    if (isRestoredCall) {
      console.log('📞 복원된 통화 감지 - 시나리오 로드 스킵 (덮어쓰지 않음)');
      return;
    }
    
    // ⭐ 교육 모드/가이드 모드 진입 시 시나리오 로드
    if (isSimulationMode) {
      console.log('🎓 시뮬레이션 모드 - 시나리오 로드 시도 (가이드 모드:', isGuideModeActive, ')');
      
      // ⭐ scenarioId 우선순위: sessionStorage > location.state (페이지 새로고침 대응)
      const scenarioId = sessionStorage.getItem('scenarioId') || location.state?.scenarioId;
      
      console.log('🔍 시나리오 로드 디버깅:', {
        educationType,
        scenarioId,
        'sessionStorage.scenarioId': sessionStorage.getItem('scenarioId'),
        'location.state': location.state,
        'localStorage.simulationCase': localStorage.getItem('simulationCase'),
      });
      
      if (educationType === 'advanced') {
        // 우수 상담 사례 모드
        const savedCase = localStorage.getItem('simulationCase');
        console.log('🎓 우수 상담 사례 모드 - savedCase:', savedCase);
        if (savedCase) {
          const caseData = JSON.parse(savedCase);
          console.log('🎓 우수 상담 사례 데이터:', caseData);
          // 우수 상담 사례는 category를 기반으로 시나리오 매칭
          const scenario = getScenarioByCategory(caseData.category);
          if (scenario) {
            setActiveScenario(scenario);
            console.log('🎓 우수 상담 사례 시나리오 로드:', scenario.category);
            console.log('⚠️ 시나리오만 로드됨 - 사용자가 수동으로 통화 버튼을 클릭해야 함');
          } else {
            console.error('❌ 시나리오를 찾을 수 없음 - category:', caseData.category);
          }
        } else {
          console.error('❌ localStorage에 simulationCase가 없음');
        }
      } else {
        // 기본 시나리오 모드
        console.log('🎓 기본 시나리오 모드 - scenarioId:', scenarioId);
        if (scenarioId) {
          // scenarioId로부터 category 추출 (예: SIM-001 -> 카드분실)
          const scenario = scenarios.find(s => s.id === scenarioId);
          console.log('🎓 시나리오 검색 결과:', scenario);
          if (scenario) {
            const categoryScenario = getScenarioByCategory(scenario.category);
            console.log('🎓 카테고리 시나리오:', categoryScenario);
            if (categoryScenario) {
              setActiveScenario(categoryScenario);
              console.log('🎓 기본 시나리오 로드:', categoryScenario.category);
              console.log('⚠️ 시나리오만 로드됨 - 사용자가 수동으로 통화 버튼을 클릭해야 함');
            } else {
              console.error('❌ 카테고리 시나리오를 찾을 수 없음 - category:', scenario.category);
            }
          } else {
            console.error('❌ 시나리오를 찾을 수 없음 - scenarioId:', scenarioId);
          }
        } else {
          console.error('❌ scenarioId가 없음:', {
            'scenarioId': scenarioId,
            'sessionStorage.scenarioId': sessionStorage.getItem('scenarioId'),
            'location.state': location.state
          });
        }
      }
    }
  }, [isSimulationMode, educationType, isRestoredCall]); // ⭐ location.state 제거 (sessionStorage 사용으로 불필요)

  // ⭐ 단어 큐 처리 Interval (100ms마다 하나씩 꺼내서 state 업데이트)
  useEffect(() => {
    const queueInterval = setInterval(() => {
      if (wordQueueRef.current.length === 0 || isProcessingQueueRef.current) {
        return;
      }
      
      isProcessingQueueRef.current = true;
      const wordObj = wordQueueRef.current.shift()!;
      
      // State 업데이트
      setSttTexts(prev => [...prev, {
        text: wordObj.text,
        isKeyword: wordObj.isKeyword,
        speaker: wordObj.speaker,
      }]);
      
      // 키워드 처리
      if (wordObj.matchedKeyword && activeScenario) {
        // 현재 Step의 키워드 가져오기
        const currentStepData = activeScenario.steps[currentStep - 1];
        const currentStepKeywords = currentStepData ? currentStepData.keywords.map(k => k.text) : [];
        
        // 다음 Step의 키워드 가져오기 (있으면)
        const nextStepData = currentStep < activeScenario.steps.length ? activeScenario.steps[currentStep] : null;
        const nextStepKeywords = nextStepData ? nextStepData.keywords.map(k => k.text) : [];
        
        // ⭐ 다음 Step의 키워드가 감지되면 Step 전환
        if (nextStepKeywords.includes(wordObj.matchedKeyword)) {
          const nextStep = currentStep + 1;
          setPreviousStep(currentStep);
          setCurrentStep(nextStep);
          setMaxReachedStep(nextStep);
          setIncomingKeywords(nextStepKeywords);
          setDisplayedKeywords([wordObj.matchedKeyword]);
          setIsExtractingKeywords(false);
          setIsKeywordDetected(true);
          
          // ⭐ Phase 8-1: 참조 문서 추적 - 새 Step 진입 시 해당 Step의 카드 ID 저장
          if (nextStepData) {
            const stepKey = `step${nextStep}` as 'step1' | 'step2' | 'step3';
            const cardIds = [
              ...nextStepData.currentSituationCards.map(card => card.id),
              ...nextStepData.nextStepCards.map(card => card.id)
            ];
            setReferencedDocuments(prev => ({
              ...prev,
              [stepKey]: cardIds
            }));
          }
          
          setTimeout(() => {
            setShowNextStepCards(true);
          }, 800);
        }
        // ⭐ 현재 Step의 키워드가 감지되면 키워드만 추가
        else if (currentStepKeywords.includes(wordObj.matchedKeyword)) {
          setDisplayedKeywords(prev => {
            if (!prev.includes(wordObj.matchedKeyword!)) {
              const newKeywords = [...prev, wordObj.matchedKeyword!];
              
              // 첫 번째 키워드가 추가되면 칸반보드 즉시 표시
              if (prev.length === 0) {
                setIsKeywordDetected(true);
                setIsExtractingKeywords(false);
                setTimeout(() => {
                  setShowNextStepCards(true);
                }, 800);
              }
              
              return newKeywords;
            }
            return prev;
          });
        }
      }
      
      isProcessingQueueRef.current = false;
    }, 100); // 100ms마다 하나씩 처리 (타이핑 효과)
    
    return () => clearInterval(queueInterval);
  }, [activeScenario, currentStep]);

  // ⭐ STT 자동 스크롤 (최신 대화가 항상 보이도록)
  useEffect(() => {
    sttEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sttTexts]);

  // ⭐ STT에서 키워드 감지 시 칸반보드 표시
  useEffect(() => {
    // STT에서 키워드가 하나라도 감지되면 칸반보드 표시
    const hasKeyword = sttTexts.some(item => item.isKeyword);
    if (hasKeyword && !isKeywordDetected) {
      setIsKeywordDetected(true);
      // 현재 정보 카드 표시 후 1.2초 뒤에 다음 단계 카드 표시
      setTimeout(() => {
        setShowNextStepCards(true);
      }, 1200);
    }
  }, [sttTexts, isKeywordDetected]);

  // ⭐ 3단계: STT 실시간 스트림 시뮬레이션 (통화 시작 시)
  // Phase 3-2: 시나리오가 없을 때만 기존 로직 사용
  useEffect(() => {
    // ⭐ 다이렉트 인입 시에는 실행하지 않음 (백엔드 연동 대기)
    if (isCallActive && !activeScenario && !isDirectIncoming) {
      // 기존 로직: 시나리오가 없을 때만 실행
      // 초기화
      setSttTexts([]);
      setIsAnalyzing(true); // 로딩 시작
      setIsKeywordDetected(false); // 키워드 감지 초기화
      
      // 7초 후 로딩 종료 (첫 키워드 나온 직후)
      const analyzingTimer = setTimeout(() => {
        setIsAnalyzing(false);
      }, 7000);
      
      // STT 텍스트 순서대로 표시
      const timers = sttStreamData.map((item) => 
        setTimeout(() => {
          setSttTexts(prev => [...prev, { text: item.text, isKeyword: item.isKeyword }]);
        }, item.delay)
      );
      
      return () => {
        clearTimeout(analyzingTimer);
        timers.forEach(timer => clearTimeout(timer));
      };
    } else if (!isCallActive) {
      // 통화 종료 시 초기화
      setSttTexts([]);
      setIsAnalyzing(false);
      setIsKeywordDetected(false);
      setShowNextStepCards(false);
      
      // Phase 3: 시나리오 관련 초기화
      setShowCustomerInfo(false);
      setShowRecentConsultations(false);
      setDisplayedKeywords([]);
      setIsExtractingKeywords(false);
      setActiveScenario(null);
      setCurrentStep(0);
      setPreviousStep(0);
      setMaxReachedStep(0); // 최대 도달 Step 초기화
      displayedSttIndexRef.current = 0; // Phase 3-2: STT 인덱스 초기화
      setIsDirectIncoming(false); // 다이렉트 인입 초기화
    }
  }, [isCallActive, activeScenario]);

  // ⭐ ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedDetailCard) {
          setSelectedDetailCard(null);
        } else if (isEndCallModalOpen) {
          setIsEndCallModalOpen(false);
        }
      }
      // ⭐ Phase 8-3: Enter 키로 모달 확인 버튼 실행
      if (event.key === 'Enter' && isEndCallModalOpen) {
        event.preventDefault();
        handleConfirmEndCall();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [selectedDetailCard, isEndCallModalOpen]);

  // ⭐ Phase 3-2: 타임라인 기반 STT 시뮬레이션 (시나리오가 있을 때)
  // 기존 형식 유지: 텍스트를 단어 단위로 쪼개서 스트림, 키워드는 태그로 표시
  useEffect(() => {
    // ⭐ 통화 중이 아니거나 시나리오가 없으면 중단
    if (!isCallActive || !activeScenario) return;
    
    // ⭐ 교육 모드(가이드 아님)에서는 Mock 데이터 표시 안 함 (백엔드 연동 대기)
    if (isSimulationMode && !isGuideModeActive) {
      console.log('🚫 교육 모드: Mock STT 시뮬레이션 스킵 (백엔드 연동 대기)');
      return;
    }

    // ⭐ 상담사 이름 동적 교체 (TODO: 로그인한 상담사 이름으로 교체)
    const loggedInAgentName = "김현우"; // TODO: Auth Context에서 가져오기 (예: useAuth().user.name)
    const sttMessages = activeScenario.sttDialogue.map(msg => {
      if (msg.speaker === 'agent' && msg.message.includes('상담사')) {
        // "상담사 XXX입니다" 패턴을 찾아서 로그인한 상담사 이름으로 교체
        const replacedMessage = msg.message.replace(/상담사\s+\S+입니다/, `상담사 ${loggedInAgentName}입니다`);
        return { ...msg, message: replacedMessage };
      }
      return msg;
    });
    
    // 키워드 매핑: "카드분실" → ["카드", "잃어버렸", "분실"]
    const keywordMap: Record<string, string[]> = {
      '카드분실': ['잃어버렸', '분실'],
      '긴급정지': ['정지'],
      '본인확인': ['생년월일'],
      '재발급': ['재발급'],
      '해외출장': ['출장'],
      '긴급배송': ['임시카드', '임시'],
      '출국일정': ['인천공항'],
      '라운지위치': ['테디라운지', '터미널'],
      '수령완료': ['수령', '감사합니다'],
      '해외결제': ['일본', '도쿄'],
      '카드차단': ['차단', '되네요'],
      '일본': ['일본', '도쿄'],
      '재설정완료': ['재설정', '활성화'],
      'SMS승인': ['SMS'],
      '알림서비스': ['알림서비스'],
      '설정완료': ['설정완료'],
      '정상사용': ['정상사용'],
      '연회비': ['연회비'],
      '청구': ['청구'],
      '면제': ['면제'],
      '환불': ['환불'],
      '실적충족': ['실적충족'],
      '추가사용': ['추가사용'],
      '이해완료': ['알겠습니다'],
      '안내완료': ['안내완료'],
      '한도증액': ['증액'],
      '신용평가': ['신용평가', '심사'],
      '심사': ['심사'],
      '증액가능': ['증액가능'],
      '700만원': ['700만원'],
      '즉시증액': ['즉시증액'],
      '증액완료': ['증액되었습니다'],
      '사용가능': ['사용가능'],
      '연체': ['연체'],
      '결제지연': ['결제지연'],
      '납부': ['납부'],
      '가상계좌': ['가상계좌'],
      '입금': ['입금'],
      '즉시납부': ['즉시납부'],
      '납부완료': ['납부완료'],
      '신용등급': ['신용등급'],
      '결제일': ['결제일'],
      '변경': ['변경'],
      '급여일': ['급여일'],
      '27일': ['27일'],
      '변경완료': ['변경완료'],
      '다음달적용': ['다음달적용'],
      '적용완료': ['적용완료'],
    };
    
    // ⭐ 모든 Step의 키워드 가져오기 (현재 + 다음 Step 모두)
    const allStepKeywords: string[] = [];
    activeScenario.steps.forEach(step => {
      allStepKeywords.push(...step.keywords.map(k => k.text));
    });
    
    for (let i = displayedSttIndexRef.current; i < sttMessages.length; i++) {
      const sttItem = sttMessages[i];
      
      // ⭐ 현재 통화 시간이 메시지 타임스탬프에 도달하지 않았으면 루프 중단
      if (callTime < sttItem.timestamp) {
        break;
      }
      
      // ⭐ 타임스탬프에 도달했으므로 이 메시지의 모든 단어를 큐에 추가
      const words = sttItem.message.split(' ');
      
      words.forEach((word) => {
        // 키워드인지 확인: 모든 Step의 키워드와 매칭
        let isKeyword = false;
        let matchedKeyword = '';
        
        allStepKeywords.forEach(kw => {
          const mappedWords = keywordMap[kw] || [kw];
          if (mappedWords.some(mapped => word.includes(mapped))) {
            isKeyword = true;
            matchedKeyword = kw;
          }
        });
        
        // 큐에 추가
        wordQueueRef.current.push({
          text: word + ' ',
          isKeyword,
          speaker: sttItem.speaker,
          matchedKeyword,
        });
      });
      
      // 이 메시지를 처리했으므로 인덱스 증가
      displayedSttIndexRef.current = i + 1;
    }
  }, [callTime, isCallActive, activeScenario, currentStep, isSimulationMode, isGuideModeActive, startTimestamp]);

  // ⭐ Phase 3-4: 다단계 카드 시스템 - Step 자동 전환 (비활성화 - STT 키워드 기반 전환으로 대체)
  // 이제 STT에서 실제로 다음 Step의 키워드가 감지될 때만 Step이 전환됩니다.

  // ⭐ 교육 모드: 시나리오 타임라인 처리
  const processScenarioTimeline = (timeline: any[], customerData?: any) => {
    console.log('🎓 시나리오 타임라인 처리 시작:', timeline.length, '개 이벤트');
    
    // ⭐ 고객 정보가 있으면 즉시 설정
    if (customerData) {
      setCustomerInfo(customerData);
      setShowCustomerInfo(true);
      setShowRecentConsultations(true);
      console.log('👤 고객 정보 설정:', customerData.name);
    }
    
    // ⭐ Timeline 이벤트를 순차적으로 실행
    timeline.forEach(event => {
      setTimeout(() => {
        switch (event.type) {
          case 'stt':
            // STT 텍스트 추가
            setSttTexts(prev => [...prev, event.text]);
            console.log('💬 STT 추가:', event.text);
            break;
            
          case 'keyword':
            // 키워드 추가
            setIncomingKeywords(prev => [...prev, event.text]);
            setDisplayedKeywords(prev => [...prev, event.text]);
            setIsKeywordDetected(true);
            console.log('🔑 키워드 추가:', event.text);
            break;
            
          case 'infoCard':
            // 정보 카드 추가
            setCurrentStepCards(prev => [...prev, event.card]);
            console.log('📄 정보 카드 추가:', event.card.title);
            break;
            
          case 'step':
            // Step 전환
            setPreviousStep(currentStep);
            setCurrentStep(event.stepNumber);
            setMaxReachedStep(prev => Math.max(prev, event.stepNumber));
            console.log('📍 Step 전환:', event.stepNumber);
            break;
        }
      }, event.timestamp);
    });
    
    // ⭐ 키워드 추출 완료 (타임라인의 마지막 시간 기준)
    const maxTimestamp = timeline.length > 0 ? Math.max(...timeline.map(e => e.timestamp)) : 0;
    setTimeout(() => {
      setIsExtractingKeywords(false);
      console.log('✅ 키워드 추출 완료');
    }, maxTimestamp + 500);
  };

  // ⭐ 교육 모드: 시나리오 데이터 로드 (Mock API - 나중에 실제 API로 교체)
  const fetchScenarioData = async (scenarioId: string) => {
    console.log('🎓 교육 시나리오 데이터 요청:', scenarioId);
    
    // ⭐ TODO: 실제 백엔드 API로 교체 시 아래 주석 해제하고 Mock 데이터 제거
    /*
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId,
          userId: localStorage.getItem('employeeId') || 'EMP-001',
          mode: 'simulation'
        })
      });
      
      const data = await response.json();
      console.log('🎓 시나리오 데이터 수신:', data);
      
      processScenarioTimeline(data.timeline, data.customerInfo);
      
    } catch (error) {
      console.error('❌ 시나리오 데이터 로드 실패:', error);
      toast.error('교육 시나리오를 불러올 수 없습니다.');
    }
    */
    
    // ⭐ Mock 데이터 (임시 - 백엔드 구현 전까지 사용)
    // activeScenario가 있으면 해당 시나리오 데이터 사용
    if (!activeScenario) {
      console.error('❌ activeScenario가 없습니다.');
      toast.error('시나리오 정보를 찾을 수 없습니다.');
      return;
    }
    
    console.log('🎓 Mock 시나리오 데이터 생성:', activeScenario.category);
    
    // ⭐ Mock 고객 정보 (실제로는 백엔드에서 AI가 생성)
    const mockCustomerData = {
      id: 'CUST-SIM-001',
      name: '김철수',
      phone: '010-9876-5432',
      birthDate: '1990-05-20',
      address: '서울시 강남구 테헤란로 456',
      cardName: '테디 프리미엄 카드',
      cardNumber: '1234-5678-****-****',
      cardIssueDate: '2023-01-15',
      cardExpiryDate: '2028-01-31',
    };
    
    // ⭐ Mock Timeline (실제로는 백엔드에서 AI TTS + RAG로 생성)
    // Step 1 데이터 사용
    const step1Data = activeScenario.steps[0];
    const mockTimeline = [
      // STT 텍스트 (AI TTS 시뮬레이션)
      { timestamp: 1000, type: 'stt', text: '안녕하세요.' },
      { timestamp: 2500, type: 'stt', text: step1Data.customerDialog },
      
      // 키워드 추출 (순차적)
      ...step1Data.keywords.map((kw, idx) => ({
        timestamp: 4000 + (idx * 800),
        type: 'keyword',
        text: kw.text
      })),
      
      // 정보 카드 (RAG 검색 결과 시뮬레이션)
      ...step1Data.cards.map((card, idx) => ({
        timestamp: 6000 + (idx * 1200),
        type: 'infoCard',
        card: card
      }))
    ];
    
    console.log('🎓 Mock Timeline 생성 완료:', mockTimeline.length, '개 이벤트');
    
    // ⭐ 타임라인 실행
    processScenarioTimeline(mockTimeline, mockCustomerData);
  };

  const handleStartCall = async () => {
    // ⭐ 이미 통화 중이면 무시 (복원된 통화 보호)
    if (isCallActive) {
      console.log('📞 이미 통화 중 - handleStartCall 무시');
      return;
    }
    
    // ⭐🚨 가이드 모드일 때 다이렉트 콜 차단 (단, 시나리오가 선택된 경우는 허용)
    if (isGuideModeActive && isSimulationMode && !activeScenario) {
      console.log('🚫 가이드 모드: 다이렉트 콜 차단 → 대기콜 선택 유도');
      setShowDirectCallBlockModal(true);
      return;
    }
    
    // ⭐ 다이렉트 인입 플래그 설정
    setIsDirectIncoming(true);
    
    if (isSimulationMode) {
      console.log('🎓 교육 모드: 다이렉트 콜 시작 (백엔드 연동 대기)');
    } else {
      console.log('📞 실제 상담: 다이렉트 인입 (통화 버튼 직접 클릭)');
    }
    
    // ⭐ localStorage 초기화 (새 통화만)
    localStorage.removeItem('clickedDocuments');
    localStorage.removeItem('currentConsultationMemo');
    localStorage.removeItem('consultationCallTime');
    localStorage.removeItem('referencedDocuments');
    localStorage.removeItem('consultationMemo');
    localStorage.removeItem('activeCallState'); // ⭐ 이전 통화 상태 완전 삭제
    localStorage.removeItem('searchHistory'); // ⭐ 검색 이력 초기화
    
    // ⭐ 새 통화 시작 - 복원 플래그 해제
    setIsRestoredCall(false);
    
    // ⭐ 즉시 초기화 - 빈 상태로 시작
    setDisplayedKeywords([]);
    setIncomingKeywords([]);
    setMemo('');
    setIsExtractingKeywords(false);
    setIsKeywordDetected(false);
    setShowNextStepCards(false);
    setShowCustomerInfo(false);
    setShowRecentConsultations(false);
    
    // 상태 초기화
    setIsCallActive(true);
    setIsIncomingCall(false);
    setCallTime(0);
    setConsultationStartTime(''); // ⭐ 이전 시간 초기화
    setStartTimestamp(0); // ⭐ 타임스탬프 초기화
    setSearchHistory([]); // ⭐ 검색 이력 초기화
    setIsSearching(false); // ⭐ 검색 상태 초기화

    await startRecording(); 
    console.log("통화 및 녹음 시작");
    
    // ⭐ 통화 시작 타임스탬프 설정 (고정값)
    const nowTimestamp = Date.now();
    setStartTimestamp(nowTimestamp);
    console.log('🕐 통화 시작 타임스탬프 설정:', nowTimestamp, '→ 0초부터 시작');
    
    // ⭐ Phase 13: 통화 시작 시 고객 정보 섹션 열기
    setIsLeftSidebarCollapsed(false);
    
    // ⭐ 큐 초기화
    wordQueueRef.current = [];
    isProcessingQueueRef.current = false;
    
    // ⭐ STT 초기화
    setSttTexts([]);
    displayedSttIndexRef.current = 0;
    
    // ⭐ 상담 시작 시간 기록
    const now = new Date(nowTimestamp);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    setConsultationStartTime(`${year}-${month}-${day} ${hour}:${minute}`);
    
    // ⭐ 교육 모드: 시나리오 데이터 로드 (백엔드 API)
    if (isSimulationMode) {
      setIsExtractingKeywords(true);
      console.log('🎓 교육 모드: 다이렉트 콜 시작 (시나리오 데이터 로드)');
      
      // ⭐ 시나리오 ID 가져오기
      const scenarioId = activeScenario?.id || location.state?.scenarioId || 'SIM-001';
      
      // ⭐ 백엔드 API 호출 (현재는 Mock)
      fetchScenarioData(scenarioId);
      return;
    }
    
    // ⭐ 실제 상담 모드: 다이렉트 인입 시 키워드 추출 중 상태만 표시
    if (isDirectIncoming) {
      setIsExtractingKeywords(true);
      console.log('📞 실제 상담: 다이렉트 인입 (백엔드 연동 대기)');
      // TODO: 백엔드 API 연동하여 실시간 STT, 키워드 추출, 정보 카드 로드
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(guidanceScript);
  };

  // ⭐ 드래그 시작 - Step 전환용
  const handleStepDragStart = (e: React.MouseEvent, container: 'current' | 'next') => {
    isDraggingRef.current = true;
    startXRef.current = e.pageX;
    dragDistanceRef.current = 0;
    activeContainerRef.current = container;
    e.currentTarget.style.cursor = 'grabbing';
  };

  // ⭐ 드래그 중 - Step 전환용
  const handleStepDragMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const distance = e.pageX - startXRef.current;
    dragDistanceRef.current = distance;
  };

  // ⭐ 드래그 종료 - Step 전환용
  const handleStepDragEnd = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    activeContainerRef.current = null;
    e.currentTarget.style.cursor = 'grab';
    
    const threshold = 100; // 100px 이상 드래그하면 Step 전환
    
    if (Math.abs(dragDistanceRef.current) > threshold && activeScenario) {
      // 우→좌 드래그 (dragDistance > 0): 이전 Step으로 이동
      if (dragDistanceRef.current > 0 && currentStep > 1) {
        setPreviousStep(currentStep);
        setCurrentStep(currentStep - 1);
        
        // 이전 Step으로 이동 시 키워드는 즉시 전체 표시 (애니메이션 스킵)
        const prevStepData = activeScenario.steps[currentStep - 2]; // currentStep은 아직 업데이트 안됨
        if (prevStepData) {
          const prevStepKeywords = prevStepData.keywords.map(k => k.text);
          setIncomingKeywords(prevStepKeywords);
          setDisplayedKeywords(prevStepKeywords); // 즉시 전체 표시
          setIsExtractingKeywords(false); // 추출 완료 상태
        }
      } 
      // 좌→우 드래그 (dragDistance < 0): 다음 Step으로 이동 (이미 도달한 Step까지만)
      else if (dragDistanceRef.current < 0 && currentStep < maxReachedStep) {
        setPreviousStep(currentStep);
        setCurrentStep(currentStep + 1);
        
        // 이미 도달한 Step으로 이동하므로 키워드 즉시 전체 표시
        const nextStepData = activeScenario.steps[currentStep]; // currentStep은 아직 업데이트 안됨
        if (nextStepData) {
          const nextStepKeywords = nextStepData.keywords.map(k => k.text);
          setIncomingKeywords(nextStepKeywords);
          setDisplayedKeywords(nextStepKeywords); // 즉시 전체 표시
          setIsExtractingKeywords(false); // 추출 완료 상태
        }
      }
    }
    
    dragDistanceRef.current = 0;
  };

  // ⭐ Progress bar 클릭 핸들러
  const handleProgressClick = (stepIndex: number) => {
    if (!activeScenario) return;
    
    const targetStep = stepIndex + 1; // stepIndex는 0부터 시작, currentStep은 1부터 시작
    
    // 아직 도달하지 않은 Step은 클릭 불가 (STT 키워드로만 전환 가능)
    if (targetStep > maxReachedStep) return;
    
    // 같은 Step 클릭 시 아무 작업 안함
    if (targetStep === currentStep) return;
    
    // 이미 도달한 Step으로 이동
    setPreviousStep(currentStep);
    setCurrentStep(targetStep);
    
    // 이미 도달한 Step이므로 키워드는 즉시 전체 표시 (애니메이션 스킵)
    const targetStepData = activeScenario.steps[stepIndex];
    if (targetStepData) {
      const targetStepKeywords = targetStepData.keywords.map(k => k.text);
      setIncomingKeywords(targetStepKeywords);
      setDisplayedKeywords(targetStepKeywords); // 즉시 전체 표시
      setIsExtractingKeywords(false); // 추출 완료 상태
    }
  };

  const handleEndCallClick = () => {
    // 통화 종료 확인 모달 열기
    setIsEndCallModalOpen(true);
  };

  const handleConfirmEndCall = () => {
    // ⭐ 복원 플래그 해제
    setIsRestoredCall(false);
    stopRecording();
    
    // 메모를 localStorage에 저장하고 후처리로 이동
    if (memo.trim()) {
      localStorage.setItem('currentConsultationMemo', memo);
    }
    localStorage.setItem('consultationCallTime', callTime.toString());
    
    // ⭐ Phase 8-1: 참조 문서 저장
    if (activeScenario) {
      const referencedDocs: Array<{
        stepNumber: number;
        documentId: string;
        title: string;
        used: boolean;
      }> = [];
      
      // 각 Step별로 현재 상황 관련 정보 카드만 저장 (최대 도달한 Step까지)
      for (let i = 0; i < maxReachedStep; i++) {
        const stepData = activeScenario.steps[i];
        if (stepData) {
          // ⭐ currentSituationCards만 저장하되, analysis-report는 제외 (우리가 분석한 내용이므로 참조 문서가 아님)
          stepData.currentSituationCards.forEach(card => {
            // documentType이 'analysis-report'가 아닌 실제 문서만 저장
            if (card.documentType !== 'analysis-report') {
              referencedDocs.push({
                stepNumber: stepData.stepNumber,
                documentId: card.id,
                title: card.title,
                used: true  // 표시된 카드는 모두 사용된 것으로 간주
              });
            }
          });
        }
      }
      
      // ⭐ 검색된 문서도 참조 문서로 추가
      // searchHistory에서 실제 카드 정보 가져오기 (ID만이 아니라)
      const currentSearchHistory = getSearchHistory();
      currentSearchHistory.forEach(historyItem => {
        historyItem.results.forEach(card => {
          // 중복 방지 (이미 referencedDocs에 있으면 스킵)
          if (!referencedDocs.some(doc => doc.documentId === card.id)) {
            referencedDocs.push({
              stepNumber: 0, // 검색 문서는 Step 0으로 표시
              documentId: card.id,
              title: card.title, // 실제 카드 제목 사용
              used: true
            });
          }
        });
      });
      
      localStorage.setItem('referencedDocuments', JSON.stringify(referencedDocs));
      localStorage.setItem('currentScenarioCategory', activeScenario.category);
    }
    
    setIsCallActive(false);
    setIsEndCallModalOpen(false);
    setStartTimestamp(0); // ⭐ 타임스탬프 초기화
    
    // ⭐ 큐 초기화
    wordQueueRef.current = [];
    isProcessingQueueRef.current = false;
    
    // ⭐ 가이드 모드 연속성: Phase 3 완료 플래그 제거 (후처리에서 자동 시작 가능하도록)
    if (isGuideModeActive) {
      localStorage.removeItem('tutorial-phase3-completed');
      console.log('🎓 가이드 모드: Phase 3 완료 플래그 제거 → 후처리에서 자동 시작');
    }
    
    // ⭐ Phase 8-3: Frontend 데이터 생성 및 저장
    const employeeId = localStorage.getItem('employeeId') || 'EMP-001';
    const consultationId = generateConsultationId(employeeId);
    
    // ⭐ 저장된 시작 시간 사용 (없으면 현재 시간 - 방어 코드)
    let datetime = consultationStartTime;
    if (!datetime) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hour = String(now.getHours()).padStart(2, '0');
      const minute = String(now.getMinutes()).padStart(2, '0');
      datetime = `${year}-${month}-${day} ${hour}:${minute}`;
    }
    
    const frontendData = {
      consultationId,
      employeeId,
      customerId: customerInfo.id,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      category: activeScenario?.category || '일반문의',
      datetime,
      callTime,
      memo: memo.trim(),
      // ⭐ 교육 모드 플래그 추가 (백엔드 전송 시 통계 제외용)
      isSimulation: isSimulationMode,
    };
    localStorage.setItem('pendingConsultation', JSON.stringify(frontendData));
    console.log('📝 Frontend 데이터 저장 (새 형식):', frontendData);
    
    // ⭐ Phase 8-3: 로딩 페이지로 이동
    navigate('/loading', { state: { consultationId, estimatedTime: 5 } });
    
    // ⭐ 통화 종료 - activeCallState 삭제
    localStorage.removeItem('activeCallState');
    console.log('📞 통화 종료 - activeCallState 삭제');
    
    // ⭐ 교육 모드 sessionStorage는 후처리 완료 후 삭제 (LoadingPage와 AfterCallWorkPage에서 읽어야 하므로)
    // sessionStorage 정리는 AfterCallWorkPage의 저장 완료 시점에서 처리
    
    // ⭐ Mock LLM 응답 (12초 후 - 로딩 페이지 10초 + 여유 2초)
    setTimeout(() => {
      const llmData = {
        title: '카드 분실 신고 및 재발급 처리',
        status: '완료',
        aiSummary: '문의사항: 고객이 카드를 분실하여 즉시 사용 정지 및 재발급 요청\n\n처리 결과: 카드 사용 즉시 정지 처리 완료. 재발급 카드 신청 접수하였으며, 등록된 주소(서울시 강남구 테헤란로 123)로 3-5일 내 배송 예정. 고객에게 배송 추적 안내 완료.',
        followUpTasks: '',
        handoffDepartment: '없음',
        handoffNotes: '',
      };
      localStorage.setItem('llmAnalysisResult', JSON.stringify(llmData));
      window.dispatchEvent(new CustomEvent('llmAnalysisComplete', { detail: llmData }));
      console.log('🤖 LLM 분석 완료 (Mock):', llmData);
    }, 12000);
  };

  const handleCancelEndCall = () => {
    setIsEndCallModalOpen(false);
  };

  // ⭐ 카드 타임스탬프 캐싱 헬퍼 (처음 표시될 때만 생성, 이후 재사용)
  const getCardWithTimestamp = (card: ScenarioCard): ScenarioCard => {
    if (!cardTimestampsRef.current[card.id]) {
      // 처음 보는 카드 → 타임스탬프 생성 및 저장
      const cardWithTimestamp = addTimestampToCard(card);
      cardTimestampsRef.current[card.id] = {
        timestamp: cardWithTimestamp.timestamp!,
        displayTime: cardWithTimestamp.displayTime!
      };
    }
    // 저장된 타임스탬프 재사용
    return {
      ...card,
      timestamp: cardTimestampsRef.current[card.id].timestamp,
      displayTime: cardTimestampsRef.current[card.id].displayTime
    };
  };

  // ⭐ Phase 8-1: 문서 클릭 추적 핸들러
  const handleCardClick = (card: ScenarioCard) => {
    setSelectedDetailCard(card);
    
    // ⭐ 교육 모드에서는 뷰 카운트(클릭 추적)를 저장하지 않음
    if (isSimulationMode) return;
    
    // localStorage에서 클릭된 문서 ID 목록 가져오기
    const clickedDocsStr = localStorage.getItem('clickedDocuments');
    let clickedDocs: string[] = [];
    
    if (clickedDocsStr) {
      try {
        clickedDocs = JSON.parse(clickedDocsStr);
      } catch (error) {
        console.error('클릭된 문서 파싱 오류:', error);
      }
    }
    
    // 중복 제거하고 맨 앞에 추가
    clickedDocs = clickedDocs.filter(id => id !== card.id);
    clickedDocs.unshift(card.id);
    
    // localStorage에 저장
    localStorage.setItem('clickedDocuments', JSON.stringify(clickedDocs));
  };

  const handleSaveMemo = () => {
    if (!memo.trim()) return;
    
    setSaveStatus('saving');
    
    // 메모 저장 (localStorage)
    localStorage.setItem('currentConsultationMemo', memo);
    
    // 저장 완료 표시 (1.5초 후 idle로 복귀)
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 500);
  };

  // 새로운 handleSearch 함수 (라인 1789-1816을 이것으로 교체)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const query = searchQuery.trim();
    
    try {
      const result = await simulateSearch(query);
      
      if (isCallActive && result.cards.length > 0) {
        const historyItem = saveSearchHistory(result);
        setSearchHistory(getSearchHistory());
        
        // ⭐ 검색 시 자동으로 검색 이력 펼치기
        setIsSearchHistoryOpen(true);
        
        // ⭐ 현재 세션의 검색 문서 추적 (중복 제거)
        const newDocumentIds = result.cards.map(card => card.id);
        setSearchedDocuments(prev => {
          const uniqueIds = Array.from(new Set([...prev, ...newDocumentIds]));
          return uniqueIds;
        });
        
        console.log(`🔍 검색 완료: "${query}" (${result.cards.length}건, ${result.accuracy}% 매칭, ${result.searchTime}ms)`);
      } else if (result.cards.length === 0) {
        console.log(`🔍 검색 결과 없음: "${query}"`);
      }
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
    } finally {
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  // 대기 콜 클릭 시 통화 연결
  const handleCallConnect = (category: string) => {
    if (isCallActive) {
      toast.warning('이미 통화 중입니다.', {
        description: '현재 통화를 종료한 후 다시 시도해주세요.',
        duration: 2000,
      });
      return;
    }
    
    // ⭐🚨 교육 모드(가이드 아닌)일 때 대기콜 차단
    if (isSimulationMode && !isGuideModeActive) {
      console.log('🚫 교육 모드: 대기콜 차단 → 다이렉트 콜 유도');
      setShowWaitingCallBlockModal(true);
      return;
    }
    
    // ⭐ 대기 콜 선택 시: 다이렉트 인입 아님
    setIsDirectIncoming(false);
    
    // ⭐ 새 통화 시작 - 복원 플래그 해제
    setIsRestoredCall(false);

    // ⭐ Phase 8-1: 새 상담 시작 시 localStorage 초기화 (클릭 추적 등)
    localStorage.removeItem('clickedDocuments');
    localStorage.removeItem('currentConsultationMemo');
    localStorage.removeItem('consultationCallTime');
    localStorage.removeItem('referencedDocuments');
    localStorage.removeItem('currentScenarioCategory');
    localStorage.removeItem('consultationMemo');
    localStorage.removeItem('activeCallState'); // ⭐ 이전 통화 상태 완전 삭제
    
    // ⭐ 검색 이력 및 검색 문서 초기화
    clearSearchHistory();
    setSearchHistory([]);
    setSearchedDocuments([]);
    
    console.log('🔄 새 상담 시작: localStorage 초기화 완료');

    // ⭐ 즉시 초기화 (React 배치 업데이트 방지)
    setDisplayedKeywords([]);
    setIncomingKeywords([]);
    setMemo('');
    setIsExtractingKeywords(false);
    setIsKeywordDetected(false);
    setShowNextStepCards(false);
    setShowCustomerInfo(false);
    setShowRecentConsultations(false);
    
    // ⭐ Phase 13: 대기콜 연결 시 고객 정보 섹션 열기
    setIsLeftSidebarCollapsed(false);
    
    // ⭐ Phase 3-2: STT 초기화
    setSttTexts([]);
    displayedSttIndexRef.current = 0;

    // ⭐ Phase 3: 시나리오 로드
    const scenario = getScenarioByCategory(category);
    if (scenario) {
      setActiveScenario(scenario);
      setPreviousStep(0); // 이전 스텝 초기화
      setCurrentStep(1); // Step 1 시작
      setMaxReachedStep(1); // 최대 도달 Step은 Step 1
      
      // 고객 정보 변경 (즉시 변경, 표시는 타이머로)
      setCustomerInfo({
        id: scenario.customer.id,
        name: scenario.customer.name,
        phone: scenario.customer.phone,
        birthDate: scenario.customer.birthDate || '1990-03-15',
        address: scenario.customer.address || '서울시 강남구 테헤란로 123',
        cardName: scenario.customer.cardName,
        cardNumber: scenario.customer.cardNumber,
        cardIssueDate: scenario.customer.cardIssueDate,
        cardExpiryDate: scenario.customer.cardExpiryDate,
      });
      
      // 최근 상담 내역 변경
      setRecentConsultations(
        scenario.recentConsultations.map((consult, idx) => ({
          id: idx + 1,
          title: consult.content,
          date: consult.date,
          category: consult.category,
          status: '완료',
        }))
      );
      
      // Step 1의 키워드 설정 (STT에서 실시간으로 감지하므로 빈 배열로 시작)
      const step1Keywords = scenario.steps[0].keywords.map(k => k.text);
      setIncomingKeywords(step1Keywords);
      setDisplayedKeywords([]); // 빈 배열로 시작 - STT에서 실시간 감지
      setIsExtractingKeywords(true); // 키워드 추출 중 상태
      
      // ⭐ Phase 3-1.5: 순차적 등장 애니메이션
      // 1. 고객 정보 표시 (500ms 후)
      setTimeout(() => {
        setShowCustomerInfo(true);
      }, 500);
      
      // 2. 최근 상담 내역 표시 (1000ms 후)
      setTimeout(() => {
        setShowRecentConsultations(true);
      }, 1000);
    } else {
      // 시나리오가 없는 경우 기본값 (기존 로직)
      setIncomingKeywords(incomingKeywordsByCase[category] || []);
      setDisplayedKeywords([]); // 빈 배열로 시작 - STT에서 실시간 감지
      setIsExtractingKeywords(true); // 키워드 추출 중 상태
      
      // 기본값도 순차 표시
      setTimeout(() => {
        setShowCustomerInfo(true);
      }, 500);
      setTimeout(() => {
        setShowRecentConsultations(true);
      }, 1000);
    }

    // ⭐ 인입 케이스 설정
    setCurrentCase(category);

    // 상태 초기화
    setIsKeywordDetected(false);
    setShowNextStepCards(false);

    // 통화 시작
    setIsCallActive(true);
    setCallTime(0);
    setStartTimestamp(0); // ⭐ 타임스탬프 초기화
    
    // ⭐ 통화 시작 타임스탬프 설정 (고정값)
    const nowTimestamp = Date.now();
    setStartTimestamp(nowTimestamp);
    console.log('🕐 통화 시작 타임스탬프 설정 (대기콜):', nowTimestamp, '→ 0초부터 시작');
    
    // ⭐ 상담 시작 시간 기록
    const now = new Date(nowTimestamp);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    setConsultationStartTime(`${year}-${month}-${day} ${hour}:${minute}`);

    // 해당 카테고리 count -1
    setWaitingCalls(prev =>
      prev.map(call =>
        call.category === category && call.count > 0
          ? { ...call, count: call.count - 1 }
          : call
      )
    );

    // 총 대기 콜 수 업데이트
    setTotalWaitingCalls(prev => Math.max(0, prev - 1));

    // ⭐ 교육 모드: Phase 1 튜토리얼 완료 및 Phase 2 시작 (대기 콜 클릭 시)
    if (isSimulationMode && tutorialPhase === 1 && isTutorialActive) {
      console.log('🎓 대기 콜 클릭 → Phase 1 튜토리얼 자동 완료');
      localStorage.setItem('tutorial-phase1-completed', 'true');
      setIsTutorialActive(false);
    }
    
    // ⭐ 교육 모드: Phase 2 시작
    if (isSimulationMode && scenario) {
      const phase2Completed = localStorage.getItem('tutorial-phase2-completed');
      
      if (!phase2Completed) {
        console.log('🎓 Phase 2 튜토리얼 시작 예정 (0.8초 후)');
        setTutorialPhase(2);
        setCurrentTutorialSteps(tutorialStepsPhase2);
        setTimeout(() => {
          console.log('✅ Phase 2 튜토리얼 활성화');
          setIsTutorialActive(true);
        }, 800);
      }
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <MainLayout>
      {/* ⭐ Theme & Animation Styles */}
      <style>{`
        :root {
          --theme-primary: ${themePrimary};
          --theme-primary-hover: ${themePrimaryHover};
          --theme-secondary: ${themeSecondary};
          --theme-border: ${themeBorder};
          --theme-text: ${themeText};
        }

        /* Helper Classes for Dynamic Theme */
        .bg-theme-primary { background-color: var(--theme-primary) !important; }
        .text-theme-primary { color: var(--theme-text) !important; }
        .border-theme-primary { border-color: var(--theme-border) !important; }
        .hover-bg-theme-primary:hover { background-color: var(--theme-primary-hover) !important; }
        
        @keyframes wave-pulse {
          0% {
            box-shadow: 0 0 0 0 ${isSimulationMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 71, 171, 0.1)'}, 
                        0 0 0 0 ${isSimulationMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 71, 171, 0.1)'};
          }
          40% {
            box-shadow: 0 0 0 10px rgba(0, 71, 171, 0), 
                        0 0 0 0 ${isSimulationMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 71, 171, 0.1)'};
          }
          80% {
            box-shadow: 0 0 0 10px rgba(0, 71, 171, 0), 
                        0 0 0 20px rgba(0, 71, 171, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 71, 171, 0), 
                        0 0 0 20px rgba(0, 71, 171, 0);
          }
        }
        .animate-wave-pulse {
          animation: wave-pulse 2.5s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }
      `}</style>
      
      {/* ⭐ Simulation Mode Watermark & Border - REMOVED per user feedback */}

      {/* 폴딩 버튼 - MainLayout 바로 아래, 메인 컨테이너 밖에 위치 */}
      <button
        onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
        className="hidden lg:flex fixed top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-[#D1D5DB] text-[#666666] rounded-full items-center justify-center hover:border-[#0047AB] hover:text-[#0047AB] hover:shadow-md transition-all duration-300 shadow-lg"
        style={{ 
          marginTop: '30px',
          left: `${
            (isSidebarExpanded ? 200 : 56) + (isLeftSidebarCollapsed ? -12 : 200 - 12)
          }px`,
          zIndex: 60
        }}
      >
        <ChevronLeft 
          className={`w-3.5 h-3.5 transition-transform duration-300 ${
            isLeftSidebarCollapsed ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div 
        className="flex bg-[#F5F5F5] fixed top-[60px] right-0 bottom-0 overflow-hidden transition-all duration-300"
        style={{ 
          left: `${isSidebarExpanded ? 200 : 56}px`
        }}
      >


        {/* 모바일/태블릿 탭 네비게이션 (lg 미만에서만 표시) */}
        <div className="lg:hidden fixed top-[60px] left-0 right-0 bg-white border-b border-[#E0E0E0] z-[40]">
          {/* 통화 상태 표시 (통화 중일 때만) */}
          {isCallActive && (
            <div className="bg-gradient-to-r from-[#34A853] to-[#2E7D32] text-white px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs font-bold">통화 중</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold tabular-nums">{formatTime(callTime)}</span>
                <button 
                  onClick={handleEndCallClick}
                  className="w-7 h-7 bg-[#EA4335] rounded-lg flex items-center justify-center hover:bg-[#C62828] transition-all"
                  title="통화 종료"
                >
                  <PhoneOff className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          )}
          
          {/* 탭 버튼들 */}
          <div className="flex">
            <button
              onClick={() => setMobileTab('customer')}
              className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
                mobileTab === 'customer'
                  ? 'text-[#0047AB] border-b-2 border-[#0047AB] bg-[#F8FBFF]'
                  : 'text-[#666666] hover:text-[#333333] hover:bg-[#F5F5F5]'
              }`}
            >
              고객정보
            </button>
            <button
              onClick={() => setMobileTab('consultation')}
              className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
                mobileTab === 'consultation'
                  ? 'text-[#0047AB] border-b-2 border-[#0047AB] bg-[#F8FBFF]'
                  : 'text-[#666666] hover:text-[#333333] hover:bg-[#F5F5F5]'
              }`}
            >
              상담내용
            </button>
            <button
              onClick={() => setMobileTab('control')}
              className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
                mobileTab === 'control'
                  ? 'text-[#0047AB] border-b-2 border-[#0047AB] bg-[#F8FBFF]'
                  : 'text-[#666666] hover:text-[#333333] hover:bg-[#F5F5F5]'
              }`}
            >
              메모/검색
            </button>
          </div>
        </div>

        {/* 좌측 열 - 고객정보 (데스크톱: 조건부 표시, 모바일: 탭 전환) */}
        <div 
          className={`
            bg-[#FAFAFA] border-r border-[#E0E0E0] flex flex-col min-h-0 transition-all duration-300 relative
            ${mobileTab === 'customer' ? 'flex' : 'hidden lg:flex'}
            ${isLeftSidebarCollapsed ? 'lg:w-0' : 'lg:w-[200px]'}
            w-full ${isCallActive ? 'mt-[89px]' : 'mt-[49px]'} lg:mt-0
            h-full overflow-hidden
          `}
        >
          <div className={`w-full lg:w-[200px] p-3 flex flex-col min-h-0 h-full overflow-y-auto ${isLeftSidebarCollapsed ? 'lg:opacity-0' : 'lg:opacity-100'}`}>
            {/* ⭐ 고객 정보 전체 영역 (고객 정보 + 고객 특성 + 최근 상담 내역 모두 포함) */}
            <div id="customer-info-card" className="flex-shrink-0">
              {/* 고객 정보 - Phase 10-5: 2열 레이아웃 + 나이 표시 */}
              {showCustomerInfo && (
                <div className="animate-[slideInFromTop_0.5s_ease-out] mb-3">
                <h3 className="text-xs font-bold text-[#333333] mb-2">
                  {isSimulationMode ? '가상 고객 정보' : '고객 정보'}
                </h3>
                <div className="bg-white rounded-lg border border-[#E0E0E0] p-2.5">
                  <div className="space-y-1 text-[10px]">
                    <div className="flex items-center gap-0.5">
                      <span className="font-medium text-[#333333] w-11 shrink-0">이름:</span>
                      <div className="-ml-0.75">
                        {USE_CUSTOMER_MASKING ? (
                          <InlineMaskedText
                            originalText={customerInfo.name}
                            maskedText={maskName(customerInfo.name)}
                            duration={3000}
                          />
                        ) : (
                          <span className="text-[#666666]">{customerInfo.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="font-medium text-[#333333] w-11 shrink-0">전화:</span>
                      <div className="-ml-0.75">
                        {USE_CUSTOMER_MASKING ? (
                          <InlineMaskedText
                            originalText={customerInfo.phone}
                            maskedText={maskPhone(customerInfo.phone)}
                            duration={3000}
                          />
                        ) : (
                          <span className="text-[#666666]">{customerInfo.phone}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="font-medium text-[#333333] w-11 shrink-0">생년월일:</span>
                      <span className="text-[#666666] text-[10px] truncate -ml-0.75">{customerInfo.birthDate ? formatBirthDateWithAge(customerInfo.birthDate) : '-'}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="font-medium text-[#333333] w-11 shrink-0">주소:</span>
                      <span className="text-[#666666] text-[10px] truncate -ml-0.75" title={customerInfo.address}>{customerInfo.address || '-'}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="font-medium text-[#333333] w-11 shrink-0">소지카드:</span>
                      <span className="text-[#666666] text-[10px] truncate -ml-0.75">{customerInfo.cardName || '-'}</span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="font-medium text-[#333333] w-11 shrink-0">카드번호:</span>
                      <span className="text-[#666666] text-[10px] break-all leading-[1.3] -ml-0.75">{customerInfo.cardNumber || '-'}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="font-medium text-[#333333] w-11 shrink-0">발급일:</span>
                      <span className="text-[#666666] text-[10px] -ml-0.75">{customerInfo.cardIssueDate || '-'}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="font-medium text-[#333333] w-11 shrink-0">만료일:</span>
                      <span className="text-[#666666] text-[10px] -ml-0.75">{customerInfo.cardExpiryDate || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ⭐ Phase 9: 고객 특성 가이드 - 고객 정보 바로 아래 표시 */}
            {showCustomerInfo && activeScenario && activeScenario.customer.traits && activeScenario.customer.traits.length > 0 && (
              <div className="flex-shrink-0 animate-[slideInFromTop_0.5s_ease-out] mt-3">
                <h3 className="text-xs font-bold text-[#333333] mb-2">
                  {isSimulationMode ? '가상 고객 특성 가이드' : '고객 특성 가이드'}
                </h3>
                
                <div className="bg-white rounded-md border border-[#E0E0E0] p-2.5">
                  {/* 태그 표시 - 최대 4개, 2열 그리드 */}
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {activeScenario.customer.traits.slice(0, 4).map((trait, index) => {
                      const colors = getTraitColor(trait);
                      return (
                        <span
                          key={index}
                          className="px-2 py-0.5 rounded text-[10px] font-medium text-center"
                          style={{ 
                            backgroundColor: colors.bg,
                            color: colors.text
                          }}
                        >
                          {trait}
                        </span>
                      );
                    })}
                  </div>

                  {/* 상담 가이드 */}
                  <p className="text-[11px] text-[#333333] leading-relaxed">
                    {activeScenario.customer.preferredStyle || 
                     `${getCustomerTraitSummary(activeScenario.customer)} 특성이 있습니다.`}
                  </p>
                </div>
              </div>
            )}

            {/* 최근 상담 내역 - Phase 3-1.5: 고객 정보 후 등장 */}
            {showRecentConsultations && (
              <div className="flex-shrink-0 animate-[slideInFromTop_0.5s_ease-out] mt-3">
                <h3 className="text-xs font-bold text-[#333333] mb-2">
                  {isSimulationMode ? '가상 최근 상담 내역' : '최근 상담 내역'}
                </h3>
                <div className="space-y-2">
                  {recentConsultations.map((item) => (
                    <div 
                      key={item.id}
                      className={`bg-white rounded-md p-2 cursor-pointer hover:bg-[#F8F9FA] border-l-3 ${
                        item.status === '완료' ? 'border-l-[#34A853]' : 'border-l-[#4A90E2]'
                      }`}
                      style={{ borderLeftWidth: '3px' }}
                    >
                      <div className="text-[11px] text-[#333333] line-clamp-2 mb-1 leading-relaxed">{item.title}</div>
                      <div className="text-[10px] text-[#999999] mb-1">{item.date}</div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#E8F1FC] text-[#0047AB] rounded">
                        {item.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>{/* customer-info-card 영역 종료 */}
          </div>
        </div>

        {/* 중앙 열 - 동적 너비 (데스크톱: 동적, 모바일: 탭 전환) */}
        <div className={`
          bg-white p-5 transition-all duration-300 flex flex-col min-h-0
          ${mobileTab === 'consultation' ? 'flex' : 'hidden lg:flex'}
          ${isLeftSidebarCollapsed ? 'lg:w-[calc(75%-0px)]' : 'lg:w-[calc(75%-200px)]'}
          w-full ${isCallActive ? 'mt-[89px]' : 'mt-[49px]'} lg:mt-0
          h-full overflow-y-auto
        `}>
          {/* ⭐ 대기 중 UI */}
          {!isCallActive && (
            <div className="flex flex-col h-full relative">
              {/* ⭐ 교육 모드(가이드 아닌): "통화 연결중" 표시 */}
              {isSimulationMode && !isGuideModeActive && (
                <div id="scenario-selector" className="flex-shrink-0 mb-4 relative z-10">
                  <div className="bg-gradient-to-r from-[#10B981] to-[#059669] rounded-lg p-4 shadow-lg border-2 border-[#10B981] animate-pulse">
                    <div className="flex items-center justify-center gap-3">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-8 h-8 bg-white/30 rounded-full animate-ping"></div>
                        <div className="relative w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <Phone className="w-3 h-3 text-[#10B981]" />
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-base font-bold text-white mb-1">🎓 교육 시나리오 대기중</h3>
                        <p className="text-xs text-white/90">
                          우측 상단 <strong>통화 버튼</strong>을 클릭하여 교육을 시작하세요
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ⭐ 상담 시작 안내 - 절대 위치로 화면 전체 중앙 고정 (배너와 무관) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center max-w-md pointer-events-auto">
                  {/* ⭐ 교육 모드: 무조건 "통화 연결 중" 표시 */}
                  {(isSimulationMode && !isGuideModeActive) || isIncomingCall ? (
                    <>
                      <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <Phone className="w-9 h-9 text-white animate-bounce" />
                      </div>
                      <h2 className="text-2xl font-bold text-[#10B981] mb-4">통화 연결 중</h2>
                      <p className="text-base text-[#666666] mb-2">고객의 전화가 연결되고 있습니다</p>
                      <p className="text-base text-[#666666]">통화 버튼을 클릭하여 응대를 시작하세요</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-[#0047AB] to-[#003580] rounded-full flex items-center justify-center shadow-lg animate-wave-flow">
                        <Phone className="w-9 h-9 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-[#0047AB] mb-4">상담 대기 중</h2>
                      <p className="text-base text-[#666666] mb-2">통화 시작 버튼을 클릭하여 상담을 시작하세요</p>
                      <p className="text-base text-[#666666]">대기 시간이 긴 고객을 우선 응대해주세요</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 인입 키워드 + 상담 안내 멘트 - flex 레이아웃 */}
          {isCallActive && (
            <div 
              className="mb-4 flex gap-4 items-start"
              style={{
                animation: 'fadeInSmooth 0.6s ease-out both'
              }}
            >
              {/* 좌측: 인입 키워드 (고정 너비) */}
              <div id="keyword-area" className="flex-shrink-0" style={{ width: '240px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xs font-bold text-[#333333]">인입 키워드</h3>
                  {isCallActive && displayedKeywords.length < 3 && (
                    <span className="text-[10px] text-[#666666] flex items-center gap-1">
                      <span className="inline-block w-1 h-1 bg-[#0047AB] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                      <span className="inline-block w-1 h-1 bg-[#0047AB] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="inline-block w-1 h-1 bg-[#0047AB] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                      <span>키워드 추출 중</span>
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {displayedKeywords.slice(0, 3).map((keyword, index) => (
                    <span 
                      key={`${keyword}-${currentStep}-${index}`}
                      className="px-1.5 py-0.5 bg-[#0047AB] text-white rounded-full text-[10px] font-medium"
                      style={{
                        animation: `fadeInScale 0.4s ease-out ${index * 0.15}s both`
                      }}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* 우측: 상담 안내 멘트 (남은 공간 모두 사용) - 다이렉트 인입 시 표시 안함 */}
              {!isDirectIncoming && isKeywordDetected && showNextStepCards && (
                <div 
                  className="flex-1 bg-[#F0F7FF] border-l-4 border-[#0047AB] rounded-md p-2.5"
                  style={{
                    animation: 'fadeInUp 0.6s ease-out 0.3s both'
                  }}
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-[#0047AB] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-[10px] font-bold text-[#0047AB] mb-1">상담 안내 멘트</h3>
                      <p className="text-[10px] text-[#333333] leading-relaxed">
                        {(() => {
                          const baseMsg = activeScenario && currentStep > 0 
                            ? (activeScenario.steps[currentStep - 1]?.guidanceScript || guidanceScript)
                            : guidanceScript;
                          
                          // 고객 페르소나 특성 가져오기
                          const traits = activeScenario?.customer?.traits || [];
                          
                          // 동적 메시지 생성
                          return getPersonaMessage(baseMsg, traits);
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 현재 상황 칸반보드 - 키워드 감지 후에만 표시 - 다이렉트 인입 시 표시 안함 */}
          {isCallActive && !isDirectIncoming && (
            <div 
              id="current-cards-area"
              className="mb-5"
              style={{
                animation: isKeywordDetected ? 'fadeInUp 0.7s ease-out 0.4s both' : 'none',
                opacity: isKeywordDetected ? 1 : 0
              }}
            >
              <h2 className="text-sm font-bold text-[#333333] mb-3 flex items-center gap-2">
                현재 상황 관련 정보
                {isAnalyzing && (
                  <span className="text-[10px] text-[#0047AB] font-normal flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-[#0047AB] rounded-full animate-pulse"></div>
                    분석 중...
                  </span>
                )}
              </h2>
              {isAnalyzing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[400px]">
                {[1, 2].map((i) => (
                  <div 
                    key={i}
                    className="bg-gradient-to-br from-white to-[#F8FBFF] border-2 border-[#0047AB]/20 rounded-lg p-4 animate-pulse h-[180px]"
                  >
                    <div className="h-5 bg-[#E8F1FC] rounded w-3/4 mb-3"></div>
                    <div className="flex gap-1.5 mb-3">
                      <div className="h-5 bg-[#E8F1FC] rounded w-16"></div>
                      <div className="h-5 bg-[#E8F1FC] rounded w-20"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-[#F0F0F0] rounded w-full"></div>
                      <div className="h-3 bg-[#F0F0F0] rounded w-5/6"></div>
                      <div className="h-3 bg-[#F0F0F0] rounded w-4/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !isKeywordDetected ? (
              <div className="flex items-center justify-center h-[400px] bg-[#F8FBFF] border-2 border-dashed border-[#0047AB]/30 rounded-lg">
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#E8F1FC] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lightbulb className="w-6 h-6 text-[#0047AB]" />
                  </div>
                  <p className="text-sm text-[#666666] mb-1">STT 분석을 통해 키워드가 감지되면</p>
                  <p className="text-sm text-[#666666]">관련 정보가 자동으로 표시됩니다</p>
                </div>
              </div>
            ) : (
              // ⭐ 수평 슬라이딩 캐러셀: Step별로 좌→우 흐름
              <div className="relative">
                {/* Step 인디케이터 */}
                {activeScenario && (
                  <div id="next-step-button" className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {activeScenario.steps.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleProgressClick(index)}
                          disabled={index >= maxReachedStep}
                          className={`h-1 rounded-full transition-all duration-500 ${
                            index < maxReachedStep 
                              ? 'bg-[#0047AB] w-8 cursor-pointer hover:bg-[#003580]' 
                              : 'bg-[#E0E0E0] w-4 cursor-not-allowed'
                          }`}
                          title={index < maxReachedStep ? `Step ${index + 1}로 이동` : `Step ${index + 1} (키워드 감지 대기 중)`}
                        />
                      ))}
                      <span className="text-[10px] text-[#666666] ml-2">
                        Step {currentStep} / {maxReachedStep}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#999999] flex items-center gap-1">
                      <span>← 드래그하여 Step 전환 →</span>
                    </div>
                  </div>
                )}
                
                {/* 슬라이딩 컨테이너 - 전체 Step을 포함, 드래그로 전환 가능 */}
                <div 
                  className="relative overflow-hidden cursor-grab active:cursor-grabbing"
                  onMouseDown={(e) => handleStepDragStart(e, 'current')}
                  onMouseMove={handleStepDragMove}
                  onMouseUp={handleStepDragEnd}
                  onMouseLeave={handleStepDragEnd}
                >
                  <div 
                    className="flex transition-transform duration-700 ease-in-out"
                    style={{
                      transform: `translateX(-${(currentStep - 1) * 100}%)`
                    }}
                  >
                    {activeScenario && activeScenario.steps.map((step, stepIndex) => {
                      const isCurrentStep = stepIndex === currentStep - 1;
                      const slideDirection = currentStep > previousStep ? 'left' : 'right';
                      
                      return (
                        <div 
                          key={stepIndex}
                          className="w-full flex-shrink-0 px-1"
                        >
                          {/* 카드 컨테이너 */}
                          <div className="flex gap-4 overflow-visible">
                            {step.currentSituationCards.map((card, cardIndex) => {
                              const cardWithTimestamp = getCardWithTimestamp(card);
                              return (
                                <InfoCard
                                  key={card.id}
                                  card={cardWithTimestamp}
                                  stepNumber={stepIndex + 1}
                                  source="ai-recommend"
                                  onDetailClick={() => handleCardClick(card)}
                                  className="flex-shrink-0"
                                  style={{
                                    width: 'calc(50% - 8px)',
                                    minWidth: '320px',
                                    animation: isCurrentStep 
                                      ? `slideInFrom${slideDirection === 'left' ? 'Right' : 'Left'} 0.7s ease-out ${cardIndex * 0.1}s both` 
                                      : 'none'
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 다음 단계 칸반보드 - 키워드 감지 후에만 표시 - 다이렉트 인입 시 표시 안함 */}
          {isCallActive && !isDirectIncoming && isKeywordDetected && showNextStepCards && (
            <div 
              id="next-cards-area"
              className="mb-5"
              style={{
                animation: 'fadeInUp 0.7s ease-out 1.1s both'
              }}
            >
              <h2 className="text-sm font-bold text-[#333333] mb-3 flex items-center justify-between">
                <span>다음 단계 예상 정보</span>
                <span className="text-[10px] text-[#999999] flex items-center gap-1">
                  ← 드래그하여 Step 전환 →
                </span>
              </h2>
              
              {/* 슬라이딩 컨테이너 - 전체 Step을 포함, 드래그로 전환 가능 */}
              <div 
                className="relative overflow-hidden cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => handleStepDragStart(e, 'next')}
                onMouseMove={handleStepDragMove}
                onMouseUp={handleStepDragEnd}
                onMouseLeave={handleStepDragEnd}
              >
                <div 
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{
                    transform: `translateX(-${(currentStep - 1) * 100}%)`
                  }}
                >
                  {activeScenario && activeScenario.steps.map((step, stepIndex) => {
                    const isCurrentStep = stepIndex === currentStep - 1;
                    const slideDirection = currentStep > previousStep ? 'left' : 'right';
                    
                    return (
                      <div 
                        key={stepIndex}
                        className="w-full flex-shrink-0 px-1"
                      >
                        {/* 카드 컨테이너 */}
                        <div className="flex gap-4 overflow-visible">
                          {step.nextStepCards.map((card, cardIndex) => {
                            const cardWithTimestamp = getCardWithTimestamp(card);
                            return (
                              <InfoCard
                                key={card.id}
                                card={cardWithTimestamp}
                                stepNumber={stepIndex + 1}
                                source="next-step"
                                onDetailClick={() => handleCardClick(card)}
                                className="flex-shrink-0"
                                style={{
                                  width: 'calc(50% - 8px)',
                                  minWidth: '320px',
                                  animation: isCurrentStep 
                                    ? `slideInFrom${slideDirection === 'left' ? 'Right' : 'Left'} 0.7s ease-out ${cardIndex * 0.1}s both` 
                                    : 'none'
                                }}
                              />
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 우측 열 - 고정 너비 25% (데스크톱: 고정, 모바일: 탭 전환) */}
        <div className={`
          bg-[#FAFAFA] p-4 flex flex-col min-h-0
          ${mobileTab === 'control' ? 'flex' : 'hidden lg:flex'}
          lg:w-[25%]
          w-full ${isCallActive ? 'mt-[89px]' : 'mt-[49px]'} lg:mt-0
          h-full overflow-hidden
        `}>
          {/* ⭐ 대기 콜 현황 - 통화 전에만 표시 */}
          {!isCallActive && (
            <div id="waiting-call-list" className="flex-shrink-0 mb-3">
              <div className="bg-gradient-to-r from-[#F8FBFF] to-[#F0F7FF] rounded-lg p-3 shadow-sm border border-[#E0E0E0]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-bold text-[#0047AB]">📞 대기 콜</h3>
                  <span className="bg-[#FFE6E6] text-[#D32F2F] text-[9px] font-bold px-2 py-0.5 rounded-full">
                    {totalWaitingCalls}건
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {waitingCalls.map((call, index) => {
                    // 우선순위별 스타일 설정
                    const getBorderStyle = () => {
                      if (call.priority === 'urgent') return 'border-l-4 border-l-[#FF6B6B]'; // 빨간색 (제일 오래된 1개)
                      if (call.priority === 'warning') return 'border-l-2 border-l-[#FF9800]'; // 주황색 (3분 이상)
                      return 'border-[#E0E0E0]';
                    };
                    
                    const getBadgeStyle = () => {
                      if (call.priority === 'urgent') return { backgroundColor: '#FFE6E6', color: '#D32F2F' };
                      if (call.priority === 'warning') return { backgroundColor: '#FFF3E0', color: '#FF9800' };
                      return { backgroundColor: '#E8F1FC', color: '#0047AB' };
                    };
                    
                    const getTimeColor = () => {
                      if (call.priority === 'urgent') return 'text-[#D32F2F]';
                      if (call.priority === 'warning') return 'text-[#FF9800]';
                      return 'text-[#0047AB]';
                    };
                    
                    return (
                      <div 
                        key={index}
                        className={`bg-white rounded-md p-2 cursor-pointer hover:shadow-md transition-all border ${getBorderStyle()}`}
                        onClick={() => handleCallConnect(call.category)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-bold text-[#333333] truncate">{call.category}</span>
                          <span 
                            className="text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={getBadgeStyle()}
                          >
                            {call.count}건
                          </span>
                        </div>
                        <div className="text-[8px] text-[#666666]">
                          ⏱️ <span className={getTimeColor()}>
                            {formatTime(call.waitTimeSeconds)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* 통화 컨트롤 - PC에서만 표시 (모바일은 상단 통화 상태바 사용) ⭐ 가이드 모드는 항상 표시 */}
          <div className={`${isGuideModeActive ? 'block' : 'hidden lg:block'} bg-gradient-to-r from-white to-[#F8FBFF] rounded-lg border border-[#E0E0E0] p-2 mb-2 flex-shrink-0 shadow-sm`}>
            <div className="flex items-center justify-between">
              {/* 통화 시간 */}
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#34A853] rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-[#333333] tabular-nums">{formatTime(callTime)}</span>
              </div>
              
              {/* 통화 버튼들 */}
              <div id="call-button" className="flex gap-1.5">
                {!isCallActive ? (
                  <button 
                    id="call-action-button"
                    onClick={handleStartCall}
                    className="w-7 h-7 bg-[#34A853] rounded-lg flex items-center justify-center hover:bg-[#2E7D32] transition-all shadow-sm hover:shadow-md"
                    title="통화 시작"
                  >
                    <Phone className="w-3.5 h-3.5 text-white" />
                  </button>
                ) : (
                  <>
                    <button 
                      className="w-7 h-7 bg-[#34A853] rounded-lg flex items-center justify-center cursor-default"
                      title="통화 중"
                    >
                      <Phone className="w-3.5 h-3.5 text-white animate-pulse" />
                    </button>
                    <button 
                      onClick={handleEndCallClick}
                      id="end-call-button"
                      className="w-7 h-7 bg-[#EA4335] rounded-lg flex items-center justify-center hover:bg-[#C62828] transition-all shadow-sm hover:shadow-md"
                      title="통화 종료"
                    >
                      <PhoneOff className="w-3.5 h-3.5 text-white" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ⭐ STT 실시간 스트림 - 스크롤 가능 영역 */}
          <div id="stt-area" className="flex flex-col bg-white rounded-lg border border-[#E0E0E0] mb-3 shadow-sm overflow-hidden h-[100px] flex-shrink-0">
            <h3 className="text-xs font-bold text-[#333333] p-2.5 pb-2 flex items-center gap-1.5 flex-shrink-0">
              <div className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-[#EA4335] animate-pulse' : 'bg-[#999999]'}`}></div>
              실시간 STT 분석
              {isCallActive && (
                <span className="text-[9px] text-[#0047AB] font-normal flex items-center gap-1 ml-auto">
                  <div className="w-1 h-1 bg-[#0047AB] rounded-full animate-pulse"></div>
                  분석 중
                </span>
              )}
            </h3>
            <div className="flex-1 bg-[#F8F9FA] rounded-md mx-2.5 mb-2.5 p-2 overflow-y-auto flex items-start min-h-0">
              {!isCallActive ? (
                // 통화 대기 중 상태
                <div className="w-full h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Bot className="w-4 h-4 text-[#999999]" />
                    <p className="text-[10px] text-[#999999]">통화를 시작하면 음성이 실시간으로 분석됩니다</p>
                  </div>
                </div>
              ) : sttTexts.length === 0 ? (
                // 통화 중이지만 아직 음성 없음
                <div className="w-full h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-[#0047AB] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-[#0047AB] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-[#0047AB] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <p className="text-[10px] text-[#999999]">음성 인식 대기 중...</p>
                  </div>
                </div>
              ) : (
                // STT 텍스트 표시
                <div className="leading-relaxed w-full space-y-2">
                  {sttTexts.map((item, index) => {
                    const category = getKeywordCategory(item.text);
                    const colorClass = category ? categoryColors[category] : '';
                    
                    return (
                      <span 
                        key={index}
                        className={`text-[10px] inline transition-all duration-300 ${
                          item.isKeyword 
                            ? `font-bold px-1.5 py-0.5 rounded-md ${colorClass || 'bg-[#E8F1FC] text-[#0047AB]'}` 
                            : 'text-[#666666]'
                        }`}
                        style={{ 
                          opacity: index >= sttTexts.length - 15 ? 1 : 0.5,
                          animation: index === sttTexts.length - 1 ? 'fadeIn 0.4s ease-out' : 'none'
                        }}
                      >
                        {item.text}
                      </span>
                    );
                  })}
                  <div ref={sttEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* AI 검색 어시스턴트 - 검색바 형식 */}
          <div id="ai-search-area" className="flex-shrink-0 mb-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-bold text-[#333333] flex-shrink-0">AI 검색 어시스턴트</h3>
              {/* 검색 중 로딩 상태 */}
              {isSearching && (
                <div className="flex items-center gap-1.5 text-[10px] text-[#0047AB]">
                  <div className="w-2.5 h-2.5 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin" />
                  <span>문서를 찾는 중...</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-[#999999] mb-2 flex-shrink-0">궁금한 내용을 질문하세요</p>
            
            {/* 검색 입력 영역 */}
            <div className="flex-shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full h-7 bg-white border border-[#E0E0E0] rounded-md px-2 text-[10px] focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB]"
                placeholder="질문을 입력하세요..."
                disabled={isSearching}
              />
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                className="w-full mt-1.5 h-7 bg-[#0047AB] text-white rounded-md text-[9px] font-medium flex items-center justify-center gap-1.5 hover:bg-[#003580] transition-colors disabled:bg-[#CCCCCC] disabled:cursor-not-allowed"
              >
                <Search className="w-3 h-3" />
                검색
              </button>
            </div>
            
            {/* 검색 이력 드롭다운 */}
            <div className="flex-shrink-0 mt-2">
              <SearchHistoryDropdown
                history={searchHistory}
                isOpen={isSearchHistoryOpen}
                onToggle={setIsSearchHistoryOpen}
                onHistoryItemClick={(item) => {
                  // 검색 이력 클릭 시 해당 문서 모달 표시 (기본 동작)
                  if (item.results.length > 0) {
                    handleCardClick(item.results[0]);
                  }
                }}
                onDocumentClick={(card) => {
                  // 개별 문서 클릭 시 모달 표시
                  handleCardClick(card);
                }}
                onClearHistory={() => {
                  clearSearchHistory();
                  setSearchHistory([]);
                  setIsSearchHistoryOpen(false); // 전체 삭제 시 폴딩 닫기
                }}
                onDeleteItem={(historyId) => {
                  // 개별 삭제 후 상태 업데이트
                  setSearchHistory(getSearchHistory());
                }}
              />
            </div>
          </div>
          
          {/* 메모장 - flex-1로 남은 공간 모두 차지 */}
          <div id="memo-area" className="flex-1 flex flex-col min-h-0 mb-3">
            <h3 className="text-xs font-bold text-[#333333] mb-2 flex-shrink-0">상담 메모</h3>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="flex-1 w-full bg-white border border-[#E0E0E0] rounded-md p-2.5 text-[10px] text-[#333333] resize-none focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] overflow-y-auto"
              placeholder="상담 중 메모를 입력하세요..."
            />
            <Button 
              onClick={handleSaveMemo}
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
              className={`w-full mt-1.5 h-6 text-[9px] flex items-center justify-center gap-1 transition-colors ${
                saveStatus === 'saved' 
                  ? 'bg-[#34A853] hover:bg-[#34A853]' 
                  : 'bg-[#0047AB] hover:bg-[#003580]'
              }`}
            >
              <Save className="w-2.5 h-2.5" />
              {saveStatus === 'idle' && '저장'}
              {saveStatus === 'saving' && '저장 중...'}
              {saveStatus === 'saved' && '✓ 저장 완료'}
            </Button>
          </div>
        </div>
      </div>

      {/* 약관 전문 모달 */}
      {selectedDetailCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4" onClick={() => setSelectedDetailCard(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="bg-gradient-to-r from-[#0047AB] to-[#003580] text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-base font-bold mb-1">{selectedDetailCard.title}</h2>
                <p className="text-xs opacity-90">{selectedDetailCard.regulation}</p>
              </div>
              <button
                onClick={() => setSelectedDetailCard(null)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text">
              {/* 요약 정보 */}
              <div className="bg-[#F8FBFF] border-l-4 border-[#0047AB] rounded-md p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0047AB] mb-2">📋 요약</h3>
                  <p className="text-xs text-[#333333] leading-relaxed">{selectedDetailCard.content}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#0047AB]/20">
                  <div>
                    <p className="text-[10px] text-[#0047AB] font-medium">⏱️ {selectedDetailCard.time}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#34A853] font-medium">✅ {selectedDetailCard.note}</p>
                  </div>
                </div>
              </div>

              {/* 시스템 경로 */}
              <div>
                <h3 className="text-sm font-bold text-[#333333] mb-2">🖥️ 시스템 처리 경로</h3>
                <div className="bg-[#F5F5F5] rounded-md p-3">
                  <p className="text-xs text-[#0047AB] font-medium">{selectedDetailCard.systemPath}</p>
                </div>
              </div>

              {/* 필수 확인 사항 */}
              <div>
                <h3 className="text-sm font-bold text-[#333333] mb-2">✅ 필수 확인 사항</h3>
                <div className="space-y-2">
                  {selectedDetailCard.requiredChecks.map((check, index) => (
                    <div key={index} className="flex items-start gap-2 bg-white border border-[#E0E0E0] rounded-md p-2.5">
                      <div className="w-5 h-5 bg-[#34A853] text-white rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                        {index + 1}
                      </div>
                      <p className="text-xs text-[#333333] flex-1">{check}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 예외 사항 */}
              <div>
                <h3 className="text-sm font-bold text-[#333333] mb-2">⚠️ 예외 사항</h3>
                <div className="space-y-2">
                  {selectedDetailCard.exceptions.map((exception, index) => (
                    <div key={index} className="flex items-start gap-2 bg-[#FFF3E0] border border-[#EA4335]/20 rounded-md p-2.5">
                      <div className="w-5 h-5 bg-[#EA4335] text-white rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                        !
                      </div>
                      <p className="text-xs text-[#333333] flex-1">{exception}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 약관 전문 */}
              <div>
                <h3 className="text-sm font-bold text-[#333333] mb-2">
                  {selectedDetailCard.documentType === 'product-spec' && '📄 상품 상세 정보'}
                  {selectedDetailCard.documentType === 'analysis-report' && '📊 분석 리포트'}
                  {selectedDetailCard.documentType === 'guide' && '📖 이용 가이드'}
                  {selectedDetailCard.documentType === 'terms' && '📜 약관 전문'}
                  {selectedDetailCard.documentType === 'general' && '📌 상세 정보'}
                  {!selectedDetailCard.documentType && '📄 상세 정보'}
                </h3>
                <div className={`border-2 border-[#0047AB]/30 rounded-md p-4 ${
                  selectedDetailCard.documentType === 'product-spec' ? 'bg-[#F8FCFF]' :
                  selectedDetailCard.documentType === 'guide' ? 'bg-[#F9FFF9]' :
                  selectedDetailCard.documentType === 'terms' ? 'bg-[#FFFDF8]' :
                  'bg-white'
                }`}>
                  <div className="text-xs text-[#333333] leading-relaxed prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-base font-bold text-[#0047AB] mt-4 mb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-sm font-bold text-[#0047AB] mt-3 mb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-[#0047AB] mt-2 mb-1" {...props} />,
                        p: ({node, ...props}) => <p className="text-xs leading-relaxed mb-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto my-3">
                            <table className="w-full border-collapse border border-[#E0E0E0]" {...props} />
                          </div>
                        ),
                        thead: ({node, ...props}) => <thead className="bg-[#F0F8FF]" {...props} />,
                        th: ({node, ...props}) => <th className="border border-[#E0E0E0] px-2 py-1 font-semibold text-[#0047AB] text-left" {...props} />,
                        td: ({node, ...props}) => <td className="border border-[#E0E0E0] px-2 py-1" {...props} />,
                        code: ({node, inline, ...props}) => 
                          inline 
                            ? <code className="bg-gray-100 px-1 py-0.5 rounded font-mono" {...props} />
                            : <code className="block bg-gray-100 p-2 rounded font-mono overflow-x-auto" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#0047AB] pl-3 py-1 my-2 bg-[#F8F9FA]" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-[#0047AB]" {...props} />,
                        del: ({node, ...props}) => <span {...props} />,
                      }}
                    >
                      {convertToMarkdown(selectedDetailCard.fullText)}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="border-t border-[#E0E0E0] p-4 flex justify-end">
              <Button 
                onClick={() => setSelectedDetailCard(null)}
                className="bg-[#0047AB] text-white hover:bg-[#003580] h-9 text-xs px-6"
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 통화 종료 확인 모달 */}
      {isEndCallModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="bg-gradient-to-r from-[#0047AB] to-[#003580] text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-base font-bold mb-1">통화 종료 확인</h2>
                <p className="text-xs opacity-90">현재 상담을 종료하시겠습니까?</p>
              </div>
              <button
                onClick={handleCancelEndCall}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 메모 내용 */}
              <div className="bg-[#F8FBFF] border-l-4 border-[#0047AB] rounded-md p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0047AB] mb-2">📋 메모 내용</h3>
                  <p className="text-xs text-[#333333] leading-relaxed">{memo}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#0047AB]/20">
                  <div>
                    <p className="text-[10px] text-[#0047AB] font-medium">⏱️ {formatTime(callTime)}</p>
                  </div>
                </div>
              </div>

              {/* 검색한 참조 문서 */}
              {searchHistory.length > 0 && (() => {
                // ⭐ 중복 제거: 동일한 문서 ID는 한 번만 표시 (키워드 구분 없이)
                const uniqueDocuments = new Map<string, string>();
                
                searchHistory.forEach((historyItem) => {
                  historyItem.results.forEach((card) => {
                    if (!uniqueDocuments.has(card.id)) {
                      uniqueDocuments.set(card.id, card.title);
                    }
                  });
                });
                
                return (
                  <div className="bg-[#F8FFF8] border-l-4 border-[#10B981] rounded-md p-4">
                    <h3 className="text-sm font-bold text-[#10B981] mb-3">🔍 검색한 참조 문서</h3>
                    <div className="space-y-1">
                      {Array.from(uniqueDocuments.entries()).map(([id, title]) => (
                        <div
                          key={id}
                          className="flex items-center gap-2 text-[10px]"
                        >
                          <FileText className="w-3 h-3 text-[#10B981] flex-shrink-0" />
                          <span className="text-[#333333]">{title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 모달 푸터 */}
            <div className="border-t border-[#E0E0E0] p-4 flex justify-end gap-2">
              <Button 
                onClick={handleCancelEndCall}
                className="bg-white text-[#0047AB] border border-[#0047AB] hover:bg-[#F8FBFF] h-9 text-xs"
              >
                취소
              </Button>
              <Button 
                onClick={handleConfirmEndCall}
                className="bg-[#0047AB] text-white hover:bg-[#003580] h-9 text-xs"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ 다이렉트 콜 차단 모달 (가이드 모드 전용) */}
      {showDirectCallBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-[#333333] mb-3">🎓 가이드 모드 안내</h3>
            <p className="text-sm text-[#666666] mb-4 leading-relaxed">
              가이드 모드에서는 <strong className="text-[#0047AB]">아래 대기콜 목록</strong>에서 하나를 선택해주세요.
            </p>
            <p className="text-xs text-[#999999] bg-[#F5F5F5] p-3 rounded-md mb-6">
              💡 다이렉트 콜은 실제 STT와 백엔드 연동으로 진행되어 가이드가 제공되지 않습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowDirectCallBlockModal(false)}
                className="px-4 py-2 bg-[#0047AB] hover:bg-[#003580] text-white"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ 대기콜 차단 모달 (교육 모드 전용) */}
      {showWaitingCallBlockModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              e.preventDefault();
              setShowWaitingCallBlockModal(false);
            }
          }}
          tabIndex={-1}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-[#10B981] mb-3">🎓 교육 시나리오 진행 안내</h3>
            <p className="text-sm text-[#666666] mb-4 leading-relaxed">
              선택하신 교육 시나리오를 진행하기 위해서는{' '}
              <strong className="text-[#10B981]">우측 상단 통화 버튼</strong>을 클릭해주세요.
            </p>
            <p className="text-sm text-[#666666] mb-4 leading-relaxed">
              다이렉트 콜을 잡아서 진행하시면 교육이 바로 시작됩니다.
            </p>
            <p className="text-xs text-[#10B981] bg-[#F0FDF4] p-3 rounded-md mb-6 font-medium">
              💪 실전과 같이 상담에 최선을 다해주세요!
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowWaitingCallBlockModal(false)}
                className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ 교육 모드 튜토리얼 */}
      {isSimulationMode && (
        <TutorialGuide
          steps={currentTutorialSteps}
          isActive={isTutorialActive}
          onComplete={() => {
            // Phase별 완료 저장
            if (tutorialPhase === 1) {
              localStorage.setItem('tutorial-phase1-completed', 'true');
              setIsTutorialActive(false);
              
              // ⭐ Phase 1 완료 → 가이드 모드 유지! (Phase 2, 3까지 연속성 확보)
              console.log('✅ Phase 1 가이드 완료 → 가이드 모드 유지 (연속성)');
              
              // ⭐ Phase 1 완료 시 자동으로 통화 시작 (가이드 모드에서만!)
              if (activeScenario && isGuideModeActive) {
                console.log('🎓 Phase 1 완료 → 자동 통화 시작 (가이드 모드 시나리오 기반)');
                handleStartCall();
              }
            } else if (tutorialPhase === 2) {
              localStorage.setItem('tutorial-phase2-completed', 'true');
              setIsTutorialActive(false);
              
              // ⭐ Phase 2 완료 → 가이드 모드 유지! (Phase 3까지 연속성 확보)
              console.log('✅ Phase 2 가이드 완료 → 가이드 모드 유지 (Phase 3 대기)');
            }
          }}
          onSkip={() => {
            setIsTutorialActive(false);
            
            // ⭐ Phase 1 가이드 모드에서 건너뛰기 → "교육 시나리오 진행 안내 모달" 표시
            if (isGuideModeActive && tutorialPhase === 1) {
              // 가이드 모드 종료
              setIsGuideModeActive(false);
              localStorage.removeItem('isGuideModeActive');
              
              // 교육 시나리오 진행 안내 모달 표시 (Phase 1에서만)
              setShowWaitingCallBlockModal(true);
              console.log('🎓 Phase 1 가이드 건너뛰기 → 교육 시나리오 진행 안내 모달 표시');
            } else if (isGuideModeActive) {
              // Phase 2/3에서는 가이드 모드만 종료, 모달 표시 안 함
              setIsGuideModeActive(false);
              localStorage.removeItem('isGuideModeActive');
              console.log('🎓 Phase 2/3 가이드 건너뛰기 → 가이드 모드만 종료 (모달 없음)');
            }
            
            // ⭐ sessionStorage는 유지 (교육 모드 지속, 대기콜 차단 유지)
            // sessionStorage.removeItem('simulationMode'); <- 삭제하지 않음
            // sessionStorage.removeItem('educationType'); <- 삭제하지 않음
            // sessionStorage.removeItem('scenarioId'); <- 삭제하지 않음
            
            console.log('⏭️ 가이드 건너뛰기 → 가이드 모드 종료, 교육 모드 유지 (대기콜 차단)');
          }}
          themeColor={themePrimary}
          onStepChange={(stepIndex) => {
            // ⭐ Phase 1: 인덱스 1 (step-direct-call-info)에서 특별한 처리 없음
            // tutorialStepsPhase1: [0: welcome, 1: step-direct-call-info, 2: step-select-case]
            if (tutorialPhase === 1) {
              console.log('📍 Phase 1 단계 변경:', stepIndex);
              // 대기콜 클릭 시 자동으로 통화 시작
            }
          }}
        />
      )}
    </MainLayout>
  );
}