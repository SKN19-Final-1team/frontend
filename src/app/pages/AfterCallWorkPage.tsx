import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Save, FileText, Copy, Trash2 } from 'lucide-react';
import MainLayout from '@/app/components/layout/MainLayout';
import DocumentDetailModal from '@/app/components/modals/DocumentDetailModal';
import FeedbackModal from '@/app/components/modals/FeedbackModal';
import ReferencedDocumentsModal from '@/app/components/modals/ReferencedDocumentsModal';
import { ProcessingTimeline } from '../components/acw/ProcessingTimeline';
import type { ProcessingTimelineItem } from '@/data/afterCallWorkData/types';
import { toast } from 'sonner';
import { loadAfterCallWorkData, saveConsultation, type SaveConsultationRequest } from '@/api/consultationApi';
import { USE_MOCK_DATA } from '@/config/mockConfig';
import { MAIN_CATEGORIES } from '@/data/categoryMapping';
import { TutorialGuide } from '@/app/components/tutorial/TutorialGuide';
import { tutorialStepsPhase3 } from '@/data/tutorialSteps';
import { useSidebar } from '@/app/contexts/SidebarContext';
import { typewriterEffect, delay } from '@/utils/typewriterAnimation';
import { getACWDataByCategory } from '@/data/afterCallWorkData';

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

  // ⭐ [v24] 다이렉트콜 여부 및 실제 교육모드 확인 (localStorage.activeCallState에서 읽기)
  const [callModeInfo] = useState<{ isDirectIncoming: boolean; isActualSimulationMode: boolean }>(() => {
    try {
      const activeCallStateStr = localStorage.getItem('activeCallState');
      if (activeCallStateStr) {
        const activeCallState = JSON.parse(activeCallStateStr);
        console.log('📞 [후처리] isDirectIncoming 복원:', activeCallState.isDirectIncoming);
        console.log('🎓 [후처리] isSimulationMode (실제) 복원:', activeCallState.isSimulationMode);
        return {
          isDirectIncoming: activeCallState.isDirectIncoming || false,
          isActualSimulationMode: activeCallState.isSimulationMode || false
        };
      }
    } catch (error) {
      console.error('❌ [후처리] activeCallState 파싱 실패:', error);
    }
    return { isDirectIncoming: false, isActualSimulationMode: false };
  });

  const { isDirectIncoming, isActualSimulationMode } = callModeInfo;
  
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
  
  // ⭐ location.state 교육 모드가 전달되면 sessionStorage에 저장
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
  
  // ⭐ [신규] 시뮬레이션 모드일 때 ACW 데이터 로드 + 타이핑 애니메이션
  useEffect(() => {
    // ⭐ 모드와 관계없이 항상 ACW 데이터 로드
    const loadACWData = async () => {
      try {
        // ⭐ 페이지 진입 안정화 시간 (500ms 대기)
        console.log('⏳ [ACW 로드] 페이지 안정화 대기 중...');
        await delay(500);

        // ⭐ [v25] Mock 처리 타임라인 보관 (타이핑 애니메이션 후 표시용)
        let mockTimeline: ProcessingTimelineItem[] | null = null;

        // ⭐ [v24] 먼저 실제 LLM API 결과 확인 (llmApiResult)
        const llmResultStr = localStorage.getItem('llmApiResult');
        let aiAnalysisData: {
          title: string;
          status: string;
          category: string;
          subcategory: string;
          categoryRaw?: string;
          aiSummary: string;
          followUpTasks: string;
          handoffDepartment: string;
          handoffNotes: string;
          handledCategories?: string[];
          evaluation?: unknown;
        } | null = null;

        if (llmResultStr) {
          try {
            const llmResult = JSON.parse(llmResultStr);
            console.log('🤖 [ACW 로드] 실제 LLM API 결과 발견:', llmResult);

            // LLM API 결과를 사용
            aiAnalysisData = {
              title: llmResult.title || '상담 내역',
              status: llmResult.status || '완료',
              category: llmResult.category || '기타',
              subcategory: llmResult.subcategory || '기타',
              categoryRaw: llmResult.categoryRaw || '',
              aiSummary: llmResult.aiSummary || '',
              followUpTasks: llmResult.followUpTasks || '',
              handoffDepartment: llmResult.handoffDepartment || '없음',
              handoffNotes: llmResult.handoffNotes || '',
              handledCategories: llmResult.handledCategories || [],
              evaluation: llmResult.evaluation || null
            };

            // ⭐ evaluation 데이터가 있으면 localStorage에 저장 (저장 시 사용)
            if (llmResult.evaluation) {
              localStorage.setItem('llmEvaluation', JSON.stringify(llmResult.evaluation));
              console.log('📊 [ACW 로드] LLM 평가 데이터 저장:', llmResult.evaluation);
            }

            // ⭐ [v24] LLM 응답의 script 필드(화자 분리된 전문)가 있으면 우선 사용
            if (llmResult.script && Array.isArray(llmResult.script) && llmResult.script.length > 0) {
              // ⭐ [v25] 통화 시작 시간 기반 실제 타임스탬프 계산
              const savedStartTime = localStorage.getItem('consultationStartTime') || '';
              const savedCallTime = parseInt(localStorage.getItem('callTime') || '0', 10);
              const timePart = savedStartTime.split(' ')[1] || '00:00';
              const [sHour, sMin] = timePart.split(':').map(Number);

              const diarizedTranscript = llmResult.script.map((item: { speaker: string; message: string }, index: number) => {
                const intervalSec = llmResult.script.length > 1
                  ? Math.floor(savedCallTime / (llmResult.script.length - 1)) * index
                  : 0;
                const totalSec = sHour * 3600 + sMin * 60 + intervalSec;
                const h = Math.floor(totalSec / 3600) % 24;
                const m = Math.floor((totalSec % 3600) / 60);
                return {
                  speaker: item.speaker,
                  message: item.message,
                  timestamp: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
                };
              });
              setCallTranscript(diarizedTranscript);
              // ⭐ LLM 화자 분리 전문 사용 플래그 설정 (STT 덮어쓰기 방지)
              localStorage.setItem('useLLMScript', 'true');
              console.log('🎤 [ACW 로드] LLM 화자 분리 전문 사용:', diarizedTranscript.length, '개 발화');
            }
          } catch (error) {
            console.error('❌ [ACW 로드] LLM 결과 파싱 실패:', error);
          }
        }

        // LLM 결과가 없으면 Mock 데이터 폴백
        if (!aiAnalysisData) {
          const category = localStorage.getItem('currentScenarioCategory');
          console.log('🎬 [ACW 로드] 시나리오 카테고리:', category);

          if (!category) {
            console.warn('⚠️ [ACW 로드] 카테고리 없음 - 기본값 유지');
            return;
          }

          // 카테고리별 ACW 데이터 조회 (Mock)
          const acwData = getACWDataByCategory(category);

          if (!acwData) {
            console.warn(`⚠️ [ACW 로드] "${category}" 시나리오 데이터 없음`);
            return;
          }

          console.log('✅ [ACW 로드] Mock 데이터 사용:', acwData);

          aiAnalysisData = {
            title: acwData.aiAnalysis.title,
            status: '완료',
            category: acwData.aiAnalysis.inboundCategory,
            subcategory: acwData.aiAnalysis.subcategory,
            aiSummary: acwData.aiAnalysis.summary,
            followUpTasks: acwData.aiAnalysis.followUpTasks || '',
            handoffDepartment: acwData.aiAnalysis.handoffDepartment || '없음',
            handoffNotes: acwData.aiAnalysis.handoffNotes || '',
            handledCategories: acwData.processingTimeline?.map((t: ProcessingTimelineItem) => t.action) || []
          };

          // ⭐ [v25] Mock 처리 타임라인은 즉시 표시하지 않고, 타이핑 애니메이션 후 표시
          if (acwData.processingTimeline) {
            mockTimeline = acwData.processingTimeline;
          }

          // Mock 데이터의 transcript 설정
          if (acwData.transcript && acwData.transcript.length > 0) {
            const savedTranscript = localStorage.getItem('consultationTranscript');
            if (!savedTranscript) {
              setCallTranscript(acwData.transcript);
              console.log('✅ [ACW 로드] Mock transcript 사용:', acwData.transcript.length, '개 메시지');
            }
          }
        }

        // 1. 상담 전문 채팅 데이터 즉시 로드 (LLM 화자 분리 전문이 없을 때만)
        const useLLMScript = localStorage.getItem('useLLMScript') === 'true';
        if (!useLLMScript) {
          const savedTranscript = localStorage.getItem('consultationTranscript');
          if (savedTranscript) {
            try {
              const transcript = JSON.parse(savedTranscript);
              setCallTranscript(transcript);
              console.log('✅ [ACW 로드] 실제 STT 데이터 사용:', transcript.length, '개 메시지');
            } catch (error) {
              console.error('❌ [ACW 로드] STT 데이터 파싱 실패');
            }
          }
        } else {
          console.log('⏭️ [ACW 로드] LLM 화자 분리 전문 사용 중 - STT 데이터 건너뜀');
          localStorage.removeItem('useLLMScript'); // 플래그 정리
        }

        // 2. Select 필드 즉시 로드 (애니메이션 불가능)
        setFormData(prev => ({
          ...prev,
          status: aiAnalysisData!.status || prev.status,  // ⭐ [v24] status 매핑 추가
          category: aiAnalysisData!.category,
          subcategory: aiAnalysisData!.subcategory,
          handoffDepartment: aiAnalysisData!.handoffDepartment || '없음',
        }));
        if (aiAnalysisData!.categoryRaw) {
          setCategoryRaw(aiAnalysisData!.categoryRaw);
        }

        console.log('✅ [ACW 로드] 대분류:', aiAnalysisData.category);
        console.log('✅ [ACW 로드] 중분류:', aiAnalysisData.subcategory);

        // 3. 타이핑 애니메이션 순차 진행
        await delay(300);

        // 3-1. 제목 타이핑 (빠르게: 5ms)
        await typewriterEffect(
          aiAnalysisData.title,
          (partial) => setFormData(prev => ({ ...prev, title: partial })),
          5
        );

        await delay(200);

        // 3-2. AI 요약본 타이핑 (중간 속도: 8ms)
        await typewriterEffect(
          aiAnalysisData.aiSummary,
          (partial) => setAiSummary(partial),
          8
        );

        await delay(200);

        // 3-3. 추후 할 일 타이핑 (빠르게: 5ms)
        if (aiAnalysisData.followUpTasks) {
          await typewriterEffect(
            aiAnalysisData.followUpTasks,
            (partial) => setFormData(prev => ({ ...prev, followUpTasks: partial })),
            5
          );
        }

        await delay(200);

        // 3-4. 이관 부서 전달 사항 타이핑 (빠르게: 5ms)
        if (aiAnalysisData.handoffNotes) {
          await typewriterEffect(
            aiAnalysisData.handoffNotes,
            (partial) => setFormData(prev => ({ ...prev, handoffNotes: partial })),
            5
          );
        }

        await delay(300);

        // 4. 🎯 처리 내역 타임라인 표시 (타이핑 애니메이션 완료 후)
        if (mockTimeline) {
          // ⭐ [v25] 대기콜: Mock 타임라인을 그대로 사용 (애니메이션은 ProcessingTimeline 컴포넌트가 처리)
          setProcessingTimeline(mockTimeline);
          console.log('✅ [ACW 로드] Mock 처리 타임라인 표시:', mockTimeline);
        } else if (aiAnalysisData.handledCategories && aiAnalysisData.handledCategories.length > 0) {
          // 다이렉트콜: LLM handledCategories에서 타임라인 생성
          const savedStartTime = localStorage.getItem('consultationStartTime') || '';
          const savedCallTime = parseInt(localStorage.getItem('callTime') || '0', 10);
          const timePart = savedStartTime.split(' ')[1] || '00:00';
          const [sHour, sMin] = timePart.split(':').map(Number);

          const generatedTimeline = aiAnalysisData.handledCategories.map((step: string, index: number) => {
            const intervalSec = aiAnalysisData!.handledCategories!.length > 1
              ? Math.floor(savedCallTime / (aiAnalysisData!.handledCategories!.length - 1)) * index
              : 0;
            const totalSec = sHour * 3600 + sMin * 60 + intervalSec;
            const h = Math.floor(totalSec / 3600) % 24;
            const m = Math.floor((totalSec % 3600) / 60);
            const s = totalSec % 60;
            return {
              time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
              action: step,
              categoryRaw: null
            };
          });
          setProcessingTimeline(generatedTimeline);
          console.log('✅ [ACW 로드] LLM 기반 처리 타임라인 생성:', generatedTimeline);
        }

        console.log('✅ [ACW 로드] 모든 타이핑 애니메이션 완료');

      } catch (error) {
        console.error('❌ [ACW 로드] 오류:', error);
      }
    };

    loadACWData();
  }, []); // 페이지 로드 시 한 번만 실행

  // ⭐ [v24] LLM 분석 완료 이벤트 리스너 (API 응답이 나중에 올 경우 대비)
  useEffect(() => {
    const handleLLMComplete = (event: CustomEvent) => {
      console.log('🎉 [ACW] llmAnalysisComplete 이벤트 수신:', event.detail);
      const llmData = event.detail;

      if (llmData) {
        // 폼 데이터 업데이트
        setFormData(prev => ({
          ...prev,
          title: llmData.title || prev.title,
          status: llmData.status || prev.status,
          category: llmData.category || prev.category,
          subcategory: llmData.subcategory || prev.subcategory,
          followUpTasks: llmData.followUpTasks || prev.followUpTasks,
          handoffDepartment: llmData.handoffDepartment || prev.handoffDepartment,
          handoffNotes: llmData.handoffNotes || prev.handoffNotes,
        }));

        // AI 요약 업데이트
        if (llmData.aiSummary) {
          setAiSummary(llmData.aiSummary);
        }

        // 세부 카테고리 업데이트
        if (llmData.categoryRaw) {
          setCategoryRaw(llmData.categoryRaw);
        }

        // ⭐ [v25] 통화 시작 시간/통화 시간 로드 (타임스탬프 계산용)
        const evtStartTime = localStorage.getItem('consultationStartTime') || '';
        const evtCallTime = parseInt(localStorage.getItem('callTime') || '0', 10);
        const evtTimePart = evtStartTime.split(' ')[1] || '00:00';
        const [evtSHour, evtSMin] = evtTimePart.split(':').map(Number);

        // 처리 타임라인 업데이트 (기존 형식에 맞춤: time, action, categoryRaw)
        if (llmData.handledCategories && Array.isArray(llmData.handledCategories)) {
          const generatedTimeline = llmData.handledCategories.map((step: string, index: number) => {
            const intervalSec = llmData.handledCategories.length > 1
              ? Math.floor(evtCallTime / llmData.handledCategories.length) * (index + 1)
              : 0;
            const totalSec = evtSHour * 3600 + evtSMin * 60 + intervalSec;
            const h = Math.floor(totalSec / 3600) % 24;
            const m = Math.floor((totalSec % 3600) / 60);
            return {
              time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
              action: step,
              categoryRaw: null
            };
          });
          setProcessingTimeline(generatedTimeline);
        }

        // 화자분리된 상담 전문 업데이트
        if (llmData.script && Array.isArray(llmData.script) && llmData.script.length > 0) {
          const diarizedTranscript = llmData.script.map((item: { speaker: string; message: string }, index: number) => {
            const intervalSec = llmData.script.length > 1
              ? Math.floor(evtCallTime / (llmData.script.length - 1)) * index
              : 0;
            const totalSec = evtSHour * 3600 + evtSMin * 60 + intervalSec;
            const h = Math.floor(totalSec / 3600) % 24;
            const m = Math.floor((totalSec % 3600) / 60);
            return {
              speaker: item.speaker,
              message: item.message,
              timestamp: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
            };
          });
          setCallTranscript(diarizedTranscript);
          localStorage.setItem('useLLMScript', 'true');
          console.log('🎤 [ACW 이벤트] LLM 화자 분리 전문 적용:', diarizedTranscript.length, '개 발화');
        }

        // 평가 데이터 저장
        if (llmData.evaluation) {
          localStorage.setItem('llmEvaluation', JSON.stringify(llmData.evaluation));
          console.log('📊 [ACW 이벤트] LLM 평가 데이터 저장:', llmData.evaluation);
        }

        // LLM 로딩 완료
        setIsLlmLoading(false);
        console.log('✅ [ACW 이벤트] LLM 데이터 적용 완료');
      }
    };

    window.addEventListener('llmAnalysisComplete', handleLLMComplete as EventListener);

    return () => {
      window.removeEventListener('llmAnalysisComplete', handleLLMComplete as EventListener);
    };
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    status: '진행중',
    category: '기타',
    subcategory: '기타',  // ⭐ 중분류 기본값 '기타'
    followUpTasks: '',
    handoffDepartment: '없음',
    handoffNotes: '',
  });
  const [categoryRaw, setCategoryRaw] = useState<string>('');
  
  // ⭐ 고정된 중분류 15개 옵션
  const SUBCATEGORIES = [
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

  const [isSaving, setIsSaving] = useState(false);
  
  // ⭐ Phase 8-3: LLM 로딩 상태
  const [isLlmLoading, setIsLlmLoading] = useState(true);
  
  // ⭐ 페이드인 애니메이션 상태 (로딩 페이지에서 왔을 때 초기값 true)
  const [isFadingIn, setIsFadingIn] = useState(() => {
    return sessionStorage.getItem('fromLoading') === 'true';
  });
  
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
  const [selectedDocumentTitle, setSelectedDocumentTitle] = useState<string | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  
  // ⭐ Phase 8-2: 피드백 모달 상태
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  
  // ⭐ Phase 8-2: 후처리 시간 자동 기록
  const [acwStartTime, setAcwStartTime] = useState<number>(0);
  const [acwTimeSeconds, setAcwTimeSeconds] = useState<number>(0);

  // ⭐ Phase 11: 처리 내역 타임라인
  const [processingTimeline, setProcessingTimeline] = useState<ProcessingTimelineItem[]>([]);
  
  // ⭐ Phase 11: 참조 문서 전체보기 모달
  const [isReferencedDocsModalOpen, setIsReferencedDocsModalOpen] = useState(false);

  // ⭐ 참조 문서 삭제 확인 모달
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{id: string, title: string} | null>(null);

  // ⭐ 삭제 확인 모달 포커스 관리
  useEffect(() => {
    if (isDeleteConfirmOpen) {
      // 모달이 열릴 때 포커스 설정
      setTimeout(() => {
        const modalElement = document.querySelector('[data-modal="delete-confirm"]') as HTMLElement;
        if (modalElement) {
          modalElement.focus();
        }
      }, 0);
    }
  }, [isDeleteConfirmOpen]);

  // ⭐ Phase A: Mock/Real 데이터 로드
  const [pageData, setPageData] = useState(() => loadAfterCallWorkData());
  
  // ⭐ [신규] 상담 전문 채팅 데이터 (시뮬레이션 모드에서는 acw1.ts 데이터로 교체)
  const [callTranscript, setCallTranscript] = useState<Array<{speaker: string; message: string; timestamp: string}>>(
    () => loadAfterCallWorkData().callTranscript
  );

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
        
        // ⭐ ACW 데이터가 있는지 확인 (시나리오 카테고리가 있으면 ACW 데이터 우선)
        const category = localStorage.getItem('currentScenarioCategory');
        const hasACWData = !!category;
        
        if (hasACWData) {
          console.log('⚠️ [복원] ACW 데이터 우선 - pendingACW의 formData는 무시됨');
          // formData는 복원하지 않음 (ACW 데이터가 우선)
        } else {
          // ACW 데이터가 없으면 pendingACW 복원 (빈 값은 제외)
          if (savedACW.formData) {
            const restoredFormData: typeof formData = { ...formData };
            
            // 빈 문자열이 아닌 값만 복원
            if (savedACW.formData.title && savedACW.formData.title.trim()) {
              restoredFormData.title = savedACW.formData.title;
            }
            if (savedACW.formData.status) {
              restoredFormData.status = savedACW.formData.status;
            }
            if (savedACW.formData.category) {
              restoredFormData.category = savedACW.formData.category;
            }
            if (savedACW.formData.subcategory) {
              restoredFormData.subcategory = savedACW.formData.subcategory;
            }
            if (savedACW.formData.followUpTasks && savedACW.formData.followUpTasks.trim()) {
              restoredFormData.followUpTasks = savedACW.formData.followUpTasks;
            }
            if (savedACW.formData.handoffDepartment) {
              restoredFormData.handoffDepartment = savedACW.formData.handoffDepartment;
            }
            if (savedACW.formData.handoffNotes && savedACW.formData.handoffNotes.trim()) {
              restoredFormData.handoffNotes = savedACW.formData.handoffNotes;
            }
            
            setFormData(restoredFormData);
            console.log('✅ [복원] pendingACW formData 복원 (빈 값 제외)');
          }
        }
        
        // memo와 aiSummary는 항상 복원 (사용자가 직접 입력한 내용)
        if (savedACW.memo) {
          setMemo(savedACW.memo);
        }
        if (savedACW.aiSummary && !hasACWData) {
          // ACW 데이터가 없을 때만 aiSummary 복원
          setAiSummary(savedACW.aiSummary);
        }
        
        // referencedDocuments는 localStorage 우선 (아래에서 처리)
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
    console.log('🔍 [후처리] localStorage.referencedDocuments:', savedReferencedDocs);
    
    if (savedReferencedDocs) {
      try {
        const docs = JSON.parse(savedReferencedDocs);
        console.log('📄 [후처리] 파싱된 참조 문서:', docs);
        
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
        
        console.log('✅ [후처리] 정렬된 참조 문서:', sortedDocs);
        setReferencedDocuments(sortedDocs);
      } catch (error) {
        console.error('참조 문서 파싱 오류:', error);
      }
    } else {
      console.warn('⚠️ [후처리] localStorage에 참조 문서 없음');
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

    // 오늘은 피드백을 보지 않기로 설정되어 있으면 바로 저장 (피드백 점수 없이)
    if (feedbackDontShowUntil === today) {
      localStorage.removeItem('feedbackScores'); // 이전 피드백 점수 제거
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
    // ⭐ [v24] transcript를 JSON 문자열로 변환
    const transcriptJson = callTranscript.length > 0
      ? JSON.stringify(callTranscript.map(msg => ({
          speaker: msg.speaker,
          message: msg.message,
          timestamp: msg.timestamp
        })))
      : undefined;

    // ⭐ 피드백 점수 로드 (FeedbackModal에서 저장)
    let feedbackScore: number | undefined;
    let satisfactionScore: number | undefined;
    try {
      const feedbackScoresStr = localStorage.getItem('feedbackScores');
      if (feedbackScoresStr) {
        const scores = JSON.parse(feedbackScoresStr);
        feedbackScore = scores.feedbackScore;
        satisfactionScore = scores.satisfactionScore;
        console.log('📊 [후처리] 피드백 점수 적용:', { feedbackScore, satisfactionScore });
      }
    } catch (e) {
      console.warn('⚠️ [후처리] 피드백 점수 파싱 실패');
    }

    const acwData: SaveConsultationRequest = {
      consultationId: pageData.callInfo.id,
      employeeId: localStorage.getItem('employeeId') || 'EMP-001',  // ⭐ Phase A: employeeId 추가
      customerId: pageData.customerInfo.id,
      customerName: pageData.customerInfo.name,  // ⭐ Phase A: 고객명 추가
      title: formData.title,
      status: formData.status,
      category: formData.category,
      categoryRaw: categoryRaw || undefined,
      aiSummary: aiSummary,
      memo: memo,
      transcript: transcriptJson,  // ⭐ [v24] 상담 전문 (화자분리 결과) 추가
      followUpTasks: formData.followUpTasks,
      handoffDepartment: formData.handoffDepartment,
      handoffNotes: formData.handoffNotes,
      callTimeSeconds: parseInt(localStorage.getItem('consultationCallTime') || '0'),  // ⭐ Phase A: 타입 정
      datetime: pageData.callInfo.datetime,
      // ⭐ Phase 8-1: 참조 문서 추가
      referencedDocuments: referencedDocuments,
      referencedDocumentIds: referencedDocuments.map(doc => doc.documentId), // 문서 ID만 추출
      // ⭐ Phase 8-2: 후처리 시간 추가 (초 단위)
      acwTimeSeconds: acwTimeInSeconds,
      // ⭐ 처리 타임라인 추가 (categoryRaw → category 변환)
      processingTimeline: processingTimeline.map(item => ({
        time: item.time,
        action: item.action,
        category: item.categoryRaw ? `${item.categoryRaw.mainCategory} > ${item.categoryRaw.subCategory}` : null
      })),
      // ⭐ 피드백 점수 (FeedbackModal에서 계산된 값)
      feedbackScore,
      satisfactionScore,
    };

    try {
      // ⭐ [v24] 저장 분기 로직 로그
      console.log(`🎯 데이터 모드: ${USE_MOCK_DATA ? 'Mock' : 'Real'}`);
      console.log(`📞 콜 타입: ${isDirectIncoming ? '다이렉트콜' : '대기콜'}`);
      console.log(`🎓 교육 모드 (UI): ${isSimulationMode}`);
      console.log(`🎓 교육 모드 (실제 저장용): ${isActualSimulationMode}`);

      // ⭐ [v24] isDirectIncoming, isActualSimulationMode 전달
      // Real DB 저장 조건: Real 모드 + 다이렉트콜 + 실전 모드 (교육 아님)
      // isActualSimulationMode는 location.state?.mode === 'simulation' 기반 (sessionStorage 아님)
      const result = await saveConsultation(acwData, isDirectIncoming, isActualSimulationMode);

      if (!result.success) {
        throw new Error(result.error || '저장 실패');
      }

      console.log('✅ 저장 성공:', result);

      // ⭐ [v24] localStorage 완전히 clear (대기콜/다이렉트콜 모두 동일하게 초기화)
      // 순서 중요! - 자동 저장 useEffect가 다시 실행되지 않도록

      // 1. 먼저 pendingConsultation 삭제
      localStorage.removeItem('pendingConsultation');

      // 2. 통화 관련 상태 삭제
      localStorage.removeItem('activeCallState');
      localStorage.removeItem('currentConsultationMemo');
      localStorage.removeItem('consultationCallTime');
      localStorage.removeItem('referencedDocuments');
      localStorage.removeItem('currentScenarioCategory');
      localStorage.removeItem('clickedDocuments');

      // 3. ⭐ LLM 관련 데이터 삭제 (상담 전문, 평가, 화자 분리)
      localStorage.removeItem('llmEvaluation');
      localStorage.removeItem('llmApiResult');
      localStorage.removeItem('consultationTranscript');
      localStorage.removeItem('useLLMScript');
      localStorage.removeItem('feedbackScores');
      localStorage.removeItem('educationScores');

      // 4. ⭐ [v24] RAG 관련 데이터 삭제 (있다면)
      localStorage.removeItem('ragSessionId');
      localStorage.removeItem('ragGuidanceScript');

      // 5. 마지막으로 pendingACW 삭제
      localStorage.removeItem('pendingACW');

      console.log('🧹 [후처리 완료] localStorage 전체 초기화 완료 (대기콜/다이렉트콜 공통)');

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
        className={`flex bg-white fixed right-0 bottom-0 overflow-hidden transition-opacity duration-600 ease-out ${
          isFadingIn ? 'opacity-0' : 'opacity-100'
        } transition-all duration-300`}
        style={{
          top: 'var(--header-height, 60px)',
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
              <style>{`
                @keyframes chatBubbleIn {
                  from { opacity: 0; transform: translateY(8px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
              <div className="space-y-1.5">
                {callTranscript.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.speaker === 'agent' ? 'justify-end' : 'justify-start'}`}
                    style={{
                      animation: `chatBubbleIn 0.3s ease-out ${Math.min(index * 0.06, 2)}s both`,
                    }}
                  >
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
            <div className="py-2 border-b border-[#E0E0E0] mb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#333333]">
                참조 문서
              </h3>
              {referencedDocuments.length > 0 && (
                <button
                  onClick={() => setIsReferencedDocsModalOpen(true)}
                  className="text-[10px] text-[#0047AB] hover:text-[#003580] hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:ring-offset-1 rounded px-1"
                >
                  더보기
                </button>
              )}
            </div>
            <div className="space-y-1.5 overflow-y-auto flex-1">
              {referencedDocuments.slice(0, 10).map((doc, index) => (
                <div
                  key={`${doc.documentId}-${index}`}
                  className="flex items-center gap-2 p-2 rounded bg-white hover:bg-[#F8FBFF] cursor-pointer transition-colors border border-[#E0E0E0]"
                  onClick={() => {
                    setSelectedDocumentId(doc.documentId);
                    setSelectedDocumentTitle(doc.title);
                    setIsDocumentModalOpen(true);
                  }}
                >
                  <FileText className="w-4 h-4 text-[#0047AB] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-[#333333] truncate">
                      {doc.title}
                    </p>
                  </div>
                  <button
                    className="ml-2 text-[#EA4335] hover:text-[#D33B2C] text-xs focus:outline-none focus:ring-2 focus:ring-[#0047AB] rounded p-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDocumentToDelete({ id: doc.documentId, title: doc.title });
                      setIsDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {referencedDocuments.length > 10 && (
                <button
                  onClick={() => setIsReferencedDocsModalOpen(true)}
                  className="w-full py-2 text-[10px] text-[#0047AB] hover:text-[#003580] hover:bg-[#F8FBFF] rounded border border-dashed border-[#0047AB] transition-colors"
                >
                  +{referencedDocuments.length - 10}개 더보기
                </button>
              )}
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
                className="w-full h-9 px-3 border border-[#E0E0E0] rounded-md text-[10px] focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-colors"
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
                  className="w-full h-8 px-2 border border-[#E0E0E0] rounded-md bg-[#F5F5F5] text-[#999999] text-[10px] focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-colors"
                />
              </div>
              <div>
                <Label className="text-xs text-[#666666] mb-1.5 block">상태</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full h-8 px-2 border border-[#E0E0E0] rounded-md text-[10px] focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-colors"
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
                  className="w-full h-8 px-2 border border-[#E0E0E0] rounded-md text-[10px] focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-colors"
                >
                  {MAIN_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-[#666666] mb-1.5 block">중분류</Label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                  className="w-full h-8 px-2 border border-[#E0E0E0] rounded-md text-[10px] focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-colors"
                >
                  {SUBCATEGORIES.map((sub) => (
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
              {/* 좌측: AI 상담 요약본 (확대: 480px) */}
              <div id="acw-summary">
                <Label className="text-xs text-[#666666] mb-1.5 block">AI 상담 요약본</Label>
                <Textarea
                  value={aiSummary}
                  onChange={(e) => setAiSummary(e.target.value)}
                  className="h-[480px] border border-[#E0E0E0] rounded-md p-3 !text-[10px] resize-none focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-colors"
                  placeholder="AI가 생성한 상담 요약이 표시됩니다"
                />
              </div>

              {/* 우측: 후속 일정 + 상담 메모 */}
              <div>
                <Label className="text-xs text-[#666666] mb-1.5 block">후속 일정</Label>
                <div className="space-y-2.5">
                  <div>
                    <Label className="text-[10px] text-[#999999] mb-1 block">추후 할 일</Label>
                    <Textarea
                      value={formData.followUpTasks}
                      onChange={(e) => setFormData({...formData, followUpTasks: e.target.value})}
                      className="h-[70px] border border-[#E0E0E0] rounded-md p-2 !text-[10px] resize-none focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-colors"
                      placeholder="후속 조치가 필요한 경우 입력하세요"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] text-[#999999] mb-1 block">이관 부서</Label>
                    <select
                      value={formData.handoffDepartment}
                      onChange={(e) => setFormData({...formData, handoffDepartment: e.target.value})}
                      className="w-full h-[40px] px-2 border border-[#E0E0E0] rounded-md text-[10px] focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-colors"
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
                      className="h-[70px] border border-[#E0E0E0] rounded-md p-2 !text-[10px] resize-none focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-colors"
                      placeholder="이관 시 전달할 내용을 입력하세요"
                    />
                  </div>

                  {/* 상담 메모 (우측 컬럼으로 이동) */}
                  <div id="acw-memo-area">
                    <Label className="text-xs text-[#666666] mb-1.5 block">상담 메모</Label>
                    <div className="relative">
                      <Textarea
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        className="h-[190px] border border-[#E0E0E0] rounded-md p-2.5 pr-12 !text-[10px] resize-none focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-colors"
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
                        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-[10px] text-[#0047AB] hover:bg-[#F0F7FF] rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
                      >
                        <Copy className="w-3 h-3" />
                        복사
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 처리 내역 타임라인 (신규 추가) */}
            <div className="mt-2.5">
              <Label className="text-xs text-[#666666] mb-1.5 block">처리 내역</Label>
              <div className="bg-white border border-[#E0E0E0] rounded-md p-4 h-[100px] overflow-y-auto">
                <ProcessingTimeline timeline={processingTimeline} animate={true} />
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-end pt-[20px]">
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
            setSelectedDocumentTitle(null);
          }}
          documentId={selectedDocumentId}
          documentData={selectedDocumentTitle ? {
            title: selectedDocumentTitle,
            content: selectedDocumentTitle,
          } : undefined}
        />
      )}

      {/* ⭐ Phase 8-2: 피드백 모달 (교육 모드 분기) */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onConfirm={handleFeedbackConfirm}
        acwTimeSeconds={getCurrentAcwTime()}
        callTimeSeconds={parseInt(localStorage.getItem('consultationCallTime') || '0')}
        educationType={isSimulationMode ? (sessionStorage.getItem('educationType') as 'basic' | 'advanced' | undefined) || 'basic' : undefined}
      />

      {/* ⭐ Phase 11: 참조 문서 전체보기 모달 */}
      <ReferencedDocumentsModal
        isOpen={isReferencedDocsModalOpen}
        onClose={() => setIsReferencedDocsModalOpen(false)}
        documents={referencedDocuments.map(doc => ({
          id: doc.documentId,
          title: doc.title,
          category: '', // 카테고리 정보가 없으면 빈 문자열
          content: undefined
        }))}
        onDocumentClick={(doc) => {
          setSelectedDocumentId(doc.id);
          setIsDocumentModalOpen(true);
        }}
      />

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

      {/* ⭐ 참조 문서 삭제 확인 모달 */}
      {isDeleteConfirmOpen && documentToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDeleteConfirmOpen(false);
              setDocumentToDelete(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsDeleteConfirmOpen(false);
              setDocumentToDelete(null);
            } else if (e.key === 'Enter') {
              if (documentToDelete) {
                const updatedDocs = referencedDocuments.filter(d => d.documentId !== documentToDelete.id);
                setReferencedDocuments(updatedDocs);
                localStorage.setItem('referencedDocuments', JSON.stringify(updatedDocs));
                toast.success('참조 문서가 제외되었습니다.');
                setIsDeleteConfirmOpen(false);
                setDocumentToDelete(null);
              }
            }
          }}
          tabIndex={-1}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" data-modal="delete-confirm">
            <div className="p-6">
              <h3 className="text-base font-bold text-[#333333] mb-3">참조 문서 제거</h3>
              <p className="text-sm text-[#666666] mb-2">
                해당 문서를 제거하시겠습니까?
              </p>
              <p className="text-sm text-[#0047AB] font-bold">
                "{documentToDelete.title}"
              </p>
            </div>
            <div className="border-t border-[#E0E0E0] p-4 flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setDocumentToDelete(null);
                }}
                className="bg-white text-[#666666] border border-[#E0E0E0] hover:bg-[#F5F5F5] h-9 text-xs px-4"
              >
                취소
              </Button>
              <Button
                onClick={() => {
                  if (documentToDelete) {
                    const updatedDocs = referencedDocuments.filter(d => d.documentId !== documentToDelete.id);
                    setReferencedDocuments(updatedDocs);
                    localStorage.setItem('referencedDocuments', JSON.stringify(updatedDocs));
                    toast.success('참조 문서가 제외되었습니다.');
                    setIsDeleteConfirmOpen(false);
                    setDocumentToDelete(null);
                  }
                }}
                className="bg-[#EA4335] text-white hover:bg-[#D33B2C] h-9 text-xs px-4"
              >
                제거
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}