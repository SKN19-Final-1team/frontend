import { useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { scenarios, type DocumentType } from '@/data/scenarios';
import { searchMockData } from '@/data/mock';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { convertToMarkdown } from '@/utils/textFormatter';
import { resolveDocumentType } from '@/utils/documentTransformer';

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;  // 'card-1-1-1' 형식
  // ⭐ 외부에서 직접 문서 데이터를 전달 (Real DB 모드 등에서 ID로 못 찾을 때 사용)
  documentData?: {
    title: string;
    content: string;
    fullText?: string;
    regulation?: string;
    time?: string;
    systemPath?: string;
    requiredChecks?: string[];
    exceptions?: string[];
    note?: string;
    keywords?: string[];
    documentType?: DocumentType;
  };
}

// ⭐ Phase 2: 카드 제목/내용 기반으로 DocumentType 자동 추론
const inferDocumentType = (title: string, content: string): DocumentType => {
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // 상품 정보
  if (titleLower.includes('카드') && (titleLower.includes('추천') || titleLower.includes('신청') || contentLower.includes('연회비') || contentLower.includes('적립'))) {
    return 'product-spec';
  }
  
  // 분석 리포트
  if (titleLower.includes('분석') || titleLower.includes('패턴') || titleLower.includes('비교') || titleLower.includes('시뮬레이션')) {
    return 'analysis-report';
  }
  
  // FAQ
  if (titleLower.includes('faq') || titleLower.includes('자주 묻는') || titleLower.includes('자주묻는')) {
    return 'faq';
  }

  // 가이드
  if (titleLower.includes('가이드') || titleLower.includes('안내') || titleLower.includes('설정') || titleLower.includes('확인')) {
    return 'guide';
  }

  // 약관
  if (titleLower.includes('약관') || titleLower.includes('규정') || contentLower.includes('제1조') || contentLower.includes('제2조')) {
    return 'terms';
  }
  
  return 'general';
};

// ⭐ Phase 2: DocumentType별 제목 매핑
const getDocumentTitle = (documentType?: DocumentType): string => {
  switch (documentType) {
    case 'terms':
      return '📜 약관 전문';
    case 'product-spec':
      return '📄 상품 상세 정보';
    case 'analysis-report':
      return '📊 분석 리포트';
    case 'guide':
      return '📖 이용 가이드';
    case 'faq':
      return '❓ 자주 묻는 질문';
    case 'general':
      return '📌 상세 정보';
    default:
      return '📄 전체 약관';
  }
};

// ⭐ Phase 2: DocumentType별 배경색 매핑 (더 은은하게)
const getDocumentBgColor = (documentType?: DocumentType): string => {
  switch (documentType) {
    case 'terms':
      return 'bg-[#FFFDF8]'; // 매우 은은한 노란빛
    case 'product-spec':
      return 'bg-[#F8FCFF]'; // 매우 은은한 파란색
    case 'guide':
      return 'bg-[#F9FFF9]'; // 매우 은은한 초록색
    case 'faq':
      return 'bg-[#FFF8F8]'; // 매우 은은한 붉은빛
    case 'general':
      return 'bg-white'; // 기본 흰색
    default:
      return 'bg-white';
  }
};

export default function DocumentDetailModal({ isOpen, onClose, documentId, documentData }: DocumentDetailModalProps) {
  // ⭐ 문서 찾기 (documentData 우선 → Mock fallback)
  const findDocument = () => {
    // 1. 외부에서 직접 전달받은 documentData 우선 사용 (Real DB 모드)
    if (documentData) {
      return {
        id: documentId,
        title: documentData.title,
        keywords: documentData.keywords || [],
        content: documentData.content,
        systemPath: documentData.systemPath || '',
        requiredChecks: documentData.requiredChecks || [],
        exceptions: documentData.exceptions || [],
        time: documentData.time || '',
        note: documentData.note || '',
        regulation: documentData.regulation || '',
        fullText: documentData.fullText || documentData.content,
        documentType: documentData.documentType || resolveDocumentType({
          title: documentData.title,
          content: documentData.content,
        }),
      };
    }

    // 2. scenarios에서 찾기 (Mock ID 일치)
    for (const scenario of scenarios) {
      for (const step of scenario.steps) {
        const foundInCurrent = step.currentSituationCards.find(card => card.id === documentId);
        if (foundInCurrent) return foundInCurrent;

        const foundInNext = step.nextStepCards.find(card => card.id === documentId);
        if (foundInNext) return foundInNext;
      }
    }

    // 3. searchMockData에서 찾기 (Mock ID 일치)
    for (const cards of Object.values(searchMockData)) {
      const foundCard = cards.find(card => card.id === documentId);
      if (foundCard) return foundCard;
    }

    // 4. title 기반 유사 검색 (최후 fallback)
    if (documentId) {
      for (const scenario of scenarios) {
        for (const step of scenario.steps) {
          const found = step.currentSituationCards.find(card =>
            card.title && documentId && card.title.includes(documentId)
          ) || step.nextStepCards.find(card =>
            card.title && documentId && card.title.includes(documentId)
          );
          if (found) return found;
        }
      }
    }

    return null;
  };

  const docData = findDocument();

  // ⭐ documentType: DB값 우선 → 중앙 유틸리티 추론 fallback
  const effectiveDocumentType = docData?.documentType || (docData ? resolveDocumentType({
    title: docData.title,
    content: docData.content,
    id: docData.id,
  }) : undefined);

  // ⭐ DEBUG: documentType 확인
  useEffect(() => {
    if (docData) {
      console.log('📄 DocumentDetailModal:', {
        id: docData.id,
        title: docData.title,
        originalDocumentType: docData.documentType,
        inferredDocumentType: effectiveDocumentType,
        computedTitle: getDocumentTitle(effectiveDocumentType),
        computedBgColor: getDocumentBgColor(effectiveDocumentType)
      });
    }
  }, [docData, effectiveDocumentType]);

  // ⭐ ESC 키 이벤트 리스너 추가
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || e.key === 'Enter') && isOpen) {
        e.stopPropagation();  // ⭐ 이벤트 전파 중단 (상위 모달로 전달 방지)
        onClose();
      }
    };

    if (isOpen) {
      window.document.addEventListener('keydown', handleEscape);
      // 모달 열릴 때 body 스크롤 잠금 (이미 FrequentInquiryModal에서 설정되어 있으므로 중복 방지)
      // window.document.body.style.overflow = 'hidden';
    }

    return () => {
      window.document.removeEventListener('keydown', handleEscape);
      // 스크롤 복원은 FrequentInquiryModal이 처리하므로 여기서는 하지 않음
      // window.document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ⭐ 문서를 찾을 수 없는 경우 빈 상태 UI
  if (!docData) {
    return (
      <div
        className="modal-backdrop fixed inset-0 bg-black/50 flex items-center justify-center z-[90]"
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).classList.contains('modal-backdrop')) onClose();
        }}
      >
        <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-2xl text-center">
          <FileText className="w-12 h-12 text-[#E0E0E0] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#333333] mb-1">문서를 찾을 수 없습니다</h3>
          <p className="text-xs text-[#999999] mb-4">요청하신 문서 ID ({documentId})에 해당하는 문서가 없습니다.</p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-[#0047AB] hover:bg-[#003580] text-white rounded-md transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  // ⭐ 드래그와 클릭을 구분하기 위한 핸들러
  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // 배경을 직접 클릭한 경우만 닫기
    if (target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  return (
    <div 
      className="modal-backdrop fixed inset-0 bg-black/50 flex items-center justify-center z-[90]"
      onMouseDown={handleBackdropMouseDown}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
        style={{ 
          userSelect: 'text',
          WebkitUserSelect: 'text',
          MozUserSelect: 'text'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0047AB] to-[#4A90E2] p-4 text-white flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5" />
              <span className="text-xs opacity-90">문서 상세보기</span>
            </div>
            <h2 className="text-lg font-bold">{docData.title}</h2>
            {(docData.regulation || docData.time) && (
              <div className="flex items-center gap-3 mt-2 text-xs opacity-90">
                {docData.regulation && <span>근거 규정: {docData.regulation}</span>}
                {docData.regulation && docData.time && <span>•</span>}
                {docData.time && <span>처리 시간: {docData.time}</span>}
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/20 p-1.5 rounded transition-colors flex-shrink-0"
            aria-label="닫기 (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="select-text p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* 요약 */}
          <div className="select-text mb-4 bg-[#F8FAFB] rounded-lg border border-[#E0E0E0] p-3">
            <h3 className="select-text text-xs font-bold text-[#333333] mb-2">📋 요약</h3>
            <p className="select-text text-xs text-[#666666] leading-relaxed">
              {docData.content}
            </p>
          </div>

          {/* 시스템 경로 (있을 때만) */}
          {docData.systemPath && (
            <div className="select-text mb-4 bg-[#FFF9E6] rounded-lg border border-[#FBBC04]/30 p-3">
              <h3 className="select-text text-xs font-bold text-[#333333] mb-2">💻 시스템 경로</h3>
              <p className="select-text text-xs text-[#666666] font-mono">
                {docData.systemPath}
              </p>
            </div>
          )}

          {/* 필수 확인 사항 (있을 때만) */}
          {docData.requiredChecks.length > 0 && (
            <div className="select-text mb-4">
              <h3 className="select-text text-xs font-bold text-[#333333] mb-2">✅ 필수 확인 사항</h3>
              <div className="select-text space-y-1.5">
                {docData.requiredChecks.map((check, index) => (
                  <div key={index} className="select-text flex items-start gap-2 text-xs text-[#333333]">
                    <span className="select-text text-[#0047AB] flex-shrink-0">•</span>
                    <span className="select-text">{check}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 예외 사항 */}
          {docData.exceptions.length > 0 && (
            <div className="select-text mb-4">
              <h3 className="select-text text-xs font-bold text-[#333333] mb-2">⚠️ 예외 사항</h3>
              <div className="select-text space-y-1.5">
                {docData.exceptions.map((exception, index) => (
                  <div key={index} className="select-text flex items-start gap-2 text-xs text-[#EA4335]">
                    <span className="select-text flex-shrink-0">•</span>
                    <span className="select-text">{exception}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 참고사항 */}
          {docData.note && (
            <div className="select-text mb-4 bg-[#E8F1FC] rounded-lg border border-[#0047AB]/30 p-3">
              <h3 className="select-text text-xs font-bold text-[#333333] mb-2">💡 참고사항</h3>
              <p className="select-text text-xs text-[#666666]">
                {docData.note}
              </p>
            </div>
          )}

          {/* 전체 문서 본문 */}
          <div className="border-t border-[#E0E0E0] pt-4">
            <h3 className="text-xs font-bold text-[#333333] mb-3">{getDocumentTitle(effectiveDocumentType)}</h3>
            {docData.fullText && docData.fullText.trim() && docData.fullText !== docData.content ? (
              <div
                className={`text-xs text-[#333333] leading-relaxed prose prose-sm max-w-none ${getDocumentBgColor(effectiveDocumentType)} rounded-lg p-4 border border-[#E0E0E0]`}
                style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 style={{ userSelect: 'text' }} className="text-base font-bold text-[#0047AB] mt-4 mb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 style={{ userSelect: 'text' }} className="text-sm font-bold text-[#0047AB] mt-3 mb-2" {...props} />,
                    h3: ({node, ...props}) => <h3 style={{ userSelect: 'text' }} className="text-sm font-semibold text-[#0047AB] mt-2 mb-1" {...props} />,
                    p: ({node, ...props}) => <p style={{ userSelect: 'text' }} className="text-xs leading-relaxed mb-2" {...props} />,
                    ul: ({node, ...props}) => <ul style={{ userSelect: 'text' }} className="list-disc ml-5 mb-2" {...props} />,
                    ol: ({node, ...props}) => <ol style={{ userSelect: 'text' }} className="list-decimal ml-5 mb-2" {...props} />,
                    li: ({node, ...props}) => <li style={{ userSelect: 'text' }} className="mb-1" {...props} />,
                    table: ({node, ...props}) => (
                      <div className="overflow-x-auto my-3">
                        <table style={{ userSelect: 'text' }} className="w-full border-collapse border border-[#E0E0E0] text-xs" {...props} />
                      </div>
                    ),
                    thead: ({node, ...props}) => <thead style={{ userSelect: 'text' }} className="bg-[#F0F8FF]" {...props} />,
                    th: ({node, ...props}) => <th style={{ userSelect: 'text' }} className="border border-[#E0E0E0] px-3 py-2 font-semibold text-[#0047AB] text-left" {...props} />,
                    td: ({node, ...props}) => <td style={{ userSelect: 'text' }} className="border border-[#E0E0E0] px-3 py-2" {...props} />,
                    code: ({node, inline, ...props}) =>
                      inline
                        ? <code style={{ userSelect: 'text' }} className="bg-gray-100 px-1 py-0.5 rounded font-mono" {...props} />
                        : <code style={{ userSelect: 'text' }} className="block bg-gray-100 p-2 rounded font-mono overflow-x-auto" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote style={{ userSelect: 'text' }} className="border-l-4 border-[#0047AB] pl-3 py-1 my-2 bg-[#F8F9FA]" {...props} />,
                    strong: ({node, ...props}) => <strong style={{ userSelect: 'text' }} className="font-bold text-[#0047AB]" {...props} />,
                    em: ({node, ...props}) => <em style={{ userSelect: 'text' }} {...props} />,
                  }}
                >
                  {convertToMarkdown(docData.fullText)}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="bg-[#F8F9FA] rounded-lg border border-[#E0E0E0] p-4 text-center">
                <p className="text-xs text-[#999999]">
                  현재 요약 정보만 제공됩니다. 전문은 추후 업데이트될 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E0E0E0] p-3 bg-[#F8F9FA] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-[#0047AB] hover:bg-[#003580] text-white rounded-md transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}