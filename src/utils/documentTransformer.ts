/**
 * 문서 변환 중앙 유틸리티
 *
 * 모든 문서 데이터 변환을 한 곳에서 처리:
 * - RAGCard → ScenarioCard (WebSocket RAG 응답)
 * - API 응답 → ScenarioCard (검색 API, 상담 상세)
 * - DocumentType 결정 (DB값 우선 → 테이블 추론 → 제목 추론 → fallback)
 *
 * @see docs/levelup/01_F_협업응답_및_PhaseA계획.md
 */

import type { ScenarioCard, DocumentType } from '@/data/scenarios/types';
import type { RAGCard } from '@/app/hooks/useVoiceRecoders';
import { addTimestampToCard } from './timeFormatter';

// ============================================================
// 1. DocumentType 결정 로직 (단일 진실 소스)
// ============================================================

/**
 * DocumentType 결정 - 우선순위:
 * 1. 명시적 documentType 값 (Backend/DB에서 전달)
 * 2. sourceTable 기반 추론
 * 3. 제목/내용 기반 추론
 * 4. 'general' fallback
 */
export function resolveDocumentType(options: {
  documentType?: string;
  sourceTable?: string;
  title?: string;
  content?: string;
  id?: string;
}): DocumentType {
  const { documentType, sourceTable, title = '', content = '', id = '' } = options;

  // 1단계: 명시적 documentType (Backend/DB에서 온 값)
  const validTypes: DocumentType[] = ['terms', 'product-spec', 'analysis-report', 'guide', 'faq', 'general'];
  if (documentType && validTypes.includes(documentType as DocumentType)) {
    return documentType as DocumentType;
  }

  // 2단계: sourceTable 기반 (가장 신뢰할 수 있는 추론)
  if (sourceTable) {
    if (sourceTable === 'card_products') return 'product-spec';
    if (sourceTable === 'service_guide_documents') return 'guide';
    if (sourceTable === 'notices') return 'general';
  }

  // 3단계: ID/제목/내용 기반 추론 (fallback)
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  const idLower = id.toLowerCase();

  if (idLower.startsWith('card-') || idLower.startsWith('card_')) return 'product-spec';
  if (titleLower.includes('카드') && (titleLower.includes('추천') || titleLower.includes('신청') || contentLower.includes('연회비'))) return 'product-spec';
  if (titleLower.includes('분석') || titleLower.includes('패턴') || titleLower.includes('비교')) return 'analysis-report';
  if (titleLower.includes('faq') || titleLower.includes('자주 묻는') || titleLower.includes('자주묻는')) return 'faq';
  if (titleLower.includes('가이드') || titleLower.includes('안내') || titleLower.includes('방법')) return 'guide';
  if (titleLower.includes('약관') || titleLower.includes('규정') || contentLower.includes('제1조')) return 'terms';

  return 'general';
}

// ============================================================
// 2. RAGCard → ScenarioCard 변환
// ============================================================

/**
 * RAG WebSocket/API 응답 카드를 ScenarioCard로 변환
 * RealTimeConsultationPage와 searchSimulator에서 공통 사용
 */
export function normalizeRAGCard(ragCard: RAGCard, index: number): ScenarioCard {
  const raw = ragCard as Record<string, unknown>;

  const id = ragCard.id || '';
  if (!id) {
    console.warn('[documentTransformer] RAG 카드에 id 없음, 임시 ID 생성:', ragCard.title);
  }

  const card: ScenarioCard = {
    id: id || `rag-${Date.now()}-${index}`,
    title: ragCard.title || '정보 카드',
    keywords: ragCard.keywords || [],
    content: ragCard.content || '',
    systemPath: (raw.systemPath as string) || '',
    requiredChecks: (Array.isArray(raw.requiredChecks) ? raw.requiredChecks : []) as string[],
    exceptions: (Array.isArray(raw.exceptions) ? raw.exceptions : []) as string[],
    time: (raw.time as string) || '',
    note: (raw.note as string) || '',
    regulation: (raw.regulation as string) || '',
    fullText: (raw.fullText as string) || (raw.detailContent as string) || ragCard.content || '',
    relevanceScore: (raw.relevanceScore as number) || 0,
    documentType: resolveDocumentType({
      documentType: raw.documentType as string,
      sourceTable: (raw.table || raw.source_table || raw.sourceTable) as string,
      title: ragCard.title,
      content: ragCard.content,
      id: ragCard.id,
    }),
    // 하이브리드 카드 속성
    type: raw.type as 'text' | 'product-info' | undefined,
    attributes: raw.attributes as ScenarioCard['attributes'],
  };

  return addTimestampToCard(card);
}

// ============================================================
// 3. API 응답 (snake_case) → ScenarioCard 변환
// ============================================================

/**
 * Backend API 응답 (상담 상세의 referenced_documents 등)을 ScenarioCard로 변환
 * snake_case → camelCase 매핑 포함
 */
export function normalizeApiDocument(apiDoc: Record<string, unknown>): ScenarioCard {
  return {
    id: (apiDoc.doc_id || apiDoc.documentId || apiDoc.id || '') as string,
    title: (apiDoc.title || '') as string,
    keywords: (apiDoc.keywords as string[]) || [],
    content: (apiDoc.content || apiDoc.summary || '') as string,
    systemPath: (apiDoc.system_path || apiDoc.systemPath || '') as string,
    requiredChecks: (apiDoc.required_checks || apiDoc.requiredChecks || []) as string[],
    exceptions: (apiDoc.exceptions || []) as string[],
    time: (apiDoc.time || '') as string,
    note: (apiDoc.note || '') as string,
    regulation: (apiDoc.regulation || '') as string,
    fullText: (apiDoc.full_text || apiDoc.fullText || apiDoc.content || '') as string,
    relevanceScore: (apiDoc.relevance_score || apiDoc.relevanceScore || 0) as number,
    documentType: resolveDocumentType({
      documentType: (apiDoc.doc_type || apiDoc.documentType || apiDoc.document_type) as string,
      sourceTable: (apiDoc.source_table || apiDoc.sourceTable) as string,
      title: apiDoc.title as string,
      content: (apiDoc.content || '') as string,
      id: (apiDoc.doc_id || apiDoc.id || '') as string,
    }),
  };
}

// ============================================================
// 4. DocumentType UI 헬퍼
// ============================================================

/** DocumentType별 표시 제목 */
export function getDocumentTypeLabel(documentType?: DocumentType): string {
  switch (documentType) {
    case 'terms': return '약관 전문';
    case 'product-spec': return '상품 상세 정보';
    case 'analysis-report': return '분석 리포트';
    case 'guide': return '이용 가이드';
    case 'faq': return '자주 묻는 질문';
    case 'general': return '상세 정보';
    default: return '문서 상세';
  }
}

/** DocumentType별 아이콘 이모지 */
export function getDocumentTypeIcon(documentType?: DocumentType): string {
  switch (documentType) {
    case 'terms': return '\u{1F4DC}';       // 📜
    case 'product-spec': return '\u{1F4C4}'; // 📄
    case 'analysis-report': return '\u{1F4CA}'; // 📊
    case 'guide': return '\u{1F4D6}';       // 📖
    case 'faq': return '\u{2753}';          // ❓
    case 'general': return '\u{1F4CC}';     // 📌
    default: return '\u{1F4C4}';            // 📄
  }
}

/** DocumentType별 배경색 (CSS class) */
export function getDocumentTypeBgColor(documentType?: DocumentType): string {
  switch (documentType) {
    case 'terms': return 'bg-[#FFFDF8]';
    case 'product-spec': return 'bg-[#F8FCFF]';
    case 'guide': return 'bg-[#F9FFF9]';
    case 'faq': return 'bg-[#FFF8F8]';
    case 'analysis-report': return 'bg-[#FFFDF8]';
    case 'general': return 'bg-white';
    default: return 'bg-white';
  }
}
