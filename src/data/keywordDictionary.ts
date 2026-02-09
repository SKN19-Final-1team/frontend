/**
 * 인입키워드 사전 (백엔드 keywords_dict_v2_with_patterns.json 기반)
 *
 * - 프론트엔드 8개 대분류에 맞춰 큐레이션
 * - STT 발화에서 키워드를 감지하여 카테고리 분류 및 화면 표시에 사용
 * - 백엔드 RAG routing 결과가 있으면 그것이 우선됨 (이 사전은 fallback)
 *
 * priority 기준 (백엔드 priority 7→5, 6→4, 5→3, 4→2, 2-3→1 매핑):
 *   5: 핵심 (분실/도난 등 긴급, 반드시 인입케이스로 표시)
 *   4: 중요 (연체, 한도 등 주요 업무)
 *   3: 일반 (대부분의 업무 키워드)
 *   2: 참고 (세부 용어, 단독으로 인입케이스 미표시)
 *   1: 낮음 (일반적 용어, 인입케이스 미표시)
 */

export interface KeywordEntry {
  /** 정규화된 키워드 (화면 표시용) */
  canonical: string;
  /** STT 매칭에 사용할 변형들 (canonical 자체 + 동의어/축약어) */
  matchForms: string[];
  /** 중요도 (5=핵심, 4=중요, 3=일반, 2=참고, 1=낮음) */
  priority: number;
}

export interface CategoryKeywords {
  category: string;
  keywords: KeywordEntry[];
}

/** 인입 키워드로 표시되기 위한 최소 중요도 (이 값 미만은 인입케이스로 미표시) */
export const MIN_DISPLAY_PRIORITY = 3;

/** 최소 매칭 글자수 (이보다 짧은 단어는 무시) */
export const MIN_MATCH_LENGTH = 2;

/** STT에서 무시할 일반 단어 (너무 흔해서 키워드로 의미 없는 단어들) */
export const STOP_WORDS = new Set([
  '고객', '고객님', '님', '네', '예', '아니요', '감사', '감사합니다',
  '안녕', '안녕하세요', '여보세요', '그래서', '그런데', '그리고',
  '좀', '잠시', '잠깐', '이쪽', '저쪽', '지금', '오늘', '내일', '어제',
  '말씀', '부탁', '드립니다', '드릴게요', '드리겠습니다', '하겠습니다',
  '싶습니다', '합니다', '있습니다', '없습니다', '됩니다', '입니다',
  '확인', '알겠', '가능', '방법', '사항', '어떻게', '무엇', '언제', '어디',
]);

/**
 * 카테고리별 키워드 사전
 * - matchForms: 실제 STT에서 매칭할 텍스트들 (포함 검사)
 * - canonical: 매칭 시 화면에 표시할 정규화된 키워드
 * - priority: 중요도 (5=핵심~1=낮음)
 */
export const keywordDictionary: CategoryKeywords[] = [
  {
    category: '분실/도난',
    keywords: [
      { canonical: '카드분실', matchForms: ['카드분실', '카드 분실', '분실신고', '분실 신고'], priority: 5 },
      { canonical: '도난', matchForms: ['도난', '도난신고', '도난 신고'], priority: 5 },
      { canonical: '재발급', matchForms: ['재발급', '재 발급', '카드재발급', '카드 재발급'], priority: 5 },
      { canonical: '긴급정지', matchForms: ['긴급정지', '긴급 정지', '즉시정지', '즉시 정지'], priority: 5 },
      { canonical: '카드정지', matchForms: ['카드정지', '카드 정지', '정지처리', '정지 처리', '사용정지', '사용 정지'], priority: 5 },
      { canonical: '임시카드', matchForms: ['임시카드', '임시 카드', '임시발급'], priority: 4 },
      { canonical: '교체발급', matchForms: ['교체발급', '교체 발급', '교체카드'], priority: 4 },
      { canonical: '긴급배송', matchForms: ['긴급배송', '긴급 배송', '빠른배송'], priority: 3 },
      { canonical: '분실해제', matchForms: ['분실해제', '분실 해제', '정지해제', '정지 해제'], priority: 5 },
      { canonical: '카드훼손', matchForms: ['카드훼손', '카드 훼손', '카드파손', '카드 파손', '훼손'], priority: 4 },
    ],
  },
  {
    category: '한도',
    keywords: [
      { canonical: '한도증액', matchForms: ['한도증액', '한도 증액', '한도상향', '한도 상향', '증액신청', '증액 신청'], priority: 4 },
      { canonical: '한도조회', matchForms: ['한도조회', '한도 조회', '한도확인', '한도 확인'], priority: 4 },
      { canonical: '신용한도', matchForms: ['신용한도', '신용 한도', '이용한도', '이용 한도'], priority: 3 },
      { canonical: '한도부족', matchForms: ['한도부족', '한도 부족', '한도초과', '한도 초과'], priority: 4 },
      { canonical: '일시불한도', matchForms: ['일시불한도', '일시불 한도'], priority: 3 },
      { canonical: '할부한도', matchForms: ['할부한도', '할부 한도'], priority: 3 },
      { canonical: '현금서비스', matchForms: ['현금서비스', '현금 서비스', '캐시서비스'], priority: 4 },
      { canonical: '카드대출', matchForms: ['카드대출', '카드 대출', '단기대출', '장기대출'], priority: 4 },
      { canonical: '구매한도', matchForms: ['구매한도', '구매 한도'], priority: 3 },
      { canonical: '한도변경', matchForms: ['한도변경', '한도 변경', '한도조정', '한도 조정'], priority: 4 },
    ],
  },
  {
    category: '결제/승인',
    keywords: [
      { canonical: '승인취소', matchForms: ['승인취소', '승인 취소'], priority: 4 },
      { canonical: '매출취소', matchForms: ['매출취소', '매출 취소'], priority: 4 },
      { canonical: '선결제', matchForms: ['선결제', '선 결제', '선납', '선입금'], priority: 3 },
      { canonical: '즉시출금', matchForms: ['즉시출금', '즉시 출금', '바로출금'], priority: 3 },
      { canonical: '결제오류', matchForms: ['결제오류', '결제 오류', '결제실패', '결제 실패', '승인오류'], priority: 5 },
      { canonical: '해외결제', matchForms: ['해외결제', '해외 결제', '해외사용', '해외 사용', '해외거래'], priority: 4 },
      { canonical: '할부', matchForms: ['할부변경', '무이자할부'], priority: 3 },
      { canonical: '결제일변경', matchForms: ['결제일변경', '결제일 변경'], priority: 3 },
      { canonical: '결제계좌', matchForms: ['결제계좌', '결제 계좌', '결제은행', '결제 은행'], priority: 3 },
      { canonical: '간편결제', matchForms: ['간편결제', '간편 결제', 'apple pay', 'samsung pay'], priority: 3 },
      { canonical: '거래정지', matchForms: ['거래정지', '거래 정지'], priority: 4 },
    ],
  },
  {
    category: '이용내역',
    keywords: [
      { canonical: '이용내역', matchForms: ['이용내역', '이용 내역', '사용내역', '사용 내역'], priority: 3 },
      { canonical: '거래내역', matchForms: ['거래내역', '거래 내역'], priority: 3 },
      { canonical: '명세서', matchForms: ['명세서', '이용명세', '이용 명세', '대금명세', '카드명세'], priority: 4 },
      { canonical: '매출전표', matchForms: ['매출전표', '매출 전표', '영수증'], priority: 3 },
      { canonical: '소득공제', matchForms: ['소득공제', '소득 공제', '연말정산', '종합소득세'], priority: 3 },
      { canonical: '내역조회', matchForms: ['내역조회', '내역 조회'], priority: 3 },
    ],
  },
  {
    category: '수수료/연체',
    keywords: [
      { canonical: '연체', matchForms: ['연체', '연체금', '연체대금'], priority: 5 },
      { canonical: '연체이자', matchForms: ['연체이자', '연체 이자', '연체료', '지연이자'], priority: 5 },
      { canonical: '수수료', matchForms: ['할부수수료', '할부 수수료'], priority: 3 },
      { canonical: '연회비', matchForms: ['연회비', '연회비환불', '연회비 환불', '연회비면제', '연회비 면제'], priority: 4 },
      { canonical: '미납', matchForms: ['미납', '미납금', '미납대금', '미납 대금', '미결제'], priority: 5 },
      { canonical: '납부', matchForms: ['납부방법', '납부 방법', '대금납부', '대금 납부'], priority: 3 },
      { canonical: '이자율', matchForms: ['이자율', '금리'], priority: 3 },
      { canonical: '청구금액', matchForms: ['청구금액', '청구 금액', '청구서', '결제대금'], priority: 4 },
      { canonical: '카드대금', matchForms: ['카드대금', '카드 대금'], priority: 3 },
    ],
  },
  {
    category: '포인트/혜택',
    keywords: [
      { canonical: '포인트', matchForms: ['포인트조회', '포인트 조회', '포인트사용', '포인트 사용'], priority: 3 },
      { canonical: '마일리지', matchForms: ['마일리지', '항공마일', '마일적립'], priority: 3 },
      { canonical: '캐시백', matchForms: ['캐시백', '캐쉬백', '현금환급'], priority: 3 },
      { canonical: '혜택', matchForms: ['혜택조회', '혜택 조회', '카드혜택'], priority: 3 },
      { canonical: '이벤트', matchForms: ['이벤트참여', '프로모션'], priority: 2 },
      { canonical: '교통카드', matchForms: ['교통카드', '교통 카드', '후불교통'], priority: 3 },
      { canonical: '쿠폰', matchForms: ['할인쿠폰', '교환권'], priority: 2 },
    ],
  },
  {
    category: '정부지원',
    keywords: [
      { canonical: '정부지원', matchForms: ['정부지원', '정부 지원', '정부지원금', '지원금'], priority: 4 },
      { canonical: '바우처', matchForms: ['바우처', '교육바우처', '교육 바우처', '기저귀바우처'], priority: 4 },
      { canonical: '등유', matchForms: ['등유바우처', '난방유'], priority: 3 },
      { canonical: '임신출산', matchForms: ['임신출산', '육아'], priority: 3 },
      { canonical: '복지카드', matchForms: ['복지카드', '복지 카드'], priority: 3 },
      { canonical: '나라사랑', matchForms: ['나라사랑', '나라사랑카드'], priority: 4 },
      { canonical: '민생', matchForms: ['민생카드', '민생지원'], priority: 4 },
      { canonical: '시니어', matchForms: ['시니어카드'], priority: 3 },
    ],
  },
  {
    category: '기타',
    keywords: [
      { canonical: '카드발급', matchForms: ['카드발급', '카드 발급', '신규발급', '신규 발급'], priority: 3 },
      { canonical: '비밀번호', matchForms: ['비밀번호', '비밀번호변경', '비밀번호 변경', '비번'], priority: 4 },
      { canonical: '주소변경', matchForms: ['주소변경', '주소 변경', '배송지변경'], priority: 3 },
      { canonical: '해지', matchForms: ['카드해지', '카드 해지', '탈회'], priority: 4 },
      { canonical: '배송조회', matchForms: ['배송조회', '배송 조회', '배송확인', '배송 확인'], priority: 3 },
      { canonical: '보험', matchForms: ['카드보험', '보험가입'], priority: 2 },
      { canonical: 'OTP', matchForms: ['otp', 'OTP', '오티피'], priority: 3 },
      { canonical: '일반문의', matchForms: ['일반문의', '일반 문의', '기타문의'], priority: 2 },
    ],
  },
];

/**
 * 모든 키워드를 평탄화한 배열 (빠른 매칭용)
 * { matchForm, canonical, category, priority } 형태
 * - 긴 매칭폼 우선, 동일 길이면 높은 priority 우선
 */
export const flatKeywords: Array<{ matchForm: string; canonical: string; category: string; priority: number }> = (() => {
  const result: Array<{ matchForm: string; canonical: string; category: string; priority: number }> = [];
  for (const cat of keywordDictionary) {
    for (const kw of cat.keywords) {
      for (const form of kw.matchForms) {
        result.push({ matchForm: form.toLowerCase(), canonical: kw.canonical, category: cat.category, priority: kw.priority });
      }
    }
  }
  // 긴 매칭폼 우선 → 동일 길이면 높은 priority 우선
  result.sort((a, b) => b.matchForm.length - a.matchForm.length || b.priority - a.priority);
  return result;
})();

/**
 * STT 텍스트에서 키워드 추출 (중요도 필터링 적용)
 * @param text STT 인식 결과 텍스트
 * @param minPriority 표시할 최소 중요도 (기본: MIN_DISPLAY_PRIORITY=3)
 * @returns 매칭된 키워드들 (canonical 형태, 높은 priority 우선, 최대 3개)
 */
export function extractKeywordsFromText(
  text: string,
  minPriority: number = MIN_DISPLAY_PRIORITY,
): { canonical: string; category: string; priority: number }[] {
  if (!text || text.length < MIN_MATCH_LENGTH) return [];

  const lowerText = text.toLowerCase();
  const matched = new Map<string, { category: string; priority: number }>(); // canonical → { category, priority }

  for (const { matchForm, canonical, category, priority } of flatKeywords) {
    if (matchForm.length < MIN_MATCH_LENGTH) continue;
    if (priority < minPriority) continue; // 중요도 필터링
    if (lowerText.includes(matchForm) && !matched.has(canonical)) {
      matched.set(canonical, { category, priority });
    }
  }

  // priority 높은 순으로 정렬 후 최대 3개 반환
  return Array.from(matched.entries())
    .map(([canonical, { category, priority }]) => ({ canonical, category, priority }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}

/**
 * 단어 단위 키워드 매칭 (기존 handleSttResult 호환)
 * @param word 단일 단어
 * @param minPriority 최소 중요도 (기본: MIN_DISPLAY_PRIORITY)
 * @returns 매칭된 canonical 키워드 (없으면 null)
 */
export function matchKeyword(word: string, minPriority: number = MIN_DISPLAY_PRIORITY): string | null {
  if (!word || word.length < MIN_MATCH_LENGTH) return null;
  if (STOP_WORDS.has(word)) return null;

  const lowerWord = word.toLowerCase();

  for (const { matchForm, canonical, priority } of flatKeywords) {
    if (matchForm.length < MIN_MATCH_LENGTH) continue;
    if (priority < minPriority) continue; // 중요도 필터링
    // 단어가 매칭폼을 포함하거나, 매칭폼이 단어를 포함
    if (lowerWord.includes(matchForm) || matchForm.includes(lowerWord)) {
      // 매칭폼이 단어를 포함하는 경우: 단어가 너무 짧으면 스킵 (오탐 방지)
      if (matchForm.includes(lowerWord) && !lowerWord.includes(matchForm) && lowerWord.length < 2) {
        continue;
      }
      return canonical;
    }
  }
  return null;
}

/**
 * 카테고리 이름으로 해당 카테고리의 키워드 목록 가져오기 (기존 incomingKeywordsByCase 호환)
 * @param category 카테고리명 ("분실/도난", "한도" 등)
 * @returns 해당 카테고리의 canonical 키워드 배열
 */
export function getKeywordsByCategory(category: string): string[] {
  const cat = keywordDictionary.find((c) => c.category === category);
  if (!cat) return [];
  return cat.keywords.map((kw) => kw.canonical);
}

/**
 * 기존 incomingKeywordsByCase 호환 객체 (drop-in replacement)
 * 중요도 MIN_DISPLAY_PRIORITY 이상인 키워드만 포함
 */
export const incomingKeywordsByCase: Record<string, string[]> = (() => {
  const result: Record<string, string[]> = {};
  for (const cat of keywordDictionary) {
    const allForms: string[] = [];
    for (const kw of cat.keywords) {
      if (kw.priority >= MIN_DISPLAY_PRIORITY) {
        allForms.push(...kw.matchForms);
      }
    }
    result[cat.category] = [...new Set(allForms)];
  }
  return result;
})();
