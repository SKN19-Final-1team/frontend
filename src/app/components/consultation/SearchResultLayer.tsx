// 검색 결과 레이어 컴포넌트
// 검색된 카드 2개씩 상하 2행으로 표시 (최대 4개)

import { ScenarioCard } from '@/data/scenarios';
import { InfoCard } from './InfoCard';
import { EmptySearchSlot } from './EmptySearchSlot';

interface SearchResultLayerProps {
  searchResults: ScenarioCard[][]; // 2차원 배열: [[최신 2개], [이전 2개]]
  onCardClick: (card: ScenarioCard) => void;
  className?: string;
}

/**
 * 검색 결과 레이어
 * - 상단 2칸: 최신 검색 결과
 * - 하단 2칸: 이전 검색 결과 or 빈 공간
 * - 최대 4개까지 저장 (2회 검색)
 */
export const SearchResultLayer = ({
  searchResults,
  onCardClick,
  className = ''
}: SearchResultLayerProps) => {
  const latestResults = searchResults[0] || []; // 최신 검색 (상단)
  const previousResults = searchResults[1] || []; // 이전 검색 (하단)

  return (
    <div className={`flex flex-col gap-4 h-full ${className}`}>
      {/* 상단 2칸: 최신 검색 결과 */}
      <div className="flex-1 grid grid-cols-2 gap-4">
        {latestResults.length > 0 ? (
          latestResults.slice(0, 2).map((card, index) => (
            <InfoCard
              key={card.id || `latest-${index}`}
              card={card}
              source="search-result"
              onDetailClick={() => onCardClick(card)}
              className="h-full"
            />
          ))
        ) : (
          // 검색 결과가 없으면 빈 공간 2개
          <>
            <EmptySearchSlot />
            <EmptySearchSlot />
          </>
        )}
        
        {/* 검색 결과가 1개만 있으면 나머지 1개는 빈 공간 */}
        {latestResults.length === 1 && <EmptySearchSlot />}
      </div>

      {/* 하단 2칸: 이전 검색 결과 or 빈 공간 */}
      <div className="flex-1 grid grid-cols-2 gap-4">
        {previousResults.length > 0 ? (
          previousResults.slice(0, 2).map((card, index) => (
            <InfoCard
              key={card.id || `previous-${index}`}
              card={card}
              source="search-result"
              onDetailClick={() => onCardClick(card)}
              className="h-full"
            />
          ))
        ) : (
          // 이전 검색이 없으면 빈 공간 2개
          <>
            <EmptySearchSlot />
            <EmptySearchSlot />
          </>
        )}
        
        {/* 이전 검색이 1개만 있으면 나머지 1개는 빈 공간 */}
        {previousResults.length === 1 && <EmptySearchSlot />}
      </div>
    </div>
  );
};
