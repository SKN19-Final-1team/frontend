import MainLayout from '../components/layout/MainLayout';
import { Save, FileText, Trash2, Copy, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import DocumentDetailModal from '../components/modals/DocumentDetailModal';
import FeedbackModal from '../components/modals/FeedbackModal';
import { loadAfterCallWorkData, saveConsultation, loadReferencedDocuments, loadCallTime } from '@/api/consultationApi';
import type { SaveConsultationRequest } from '@/types/consultation';
import { USE_MOCK_DATA } from '@/config/mockConfig';
import { toast } from 'sonner';
import { categoryMapping } from '@/data/mockData';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TutorialGuide } from '@/app/components/tutorial/TutorialGuide';
import { tutorialStepsPhase3 } from '@/data/tutorialSteps';
import { useSidebar } from '@/app/contexts/SidebarContext';

// ⭐ Phase 8-1: 삭제 확인 모달 컴포넌트
function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  documentTitle 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  documentTitle: string;
}) {
  // ⭐ Phase 8-3: Enter 키로 확인, ESC 키로 취소
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (event.key === 'Enter') {
        event.preventDefault();
        onConfirm();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-[#333333] mb-3">참조 문서 제외</h3>
        <p className="text-sm text-[#666666] mb-6">
          해당 참조 문서를 저장하지 않겠습니까?<br/>
          <span className="font-semibold text-[#0047AB] mt-2 block">"{documentTitle}"</span>
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 py-2"
          >
            취소
          </Button>
          <Button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#EA4335] hover:bg-[#D33B2C] text-white"
          >
            제외
          </Button>
        </div>
      </div>
    </div>
  );
}

// ⭐ Phase 8-1: 삭제 성공 토스트 컴포넌트
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#333333] text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default function AfterCallWorkPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [memo, setMemo] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  
  // ⭐ Sidebar 컨텍스트 (fixed layout용)
  const { isSidebarExpanded } = useSidebar();
  
  // ⭐ 교육 시뮬레이션 모드 확인
  const isSimulationMode = location.state?.mode === 'simulation' || sessionStorage.getItem('simulationMode') === 'true';
  const themePrimary = isSimulationMode ? '#10B981' : '#0047AB'; // Emerald-500 vs Blue-700
  
  // ⭐ Phase 3 튜토리얼 상태
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  
  // ⭐ 가이드 모드 플래그 (localStorage에서 관리)
  const [isGuideModeActive, setIsGuideModeActive] = useState(() => {
    return localStorage.getItem('isGuideModeActive') === 'true';
  });
  
  // ⭐ 가이드 모드 상태 동기화 (localStorage 변화 감지)
  useEffect(() => {
    const guideModeValue = localStorage.getItem('isGuideModeActive') === 'true';
    if (guideModeValue !== isGuideModeActive) {
      setIsGuideModeActive(guideModeValue);
      console.log('🔄 [후처리] 가이드 모드 상태 동기화:', guideModeValue);
    }
  }, []); // 페이지 진입 시 한 번만 실행

  // ⭐ 헤더의 가이드 버튼 클릭 감지 (localStorage 이벤트)
  useEffect(() => {
    const handleStartGuideRequest = () => {
      const requested = localStorage.getItem('startGuideRequested');
      if (requested === 'true') {
        console.log('🎓 [후처리] 헤더 가이드 버튼 클릭 감지 → 가이드 모드 시작');
        
        // 플래그 제거
        localStorage.removeItem('startGuideRequested');
        
        // 가이드 모드 활성화
        setIsGuideModeActive(true);
        localStorage.setItem('isGuideModeActive', 'true');
        setIsTutorialActive(true);
      }
    };
    
    // 초기 확인
    handleStartGuideRequest();
    
    // 1초마다 폴링
    const interval = setInterval(handleStartGuideRequest, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // ⭐ location.state로 교육 모드가 전달되면 sessionStorage에 저장
  useEffect(() => {
    if (location.state?.mode === 'simulation') {
      sessionStorage.setItem('simulationMode', 'true');
      if (location.state?.educationType) {
        sessionStorage.setItem('educationType', location.state.educationType);
      }
    }
  }, [location.state]);
  
  // ⭐ 디버깅: 교육 모드 상태 확인
  useEffect(() => {
    console.log('🔍 [후처리] isSimulationMode:', isSimulationMode);
    console.log('🔍 [후처리] isGuideModeActive (state):', isGuideModeActive);
    console.log('🔍 [후처리] localStorage.isGuideModeActive:', localStorage.getItem('isGuideModeActive'));
    console.log('🔍 [후처리] localStorage.tutorial-phase3-completed:', localStorage.getItem('tutorial-phase3-completed'));
    console.log('🔍 [후처리] sessionStorage.simulationMode:', sessionStorage.getItem('simulationMode'));
    console.log('🔍 [후처리] location.state:', location.state);
  }, [isSimulationMode, isGuideModeActive, location.state]);
  
  // ⭐ 교육 모드 진입 시 튜토리얼 완료 상태 초기화
  useEffect(() => {
    if (isSimulationMode) {
      console.log('🎓 [후처리] 교육 모드 진입 → Phase 3 튜토리얼 완료 상태 초기화');
      localStorage.removeItem('tutorial-phase3-completed');
    }
  }, [isSimulationMode]);
  
  // ⭐ 후처리 페이지 전용 중분류 (15개)
  const acwSubcategories = [
    '조회/안내',
    '신청/등록',
    '변경',
    '취소/해지',
    '처리/실행',
    '발급',
    '확인서',
    '배송',
    '즉시출금',
    '상향/증액',
    '이체/전환',
    '환급/반환',
    '정지/해제',
    '결제일',
    '기타'
  ];
  
  const [formData, setFormData] = useState({
    title: '',
    status: '진행중',
    category: '기타',  // ⭐ 다이렉트 콜 기본값 '기타'
    subcategory: '기타',  // ⭐ 중분류도 '기타'로 통일
    followUpTasks: '',
    handoffDepartment: '없음',
    handoffNotes: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  
  // ⭐ Phase 8-3: LLM 로딩 상태
  const [isLlmLoading, setIsLlmLoading] = useState(true);
  
  // ⭐ 페이드인 애니메이션 상태 (로딩 페이지에서 왔을 때)
  const [isFadingIn, setIsFadingIn] = useState(false);
  
  // 모바일 탭 상태 (모바일/태블릿 전용)
  const [mobileTab, setMobileTab] = useState<'transcript' | 'acw'>('acw');
  
  // ⭐ Phase 8-1: 참조 문서 상태
  const [referencedDocuments, setReferencedDocuments] = useState<Array<{
    stepNumber: number;
    documentId: string;
    title: string;
    used: boolean;
  }>>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // ⭐ Phase 8-2: 피드백 모달 상태
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  
  // ⭐ Phase 8-2: 후처리 시간 자동 기록
  const [acwStartTime, setAcwStartTime] = useState<number>(0);
  const [acwTimeSeconds, setAcwTimeSeconds] = useState<number>(0);

  // ⭐ Phase A: Mock/Real 데이터 로드
  const [pageData, setPageData] = useState(() => loadAfterCallWorkData());

  // ⭐ 복사 기능 (Clipboard API 폴백 포함)
  const copyToClipboard = async (text: string) => {
    try {
      // 먼저 Clipboard API 시도
      await navigator.clipboard.writeText(text);
      toast.success('복사되었습니다');
    } catch (err) {
      // 폴백: execCommand 사용
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          toast.success('복사되었습니다');
        } else {
          toast.error('복사 실패');
        }
      } catch (fallbackErr) {
        console.error('복사 실패:', fallbackErr);
        toast.error('복사 기능을 사용할 수 없습니다');
      }
    }
  };

  // ⭐ ACW 시간 실시간 카운팅
  useEffect(() => {
    if (acwStartTime === 0) return;
    
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - acwStartTime) / 1000);
      setAcwTimeSeconds(elapsedSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [acwStartTime]);

  // ⭐ 후처리 데이터 자동 저장 (입력 변경 시마다)
  useEffect(() => {
    const pendingACWData = localStorage.getItem('pendingConsultation');
    if (pendingACWData) {
      const consultationData = JSON.parse(pendingACWData);
      const pendingACW = {
        consultationId: consultationData.consultationId,
        formData,
        aiSummary,
        memo,
        referencedDocuments,
        acwTimeSeconds
      };
      localStorage.setItem('pendingACW', JSON.stringify(pendingACW));
    }
  }, [formData, aiSummary, memo, referencedDocuments, acwTimeSeconds]);

  // 페이지 로드 시 localStorage에서 메모 및 참조 문서 불러오기
  useEffect(() => {
    // ⭐ 미처리 후처리 복원
    const pendingACWStr = localStorage.getItem('pendingACW');
    if (pendingACWStr) {
      try {
        const savedACW = JSON.parse(pendingACWStr);
        console.log('📝 미처리 후처리 발견 - 자동 복원:', savedACW);
        
        // 폼 데이터 복원
        if (savedACW.formData) {
          setFormData(savedACW.formData);
        }
        if (savedACW.aiSummary) {
          setAiSummary(savedACW.aiSummary);
        }
        if (savedACW.memo) {
          setMemo(savedACW.memo);
        }
        if (savedACW.referencedDocuments) {
          setReferencedDocuments(savedACW.referencedDocuments);
        }
        // ACW 시간은 복원하지 않고 새로 시작
      } catch (error) {
        console.error('❌ 후처리 데이터 복원 실패:', error);
        localStorage.removeItem('pendingACW');
      }
    }
    
    // ⭐ 로딩 페이지에서 왔는지 확인하고 페이드인
    const fromLoading = sessionStorage.getItem('fromLoading');
    if (fromLoading === 'true') {
      setIsFadingIn(true);
      sessionStorage.removeItem('fromLoading');
      
      // 0.5초 후 페이드인 완료
      setTimeout(() => {
        setIsFadingIn(false);
      }, 500);
    }
    
    // ⭐ Phase 8-2: 후처리 시작 시간 기록 (복원 시에는 다시 시작)
    const startTime = Date.now();
    setAcwStartTime(startTime);
    
    // ⭐ Phase 8-3: Ctrl+Enter로 저장
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleSaveButtonClick();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    const savedMemo = localStorage.getItem('currentConsultationMemo');
    const callTime = localStorage.getItem('consultationCallTime');
    
    if (savedMemo) {
      setMemo(savedMemo);
    }
    
    // 통화 시간이 있으면 콘솔에 표시 (나중에 UI에 추가 가능)
    if (callTime) {
      console.log('통화 시간:', callTime, '초');
    }
    
    // ⭐ Phase 8-1: 참조 문서 불러오기
    const savedReferencedDocs = localStorage.getItem('referencedDocuments');
    if (savedReferencedDocs) {
      try {
        const docs = JSON.parse(savedReferencedDocs);
        
        // ⭐ Phase 8-1: 클릭된 문서 우선순위 정렬
        const clickedDocsStr = localStorage.getItem('clickedDocuments');
        let clickedDocs: string[] = [];
        
        if (clickedDocsStr) {
          try {
            clickedDocs = JSON.parse(clickedDocsStr);
          } catch (error) {
            console.error('클릭된 문서 파싱 오류:', error);
          }
        }
        
        // 클릭된 문서를 우선순위로 정렬
        const sortedDocs = docs.sort((a: any, b: any) => {
          const aIndex = clickedDocs.indexOf(a.documentId);
          const bIndex = clickedDocs.indexOf(b.documentId);
          
          // 둘 다 클릭되지 않음 → 원래 순서 유지
          if (aIndex === -1 && bIndex === -1) return 0;
          // a만 클릭됨 → a를 앞으로
          if (aIndex !== -1 && bIndex === -1) return -1;
          // b만 클릭됨 → b를 앞으로
          if (aIndex === -1 && bIndex !== -1) return 1;
          // 둘 다 클릭됨 → 클릭 순서대로
          return aIndex - bIndex;
        });
        
        setReferencedDocuments(sortedDocs);
      } catch (error) {
        console.error('참조 문서 파싱 오류:', error);
      }
    }
    
    // ⭐ Phase 3 튜토리얼 자동 시작 (가이드 모드일 때만)
    if (isSimulationMode && isGuideModeActive) {
      console.log('✅ [후처리] Phase 3 튜토리얼 시작 조건 충족');
      const phase3Completed = localStorage.getItem('tutorial-phase3-completed');
      console.log('🔍 [후처리] tutorial-phase3-completed:', phase3Completed);
      if (!phase3Completed) {
        // 1초 후 Phase 3 튜토리얼 시작
        setTimeout(() => {
          console.log('🎓 가이드 모드: Phase 3 튜토리얼 자동 시작');
          setIsTutorialActive(true);
        }, 1000);
      } else {
        console.log('⏭️ [후처리] Phase 3 튜토리얼 이미 완료됨 - 건너뛰기');
      }
    } else {
      console.log('❌ [후처리] Phase 3 튜토리얼 시작 조건 미충족:', {
        isSimulationMode,
        isGuideModeActive
      });
    }
  }, [isSimulationMode, isGuideModeActive]);

  // ⭐ Phase 8-2: "후처리 완료 및 저장" 버튼 클릭 핸들러
  const handleSaveButtonClick = () => {
    // "오늘 하루 보지 않기" 설정 확인
    const feedbackDontShowUntil = localStorage.getItem('feedbackDontShowUntil');
    const today = new Date().toDateString();
    
    // 오늘은 피드백을 보지 않기로 설정되어 있으면 바로 저장
    if (feedbackDontShowUntil === today) {
      handleSaveACW();
    } else {
      // 피드백 모달 표시
      setIsFeedbackModalOpen(true);
    }
  };

  // ⭐ Phase 8-2: 피드백 모달에서 "확인" 클릭 시 실제 저장
  const handleFeedbackConfirm = () => {
    setIsFeedbackModalOpen(false);
    handleSaveACW();
  };

  // ⭐ Phase 8-2: 피드백 모달이 열릴 때 현재까지의 후처리 시간 계산
  const getCurrentAcwTime = () => {
    const currentTime = Date.now();
    return Math.floor((currentTime - acwStartTime) / 1000);
  };

  // 후처리 완료 및 저장 (실제 저장 로직)
  const handleSaveACW = async () => {
    setIsSaving(true);

    // ⭐ Phase 8-2: 후처리 종료 시간 계산 (초 단위)
    const endTime = Date.now();
    const acwTimeInSeconds = Math.floor((endTime - acwStartTime) / 1000);
    setAcwTimeSeconds(acwTimeInSeconds);

    console.log(`📊 후처리 소요 시간: ${acwTimeInSeconds}초 (${Math.floor(acwTimeInSeconds / 60)}분 ${acwTimeInSeconds % 60}초)`);

    // PostgreSQL + pgvector에 저장할 데이터 준비
    const acwData: SaveConsultationRequest = {
      consultationId: pageData.callInfo.id,
      employeeId: localStorage.getItem('employeeId') || 'EMP-001',  // ⭐ Phase A: employeeId 추가
      customerId: pageData.customerInfo.id,
      customerName: pageData.customerInfo.name,  // ⭐ Phase A: 고객명 추가
      title: formData.title,
      status: formData.status,
      category: formData.category,
      aiSummary: aiSummary,
      memo: memo,
      followUpTasks: formData.followUpTasks,
      handoffDepartment: formData.handoffDepartment,
      handoffNotes: formData.handoffNotes,
      callTimeSeconds: parseInt(localStorage.getItem('consultationCallTime') || '0'),  // ⭐ Phase A: 타입 수정
      datetime: pageData.callInfo.datetime,
      // ⭐ Phase 8-1: 참조 문서 추가
      referencedDocuments: referencedDocuments,
      referencedDocumentIds: referencedDocuments.map(doc => doc.documentId), // 문서 ID만 추출
      // ⭐ Phase 8-2: 후처리 시간 추가 (초 단위)
      acwTimeSeconds: acwTimeInSeconds,
    };

    try {
      // ⭐ Phase A: Mock/Real API 분기
      console.log(`🎯 데이터 모드: ${USE_MOCK_DATA ? 'Mock' : 'Real'}`);
      
      const result = await saveConsultation(acwData);
      
      if (!result.success) {
        throw new Error(result.error || '저장 실패');
      }

      console.log('✅ 저장 성공:', result);

      // ⭐ localStorage 완전히 clear (순서 중요!)
      // 1. 먼저 pendingConsultation 삭제 (자동 저장 useEffect가 다시 실행되지 않도록)
      localStorage.removeItem('pendingConsultation');
      
      // 2. 통화 관련 상태 삭제
      localStorage.removeItem('activeCallState');
      localStorage.removeItem('currentConsultationMemo');
      localStorage.removeItem('consultationCallTime');
      localStorage.removeItem('referencedDocuments');
      localStorage.removeItem('currentScenarioCategory');
      localStorage.removeItem('clickedDocuments');
      
      // 3. 마지막으로 pendingACW 삭제
      localStorage.removeItem('pendingACW');

      // 저장 완료 후 페이지 이동
      setIsSaving(false);
      
      // ⭐ 교육 모드 vs 실전 모드 분기
      if (isSimulationMode) {
        // 교육 모드: sessionStorage 정리 후 교육 시뮬레이션 페이지로 복귀
        sessionStorage.removeItem('simulationMode');
        sessionStorage.removeItem('educationType');
        sessionStorage.removeItem('scenarioId');
        localStorage.removeItem('simulationCase');
        
        console.log('✅ 교육 모드 후처리 완료 → 시뮬레이션 페이지로 이동');
        window.location.replace('/simulation');
      } else {
        // 실전 모드: 상담 중 페이지로 이동 (다음 상담 대기)
        console.log('✅ 실전 모드 후처리 완료 → 상담 중 페이지로 이동');
        window.location.replace('/consultation/live');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      setIsSaving(false);
      toast.error('저장에 실패했습니다.', {
        description: '다시 시도해주세요.',
        duration: 3000,
      });
    }
  };

  return (
    <MainLayout>
      <div 
        className={`flex bg-white fixed top-[60px] right-0 bottom-0 overflow-hidden transition-opacity duration-600 ease-out ${
          isFadingIn ? 'opacity-0' : 'opacity-100'
        } transition-all duration-300`}
        style={{
          left: `${isSidebarExpanded ? 200 : 56}px`,
          // ⭐ 튜토리얼 활성화 시 z-index를 낮춰서 오버레이 아래로 들어가게
          zIndex: isTutorialActive ? 1 : 'auto',
          position: 'fixed'
        }}
      >


        {/* 모바일/태블릿 탭 네비게이션 (lg 미만에서만 표시) */}
        <div 
          className="lg:hidden fixed left-0 right-0 bg-white border-b border-[#E0E0E0] z-50 flex"
          style={{ top: '60px' }}
        >
          <button
            onClick={() => setMobileTab('transcript')}
            className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
              mobileTab === 'transcript'
                ? 'text-[#0047AB] border-b-2 border-[#0047AB] bg-[#F8FBFF]'
                : 'text-[#666666] hover:text-[#333333] hover:bg-[#F5F5F5]'
            }`}
          >
            상담 전문/피드백
          </button>
          <button
            onClick={() => setMobileTab('acw')}
            className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
              mobileTab === 'acw'
                ? 'text-[#0047AB] border-b-2 border-[#0047AB] bg-[#F8FBFF]'
                : 'text-[#666666] hover:text-[#333333] hover:bg-[#F5F5F5]'
            }`}
          >
            후처리
          </button>
        </div>

        {/* 좌측 열 - 상담 전문/참조 문서 (데스크톱: 30%, 모바일: 탭 전환) */}
        <div 
          className={`
            p-3 bg-[#FAFAFA] overflow-y-auto border-r border-[#E0E0E0] flex flex-col
            lg:block
            ${mobileTab === 'transcript' ? 'block' : 'hidden'}
            lg:w-[30%]
            w-full
          `}
          style={{ height: '100%' }}
        >
          {/* 상담 전문 (50% 높이) */}
          <div id="acw-transcript" className="flex-shrink-0 mb-3 flex flex-col" style={{ height: '45%' }}>
            <h3 className="py-2 border-b border-[#E0E0E0] text-xs font-bold text-[#333333] mb-2">상담 전문</h3>
            <div className="bg-white rounded-lg p-2.5 flex-1 overflow-y-auto">
              <div className="space-y-1.5">
                {pageData.callTranscript.map((msg, index) => (
                  <div key={index} className={`flex ${msg.speaker === 'agent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${msg.speaker === 'agent' ? 'text-right' : 'text-left'}`}>
                      <div 
                        className={`inline-block px-2 py-1 rounded-lg text-[10px] ${
                          msg.speaker === 'agent'
                            ? 'bg-[#0047AB] text-white rounded-tr-sm'
                            : 'bg-[#F5F5F5] text-[#333333] rounded-tl-sm'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <div className="text-[9px] text-[#999999] mt-0.5">{msg.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 참조 문서 */}
          <div id="acw-docs" className="flex-1 flex flex-col">
            <h3 className="py-2 border-b border-[#E0E0E0] text-xs font-bold text-[#333333] mb-2">
              참조 문서
            </h3>
            <div className="space-y-1.5 overflow-y-auto flex-1">
              {referencedDocuments.map((doc, index) => (
                <div
                  key={`${doc.documentId}-${index}`}
                  className="flex items-center gap-2 p-2 rounded bg-white hover:bg-[#F8FBFF] cursor-pointer transition-colors border border-[#E0E0E0]"
                  onClick={() => {
                    setSelectedDocumentId(doc.documentId);
                    setIsDocumentModalOpen(true);
                  }}
                >
                  <FileText className="w-4 h-4 text-[#0047AB] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-[#333333]">
                      {doc.title}
                    </p>
                  </div>
                  <button
                    className="ml-2 text-[#EA4335] hover:text-[#D33B2C] text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDocumentId(doc.documentId);
                      setIsDeleteConfirmModalOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 우측 열 (메인 ~70% 너비) - 모바일 탭 전환 */}
        <div 
          className={`
            p-4 bg-white overflow-hidden
            lg:block
            ${mobileTab === 'acw' ? 'block' : 'hidden'}
            lg:flex-1
            w-full
          `}
          style={{ height: '100%' }}
        >
          {/* AI 생성 후처리 문서 */}
          <h2 className="text-sm font-bold text-[#333333] mb-3">상담 후처리 문서</h2>

          <div id="acw-document-area" className="space-y-3">
            {/* 상담 제목 */}
            <div>
              <Label className="text-xs text-[#666666] mb-1.5 block">제목</Label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full h-9 px-3 border border-[#E0E0E0] rounded-md text-[10px]"
                placeholder="상담 제목을 입력하세요"
              />
            </div>

            {/* 상담 ID, 상태, 대분류, 중분류 - 4컬럼 */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs text-[#666666] mb-1.5 block">상담 ID</Label>
                <input
                  type="text"
                  value={pageData.callInfo.id}
                  readOnly
                  className="w-full h-8 px-2 border border-[#E0E0E0] rounded-md bg-[#F5F5F5] text-[#999999] text-[10px]"
                />
              </div>
              <div>
                <Label className="text-xs text-[#666666] mb-1.5 block">상태</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full h-8 px-2 border border-[#E0E0E0] rounded-md text-[10px]"
                >
                  <option>진행중</option>
                  <option>완료</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-[#666666] mb-1.5 block">대분류</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value, subcategory: ''})}
                  className="w-full h-8 px-2 border border-[#E0E0E0] rounded-md text-[10px]"
                >
                  {Object.keys(categoryMapping).map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-[#666666] mb-1.5 block">중분류</Label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                  className="w-full h-8 px-2 border border-[#E0E0E0] rounded-md text-[10px]"
                >
                  {acwSubcategories.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 고객 정보 + 통화 정보 - 2컬럼 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#666666] mb-1.5 block">고객 정보</Label>
                <div className="bg-[#F5F5F5] border border-[#E0E0E0] rounded-md p-2.5 h-[66px]">
                  <div className="text-[10px] text-[#666666] leading-snug space-y-0.5">
                    <div>ID: {pageData.customerInfo.id}</div>
                    <div>이름: {pageData.customerInfo.name}</div>
                    <div>전화: {pageData.customerInfo.phone}</div>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#666666] mb-1.5 block">통화 정보</Label>
                <div className="bg-[#F5F5F5] border border-[#E0E0E0] rounded-md p-2.5 h-[66px]">
                  <div className="text-[10px] text-[#666666] leading-snug space-y-0.5">
                    <div>일시: {pageData.callInfo.datetime}</div>
                    <div>통화: {(() => {
                      const callTime = parseInt(localStorage.getItem('consultationCallTime') || '0');
                      const minutes = Math.floor(callTime / 60);
                      const seconds = callTime % 60;
                      return `${minutes}분 ${seconds}초`;
                    })()}</div>
                    <div>ACW: {Math.floor(acwTimeSeconds / 60)}분 {acwTimeSeconds % 60}초</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI 상담 요약본 + 후속 일정 - 2컬럼 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 좌측: AI 상담 요약본 */}
              <div id="acw-summary">
                <Label className="text-xs text-[#666666] mb-1.5 block">AI 상담 요약본</Label>
                <Textarea
                  value={aiSummary}
                  onChange={(e) => setAiSummary(e.target.value)}
                  className="h-[238px] border border-[#E0E0E0] rounded-md p-3 !text-[10px] resize-none"
                  placeholder="AI가 생성한 상담 요약이 표시됩니다"
                />
              </div>

              {/* 우측: 후속 일정 */}
              <div>
                <Label className="text-xs text-[#666666] mb-1.5 block">후속 일정</Label>
                <div className="space-y-2.5">
                  <div>
                    <Label className="text-[10px] text-[#999999] mb-1 block">추후 할 일</Label>
                    <Textarea
                      value={formData.followUpTasks}
                      onChange={(e) => setFormData({...formData, followUpTasks: e.target.value})}
                      className="h-14 border border-[#E0E0E0] rounded-md p-2 !text-[10px] resize-none"
                      placeholder="후속 조치가 필요한 경우 입력하세요"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] text-[#999999] mb-1 block">이관 부서</Label>
                    <select
                      value={formData.handoffDepartment}
                      onChange={(e) => setFormData({...formData, handoffDepartment: e.target.value})}
                      className="w-full h-8 px-2 border border-[#E0E0E0] rounded-md text-[10px]"
                    >
                      <option>없음</option>
                      <option>카드발급팀</option>
                      <option>분실처리팀</option>
                      <option>결제팀</option>
                      <option>VIP고객팀</option>
                      <option>부정사용팀</option>
                      <option>해외업무팀</option>
                      <option>한도관리팀</option>
                      <option>포인트팀</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-[10px] text-[#999999] mb-1 block">이관 부서 전달 사항</Label>
                    <Textarea
                      value={formData.handoffNotes}
                      onChange={(e) => setFormData({...formData, handoffNotes: e.target.value})}
                      className="h-14 border border-[#E0E0E0] rounded-md p-2 !text-[10px] resize-none"
                      placeholder="이관 시 전달할 내용을 입력하세요"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 상담 메모 */}
          <div id="acw-memo-area" className="mt-3">
            <Label className="text-xs text-[#666666] mb-1.5 block">상담 메모</Label>
            <div className="relative">
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="h-16 border border-[#E0E0E0] rounded-md p-2.5 pr-12 !text-[10px] resize-none"
                placeholder="CSU에서 작성한 메모가 자동으로 입력됩니다"
              />
              <button
                onClick={() => {
                  if (memo.trim()) {
                    setAiSummary(prev => {
                      if (prev.trim()) {
                        return prev + '\n\n' + memo;
                      }
                      return memo;
                    });
                    toast.success('AI 상담 요약본에 추가되었습니다');
                  }
                }}
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-[10px] text-[#0047AB] hover:bg-[#F0F7FF] rounded transition-colors"
              >
                <Copy className="w-3 h-3" />
                복사
              </button>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-end pt-3">
            <Button
              id="acw-save-button"
              className="w-40 h-10 bg-[#0047AB] hover:bg-[#003580] text-sm font-bold shadow-lg"
              onClick={handleSaveButtonClick}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              <div className="flex flex-col items-start leading-tight w-full">
                <span className="text-sm">{isSaving ? '저장 중...' : '후처리 완료 및 저장'}</span>
                {!isSaving && <span className="text-[10px] text-white/50 font-normal mt-0.5 self-end">Ctrl + Enter</span>}
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* ⭐ Phase 8-1: 문서 상세 모달 */}
      {isDocumentModalOpen && selectedDocumentId && (
        <DocumentDetailModal
          isOpen={isDocumentModalOpen}
          onClose={() => {
            setIsDocumentModalOpen(false);
            setSelectedDocumentId(null);
          }}
          documentId={selectedDocumentId}
        />
      )}

      {/* ⭐ Phase 8-1: 삭제 확인 모달 */}
      {isDeleteConfirmModalOpen && deleteDocumentId && (
        <DeleteConfirmModal
          isOpen={isDeleteConfirmModalOpen}
          onClose={() => setIsDeleteConfirmModalOpen(false)}
          onConfirm={() => {
            const updatedDocs = referencedDocuments.filter(doc => doc.documentId !== deleteDocumentId);
            setReferencedDocuments(updatedDocs);
            localStorage.setItem('referencedDocuments', JSON.stringify(updatedDocs));
            setIsDeleteConfirmModalOpen(false);
            setDeleteDocumentId(null);
            setToastMessage('참조 문서가 제외되었습니다.');
          }}
          documentTitle={referencedDocuments.find(doc => doc.documentId === deleteDocumentId)?.title || ''}
        />
      )}

      {/* ⭐ Phase 8-2: 피드백 모달 */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onConfirm={handleFeedbackConfirm}
        acwTimeSeconds={getCurrentAcwTime()}
        callTimeSeconds={parseInt(localStorage.getItem('consultationCallTime') || '0')}
      />

      {/* ⭐ 토스트 메시지 */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* ⭐ 교육 모드 튜토리얼 (Phase 3) */}
      {isSimulationMode && (
        <TutorialGuide
          steps={tutorialStepsPhase3}
          isActive={isTutorialActive}
          onComplete={() => {
            localStorage.setItem('tutorial-phase3-completed', 'true');
            setIsTutorialActive(false);
            
            // ⭐ Phase 3 완료 시 가이드 모드만 종료 (페이지는 유지)
            setIsGuideModeActive(false);
            localStorage.removeItem('isGuideModeActive');
            
            console.log('✅ [후처리] Phase 3 가이드 완료 → 후처리 페이지 유지 (실제 저장 버튼 클릭 시 이동)');
            
            // ⭐ 페이지 이동 제거 - 사용자가 직접 "저장 및 완료" 버튼을 클릭해야 함
          }}
          onSkip={() => {
            setIsTutorialActive(false);
            
            // ⭐ 건너뛰기 시에도 가이드 모드 종료 (페이지는 유지)
            setIsGuideModeActive(false);
            localStorage.removeItem('isGuideModeActive');
            
            console.log('⏭️ [후처리] 가이드 건너뛰기 → 후처리 페이지 유지');
            
            // ⭐ 페이지 이동 제거 - 사용자가 직접 "저장 및 완료" 버튼을 클릭해야 함
          }}
          themeColor={themePrimary}
          hideOverlay={false}
        />
      )}
    </MainLayout>
  );
}