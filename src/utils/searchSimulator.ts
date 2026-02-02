// AI 검색 어시스턴트 시뮬레이터
// Mock 데이터를 사용하여 검색 결과를 반환

import { searchMockData, getDocumentNames } from '@/data/searchMockData';
import { ScenarioCard } from '@/data/scenarios';
import { addTimestampToCard, updateCardDisplayTime } from './timeFormatter';

/**
 * 검색 결과 타입
 */
export interface SearchResult {
  query: string;
  cards: ScenarioCard[]; // 검색된 카드 2개
  documentNames: string[]; // 문서명 목록
  searchTime: number; // 검색 소요 시간 (ms)
  accuracy: number; // 매칭 정확도 (0~100)
}

/**
 * 검색 쿼리를 시뮬레이션하여 결과 반환
 * @param query - 검색 쿼리
 * @returns 검색 결과 (2개 카드 + 메타데이터)
 */
export const simulateSearch = async (query: string): Promise<SearchResult> => {
  // 0.3초 딜레이 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const trimmedQuery = query.trim();
  
  // 1. 정확한 매칭
  if (searchMockData[trimmedQuery]) {
    const cards = searchMockData[trimmedQuery].map((card, idx) => {
      const cardWithTimestamp = addTimestampToCard(card);
      // 정확 매칭: 각 카드에 개별 매칭 점수 추가 (95-100점)
      return {
        ...cardWithTimestamp,
        relevanceScore: 100 - (idx * 2.5) // 첫 번째 100점, 두 번째 97.5점
      };
    });
    return {
      query: trimmedQuery,
      cards,
      documentNames: getDocumentNames(cards),
      searchTime: 287, // Mock 검색 시간
      accuracy: 100 // 정확도 100%
    };
  }
  
  // 2. 부분 매칭 (키워드 포함)
  for (const [key, cards] of Object.entries(searchMockData)) {
    if (key.includes(trimmedQuery) || trimmedQuery.includes(key)) {
      const cardsWithTimestamp = cards.map((card, idx) => {
        const cardWithTimestamp = addTimestampToCard(card);
        // 부분 매칭: 85-92점
        return {
          ...cardWithTimestamp,
          relevanceScore: 92 - (idx * 4.5)
        };
      });
      return {
        query: trimmedQuery,
        cards: cardsWithTimestamp,
        documentNames: getDocumentNames(cardsWithTimestamp),
        searchTime: 312,
        accuracy: 85 // 부분 매칭은 85%
      };
    }
  }
  
  // 3. 키워드 기반 검색 (카드의 keywords 필드 검색)
  const lowerQuery = trimmedQuery.toLowerCase();
  for (const [key, cards] of Object.entries(searchMockData)) {
    const hasMatchingKeyword = cards.some(card => 
      card.keywords.some(keyword => 
        keyword.toLowerCase().includes(lowerQuery) || 
        lowerQuery.includes(keyword.toLowerCase().replace('#', ''))
      )
    );
    
    if (hasMatchingKeyword) {
      const cardsWithTimestamp = cards.map((card, idx) => {
        const cardWithTimestamp = addTimestampToCard(card);
        // 키워드 매칭: 70-80점
        return {
          ...cardWithTimestamp,
          relevanceScore: 80 - (idx * 5)
        };
      });
      return {
        query: trimmedQuery,
        cards: cardsWithTimestamp,
        documentNames: getDocumentNames(cardsWithTimestamp),
        searchTime: 425,
        accuracy: 70 // 키워드 매칭은 70%
      };
    }
  }
  
  // 4. 결과 없음
  return {
    query: trimmedQuery,
    cards: [],
    documentNames: [],
    searchTime: 198,
    accuracy: 0
  };
};

/**
 * 검색 가능한 쿼리 추천
 * @param partialQuery - 부분 쿼리
 * @param limit - 최대 추천 개수 (기본 5개)
 * @returns 추천 쿼리 목록
 */
export const getSuggestedQueries = (partialQuery: string, limit: number = 5): string[] => {
  if (!partialQuery.trim()) return [];
  
  const lowerQuery = partialQuery.toLowerCase();
  const suggestions = Object.keys(searchMockData).filter(key =>
    key.toLowerCase().includes(lowerQuery)
  );
  
  return suggestions.slice(0, limit);
};

/**
 * 검색 이력 타입
 */
export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  results: ScenarioCard[];
  documentNames: string[];
  accuracy: number;
}

/**
 * 검색 이력 저장 (localStorage)
 * @param searchResult - 검색 결과
 * @returns 저장된 검색 이력 아이템
 */
export const saveSearchHistory = (searchResult: SearchResult): SearchHistoryItem => {
  const historyItem: SearchHistoryItem = {
    id: `SEARCH-HISTORY-${Date.now()}`,
    query: searchResult.query,
    timestamp: new Date().toISOString(),
    results: searchResult.cards,
    documentNames: searchResult.documentNames,
    accuracy: searchResult.accuracy
  };
  
  // 기존 이력 가져오기
  const existingHistory = getSearchHistory();
  
  // 새 이력 추가 (최신이 맨 앞)
  const updatedHistory = [historyItem, ...existingHistory];
  
  // 최대 20개까지만 저장
  const limitedHistory = updatedHistory.slice(0, 20);
  
  // localStorage에 저장
  localStorage.setItem('searchHistory', JSON.stringify(limitedHistory));
  
  return historyItem;
};

/**
 * 검색 이력 가져오기
 * @returns 검색 이력 배열 (최신순)
 */
export const getSearchHistory = (): SearchHistoryItem[] => {
  try {
    const saved = localStorage.getItem('searchHistory');
    if (!saved) return [];
    
    const history = JSON.parse(saved) as SearchHistoryItem[];
    
    // displayTime 업데이트 (상대 시간 갱신)
    return history.map(item => ({
      ...item,
      results: item.results.map(card => updateCardDisplayTime(card))
    }));
  } catch (error) {
    console.error('Failed to load search history:', error);
    return [];
  }
};

/**
 * 검색 이력 초기화
 */
export const clearSearchHistory = (): void => {
  localStorage.removeItem('searchHistory');
};

/**
 * 특정 검색 이력 삭제
 * @param historyId - 삭제할 이력 ID
 */
export const deleteSearchHistoryItem = (historyId: string): void => {
  const history = getSearchHistory();
  const updated = history.filter(item => item.id !== historyId);
  localStorage.setItem('searchHistory', JSON.stringify(updated));
};
