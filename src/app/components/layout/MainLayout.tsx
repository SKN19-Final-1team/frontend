import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useSidebar } from '../../contexts/SidebarContext';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { isSidebarExpanded, setIsSidebarExpanded, isPinned, setIsPinned } = useSidebar();
  const location = useLocation();

  // 최초 호버 시 자동으로 고정
  const handleMouseEnter = () => {
    setIsSidebarExpanded(true);
    setIsPinned(true);
  };

  const handleMouseLeave = () => {
    // 호버로 자동 고정되므로 mouseLeave는 아무 동작 안 함
  };

  // 메인 콘텐츠 클릭 시 사이드바 숨김
  const handleMainClick = () => {
    if (isPinned) {
      setIsPinned(false);
      setIsSidebarExpanded(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Header />
      
      <Sidebar 
        isExpanded={isSidebarExpanded}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* 사이드바가 항상 표시되므로 메인 콘텐츠에 왼쪽 마진 추가 (데스크톱만) */}
      <main 
        className={`mt-[60px] transition-all duration-300 ${isSidebarExpanded ? 'lg:ml-[200px]' : 'lg:ml-[56px]'}`}
        onClick={handleMainClick}
      >
        {children}
      </main>
    </div>
  );
}