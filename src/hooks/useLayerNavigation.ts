// 레이어 네비게이션 커스텀 훅
// 키보드/휠 네비게이션 로직

import { useEffect, RefObject, useRef } from 'react';

interface UseLayerNavigationOptions {
  activeLayer: 'kanban' | 'search';
  setActiveLayer: React.Dispatch<React.SetStateAction<'kanban' | 'search'>>;
  focusedCard: { row: number; col: number };
  setFocusedCard: React.Dispatch<React.SetStateAction<{ row: number; col: number }>>;
  isWheelThrottled: boolean;
  setIsWheelThrottled: React.Dispatch<React.SetStateAction<boolean>>;
  isAtBoundary: boolean;
  setIsAtBoundary: React.Dispatch<React.SetStateAction<boolean>>;
  isModalOpen?: boolean;
  searchInputRef?: RefObject<HTMLInputElement>;
  memoTextareaRef?: RefObject<HTMLTextAreaElement>;
  cardAreaId?: string; // 카드 영역 DOM ID
  setWheelDirection?: React.Dispatch<React.SetStateAction<'up' | 'down' | undefined>>; // 휠 방향 추적
  // Step 네비게이션 (칸반 좌우 경계에서 Step 전환)
  onStepPrev?: () => void;
  onStepNext?: () => void;
  // 전역 단축키 콜백
  onMemoSave?: () => void;
  onSearchExecute?: () => void;
}

/**
 * 레이어 네비게이션 훅
 * - 방향키: 카드 간 이동, 경계에서 레이어/Step 전환
 * - 휠/Space/Tab: 레이어 전환
 * - Ctrl+Shift+F: 검색창 포커스
 * - Ctrl+Shift+M: 메모 포커스
 * - Ctrl+Shift+Enter: 메모 저장 → 카드 포커스
 * - Ctrl+Shift+C: 칸반 카드 포커스
 * - Enter: 검색 실행 (검색창 포커스 시)
 * - /: 검색창 포커싱
 * - Esc: 검색 취소 / 모달 닫기
 */
export function useLayerNavigation(options: UseLayerNavigationOptions) {
  const {
    activeLayer,
    setActiveLayer,
    focusedCard,
    setFocusedCard,
    isWheelThrottled,
    setIsWheelThrottled,
    isAtBoundary,
    setIsAtBoundary,
    isModalOpen = false,
    searchInputRef,
    memoTextareaRef,
    cardAreaId = 'card-layer-area',
    setWheelDirection,
    onStepPrev,
    onStepNext,
    onMemoSave,
    onSearchExecute,
  } = options;
  
  // 경계 lock 상태 (첫 휠은 경고, 두 번째부터 전환)
  const boundaryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wheelDirectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInInput = (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      );

      // === 전역 Ctrl+Shift 단축키 (입력 필드 내에서도 동작) ===
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key) {
          case 'F':
          case 'f':
            e.preventDefault();
            searchInputRef?.current?.focus();
            return;
          case 'M':
          case 'm':
            e.preventDefault();
            memoTextareaRef?.current?.focus();
            return;
          case 'Enter':
            e.preventDefault();
            // 메모 저장 → 카드 영역 포커스
            onMemoSave?.();
            memoTextareaRef?.current?.blur();
            searchInputRef?.current?.blur();
            setActiveLayer('kanban');
            setFocusedCard({ row: 0, col: 0 });
            return;
          case 'C':
          case 'c':
            e.preventDefault();
            // 칸반 카드 영역 포커스
            if (isInInput) {
              (e.target as HTMLElement).blur();
            }
            setActiveLayer('kanban');
            setFocusedCard({ row: 0, col: 0 });
            return;
        }
      }

      // === 검색창에서 Enter: 검색 실행 → 검색 레이어 → 카드 포커스 ===
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey &&
          document.activeElement === searchInputRef?.current) {
        // 검색 실행은 searchInput의 onKeyPress에서 처리됨
        // 여기서는 검색 후 포커스 이동만 지연 처리
        setTimeout(() => {
          searchInputRef?.current?.blur();
          setActiveLayer('search');
          setFocusedCard({ row: 0, col: 0 });
        }, 300);
        return;
      }

      // === ESC: 포커스 해제 (입력 필드 포함) ===
      if (e.key === 'Escape') {
        if (document.activeElement === searchInputRef?.current) {
          searchInputRef.current.blur();
        } else if (document.activeElement === memoTextareaRef?.current) {
          memoTextareaRef.current.blur();
        }
        return;
      }

      // === 이하: 입력 필드가 아닌 경우에만 동작 ===
      if (isInInput) return;

      const { row, col } = focusedCard;
      const maxRow = 1; // 2x2 그리드 (0, 1)
      const maxCol = 1;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (row > 0) {
            setFocusedCard({ row: row - 1, col });
          } else {
            setActiveLayer(prev => (prev === 'kanban' ? 'search' : 'kanban'));
            setFocusedCard({ row: maxRow, col });
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (row < maxRow) {
            setFocusedCard({ row: row + 1, col });
          } else {
            setActiveLayer(prev => (prev === 'kanban' ? 'search' : 'kanban'));
            setFocusedCard({ row: 0, col });
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (col > 0) {
            setFocusedCard({ row, col: col - 1 });
          } else if (activeLayer === 'kanban' && onStepPrev) {
            onStepPrev();
            setFocusedCard({ row, col: maxCol });
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (col < maxCol) {
            setFocusedCard({ row, col: col + 1 });
          } else if (activeLayer === 'kanban' && onStepNext) {
            onStepNext();
            setFocusedCard({ row, col: 0 });
          }
          break;

        case ' ':  // Space
          e.preventDefault();
          setActiveLayer(prev => (prev === 'kanban' ? 'search' : 'kanban'));
          setFocusedCard({ row: 0, col: 0 });
          break;

        case 'Tab':
          e.preventDefault();
          setActiveLayer(prev => (prev === 'kanban' ? 'search' : 'kanban'));
          setFocusedCard({ row: 0, col: 0 });
          break;

        case '/':
          e.preventDefault();
          searchInputRef?.current?.focus();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    focusedCard,
    activeLayer,
    isModalOpen,
    searchInputRef,
    memoTextareaRef,
    setActiveLayer,
    setFocusedCard,
    onMemoSave,
    onSearchExecute,
    onStepPrev,
    onStepNext,
  ]);

  // 휠 스크롤 레이어 전환
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // 카드 영역 내에서만 레이어 전환
      const cardArea = document.getElementById(cardAreaId);
      if (!cardArea?.contains(e.target as Node)) return;

      // 쓰로틀링 (500ms) - 더 부드럽게
      if (isWheelThrottled) return;
      setIsWheelThrottled(true);
      setTimeout(() => setIsWheelThrottled(false), 350); // 500ms → 350ms (70%)

      const direction = e.deltaY > 0 ? 'down' : 'up';

      if (e.deltaY > 0) {
        // 휠 다운 → 경계 lock 후 전환
        if (setWheelDirection) setWheelDirection('down');
        
        if (isAtBoundary) {
          setActiveLayer(prev => (prev === 'kanban' ? 'search' : 'kanban'));
          setFocusedCard({ row: 0, col: focusedCard.col });
          setIsAtBoundary(false);
          if (boundaryTimeoutRef.current) {
            clearTimeout(boundaryTimeoutRef.current);
            boundaryTimeoutRef.current = null;
          }
        } else {
          setIsAtBoundary(true);
          boundaryTimeoutRef.current = setTimeout(() => setIsAtBoundary(false), 700); // 1000ms → 700ms (70%)
        }
      } else if (e.deltaY < 0) {
        // 휠 업 → 경계 lock 후 전환
        if (setWheelDirection) setWheelDirection('up');
        
        if (isAtBoundary) {
          setActiveLayer(prev => (prev === 'kanban' ? 'search' : 'kanban'));
          setFocusedCard({ row: 1, col: focusedCard.col });
          setIsAtBoundary(false);
          if (boundaryTimeoutRef.current) {
            clearTimeout(boundaryTimeoutRef.current);
            boundaryTimeoutRef.current = null;
          }
        } else {
          setIsAtBoundary(true);
          boundaryTimeoutRef.current = setTimeout(() => setIsAtBoundary(false), 700); // 1000ms → 700ms (70%)
        }
      }

      // 휠 방향 표시 2초 후 숨김
      if (wheelDirectionTimeoutRef.current) {
        clearTimeout(wheelDirectionTimeoutRef.current);
      }
      wheelDirectionTimeoutRef.current = setTimeout(() => {
        if (setWheelDirection) setWheelDirection(undefined);
      }, 2000);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (wheelDirectionTimeoutRef.current) {
        clearTimeout(wheelDirectionTimeoutRef.current);
      }
    };
  }, [
    isWheelThrottled,
    focusedCard.col,
    cardAreaId,
    setActiveLayer,
    setFocusedCard,
    setIsWheelThrottled,
    isAtBoundary,
    setIsAtBoundary,
    setWheelDirection,
    boundaryTimeoutRef
  ]);
}