// 검색 레이어 빈 공간 컴포넌트
// 검색 결과가 없을 때 표시되는 플레이스홀더

interface EmptySearchSlotProps {
  className?: string;
}

/**
 * 검색 레이어의 빈 공간
 * - 점선 테두리
 * - 검색 아이콘 + 안내 텍스트
 * - hover 시 보라색 강조
 */
export const EmptySearchSlot = ({ className = '' }: EmptySearchSlotProps) => {
  return (
    <div className={`h-full ${className}`}>
      <div className="border-2 border-dashed border-[#E0E0E0] rounded-lg h-full 
                      flex flex-col items-center justify-center bg-[#FAFAFA]
                      hover:border-[#C4B5FD] hover:bg-[#F8F7FF] transition-colors">
        {/* 검색 아이콘 */}
        <div className="text-4xl mb-2 opacity-40">🔍</div>
        
        {/* 안내 텍스트 */}
        <p className="text-xs text-[#999999] font-medium">
          추가 검색 시 표시됩니다
        </p>
        <p className="text-[10px] text-[#BBBBBB] mt-1">
          최대 4개까지 저장
        </p>
      </div>
    </div>
  );
};
