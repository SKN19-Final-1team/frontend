/**
 * ⭐ Phase A: 상담 API 레이어
 * 
 * Mock/Real 데이터 전환을 처리하는 API 인터페이스
 */

import { USE_MOCK_DATA } from '@/config/mockConfig';
import type { 
  SaveConsultationRequest, 
  ApiResponse,
  PendingConsultation,
  LLMAnalysisResult,
  MockAfterCallWorkData
} from '@/types/consultation';

// ========================================
// 1. Mock 데이터 정의
// ========================================

/**
 * AfterCallWorkPage용 Mock 데이터
 */
export const MOCK_AFTER_CALL_WORK_DATA: MockAfterCallWorkData = {
  callInfo: {
    id: 'CS-EMP001-202501051432',
    datetime: '2025-01-05 14:32',
  },
  customerInfo: {
    id: 'CUST-TEDDY-00001',
    name: '김민지',
    phone: '010-2345-6789',
  },
  currentCase: {
    category: '카드분실',
    summary: '고객이 카드 분실 신고 요청. 즉시 카드 사용 정지 처리 완료. 재발급 카드 등록 주소로 배송 예정.',
    aiRecommendation: 'AI 추천 처리: 재발급 신청 완료 및 배송 안내',
  },
  similarCase: {
    category: '카드분실',
    summary: '2024-12-28 처리 사례. 고객 카드 분실 신고 후 재발급 처리. 해외 여행 전 긴급 배송 요청하여 익일 배송으로 변경 처리.',
  },
  callTranscript: [
    { speaker: 'customer', message: '안녕하세요, 카드를 분실했어요.', timestamp: '14:32' },
    { speaker: 'agent', message: '안녕하세요. 즉시 카드 사용을 정지하겠습니다.', timestamp: '14:33' },
    { speaker: 'customer', message: '빨리 처리해주세요.', timestamp: '14:33' },
    { speaker: 'agent', message: '카드 사용이 정지되었습니다. 재발급 카드는 3-5일 내 배송됩니다.', timestamp: '14:35' },
    { speaker: 'customer', message: '알겠습니다. 감사합니다.', timestamp: '14:37' },
  ],
};

/**
 * ⭐ 다이렉트 콜용 빈 Mock 데이터
 * 대기콜을 선택하지 않고 직접 통화 버튼을 눌렀을 때 사용
 */
export const EMPTY_AFTER_CALL_WORK_DATA: MockAfterCallWorkData = {
  callInfo: {
    id: '',  // pendingConsultation에서 자동 생성
    datetime: '',  // pendingConsultation에서 자동 설정
  },
  customerInfo: {
    id: 'CUST-TEDDY-00000',  // 형식 예시 (DB 스키마 참고용)
    name: '(고객명 미확인)',  // 다이렉트 콜 상태 명시
    phone: '010-0000-0000',  // 형식 예시 (DB 스키마 참고용)
  },
  currentCase: {
    category: '기타',  // 기본 대분류
    summary: '',  // AI가 생성 예정
    aiRecommendation: '',
  },
  similarCase: {
    category: '기타',
    summary: '',
  },
  callTranscript: [],  // ⭐ 빈 배열 (상담 전문 없음)
};

// ========================================
// 2. localStorage 유틸리티
// ========================================

/**
 * localStorage에서 실제 상담 데이터 로드
 */
export function loadPendingConsultation(): PendingConsultation | null {
  try {
    const data = localStorage.getItem('pendingConsultation');
    if (!data) return null;
    return JSON.parse(data) as PendingConsultation;
  } catch (error) {
    console.error('❌ pendingConsultation 로드 실패:', error);
    return null;
  }
}

/**
 * localStorage에서 LLM 분석 결과 로드
 */
export function loadLLMAnalysisResult(): LLMAnalysisResult | null {
  try {
    const data = localStorage.getItem('llmAnalysisResult');
    if (!data) return null;
    return JSON.parse(data) as LLMAnalysisResult;
  } catch (error) {
    console.error('❌ llmAnalysisResult 로드 실패:', error);
    return null;
  }
}

/**
 * localStorage에서 참조 문서 로드
 */
export function loadReferencedDocuments() {
  try {
    const data = localStorage.getItem('referencedDocuments');
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ referencedDocuments 로드 실패:', error);
    return [];
  }
}

/**
 * localStorage에서 통화 시간 로드
 */
export function loadCallTime(): number {
  try {
    const data = localStorage.getItem('consultationCallTime');
    return data ? parseInt(data, 10) : 0;
  } catch (error) {
    console.error('❌ consultationCallTime 로드 실패:', error);
    return 0;
  }
}

// ========================================
// 3. AfterCallWorkPage 데이터 로더
// ========================================

/**
 * AfterCallWorkPage에서 사용할 데이터 로드
 * Mock/Real 분기 처리
 */
export function loadAfterCallWorkData(): MockAfterCallWorkData {
  // ⭐ 항상 실제 데이터를 먼저 확인 (Mock 모드여도 데이터가 있으면 사용)
  const pending = loadPendingConsultation();
  
  if (USE_MOCK_DATA) {
    console.log('🎭 Mock 데이터 모드');
    
    // ⭐ pending 데이터가 있으면 실제값으로 덮어쓰기
    if (pending) {
      console.log('💡 로컬 데이터 발견: 데이터 덮어쓰기');
      
      // ⭐ 다이렉트 콜 감지 (category가 '일반문의' 또는 빈값)
      const isDirectCall = !pending.category || pending.category === '일반문의';
      
      if (isDirectCall) {
        console.log('📞 다이렉트 콜 감지 → 빈 폼으로 초기화');
        return {
          ...EMPTY_AFTER_CALL_WORK_DATA,
          callInfo: {
            id: pending.consultationId,
            datetime: pending.datetime,
          },
          // ⭐ 고객 정보가 실제로 있으면 채우기 (다이렉트 콜도 고객 DB 조회 가능)
          customerInfo: (pending.customerId && pending.customerId !== 'CUST-TEDDY-00000') ? {
            id: pending.customerId,
            name: pending.customerName,
            phone: pending.customerPhone,
          } : EMPTY_AFTER_CALL_WORK_DATA.customerInfo,
        };
      }
      
      // ⭐ 시나리오 기반 통화 (기존 로직 유지)
      return {
        ...MOCK_AFTER_CALL_WORK_DATA,
        callInfo: {
          id: pending.consultationId,
          datetime: pending.datetime,
        },
        customerInfo: {
          id: pending.customerId,
          name: pending.customerName,
          phone: pending.customerPhone,
        },
        currentCase: {
          ...MOCK_AFTER_CALL_WORK_DATA.currentCase,
          category: pending.category,
        },
      };
    }
    
    return MOCK_AFTER_CALL_WORK_DATA;
  }

  // ✅ Real 데이터 로드 (localStorage → DB에서 온 데이터)
  console.log('🔗 실제 데이터 로드');
  
  // const pending = loadPendingConsultation(); // 상단에서 이미 선언됨
  const llmResult = loadLLMAnalysisResult();
  
  if (!pending) {
    console.warn('⚠️ pendingConsultation이 없습니다. Mock 데이터로 폴백합니다.');
    return MOCK_AFTER_CALL_WORK_DATA;
  }
  
  // ⭐ 다이렉트 콜 감지 (Real 모드)
  const isDirectCall = !pending.category || pending.category === '일반문의';
  
  if (isDirectCall) {
    console.log('📞 [Real] 다이렉트 콜 감지 → 빈 폼으로 초기화');
    return {
      ...EMPTY_AFTER_CALL_WORK_DATA,
      callInfo: {
        id: pending.consultationId,
        datetime: pending.datetime,
      },
      customerInfo: (pending.customerId && pending.customerId !== 'CUST-TEDDY-00000') ? {
        id: pending.customerId,
        name: pending.customerName,
        phone: pending.customerPhone,
      } : EMPTY_AFTER_CALL_WORK_DATA.customerInfo,
      currentCase: {
        category: '기타',
        summary: llmResult?.summary || '',
        aiRecommendation: llmResult?.followUpTasks || '',
      },
    };
  }

  // TODO: DB 스키마 확정 후 매핑 로직 완성
  return {
    callInfo: {
      id: pending.consultationId,         // CS-EMP002-202601211430
      datetime: pending.datetime,
    },
    customerInfo: {
      id: pending.customerId,
      name: pending.customerName,
      phone: pending.customerPhone,
    },
    currentCase: {
      category: pending.category,
      summary: llmResult?.summary || '상담 내용 요약 중...',
      aiRecommendation: llmResult?.followUpTasks || 'AI 분석 중...',
    },
    similarCase: {
      category: pending.category,
      summary: '유사 사례를 검색 중입니다...',  // TODO: API 호출로 유사 사례 조회
    },
    callTranscript: [
      // TODO: STT 전문을 localStorage 또는 API에서 로드
      { speaker: 'customer', message: '통화 내용 로드 중...', timestamp: '00:00' },
    ],
  };
}

// ========================================
// 4. 상담 저장 API
// ========================================

/**
 * 상담 데이터를 DB에 저장
 * Mock/Real 분기 처리
 */
export async function saveConsultation(
  data: SaveConsultationRequest
): Promise<ApiResponse> {
  if (USE_MOCK_DATA) {
    // Mock: 콘솔 로그 + 1초 대기
    console.log('🎭 Mock 저장 (실제 API 호출 안 함):');
    console.log('📦 저장할 데이터:', data);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'Mock 저장 완료',
      data: { consultationId: data.consultationId },
    };
  }

  // ✅ Real: FastAPI 호출
  console.log('🔗 실제 API 호출: POST /api/consultations');
  console.log('📦 요청 데이터:', data);

  try {
    const response = await fetch('/api/consultations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ 저장 성공:', result);
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('❌ 저장 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

// ========================================
// 5. 유사 상담 조회 API (선택)
// ========================================

/**
 * RAG 기반 유사 상담 조회
 * TODO: 백엔드 구현 후 연결
 */
export async function fetchSimilarConsultations(
  category: string,
  query: string
): Promise<ApiResponse> {
  if (USE_MOCK_DATA) {
    console.log('🎭 Mock 유사 상담 조회');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: [
        {
          consultationId: 'CS-20241228-1020',
          category,
          summary: '유사 사례 1',
          similarity: 0.92,
        },
      ],
    };
  }

  // ✅ Real: FastAPI + pgvector 조회
  try {
    const response = await fetch('/api/consultations/similar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, query }),
    });

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ 유사 상담 조회 실패:', error);
    return { success: false, error: String(error) };
  }
}