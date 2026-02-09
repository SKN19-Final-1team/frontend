import { User, LogOut, Settings, Menu, Home, Phone, BookOpen, Users, BarChart3, Megaphone, HelpCircle, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect, useMemo } from 'react';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ⭐ sessionStorage에서 교육 모드 확인 (location.state는 일회성이므로 sessionStorage 사용)
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [educationType, setEducationType] = useState<'basic' | 'advanced'>('basic');
  const [isGuideModeActive, setIsGuideModeActive] = useState(false);
  
  // ⭐ 진행 중인 통화/후처리 상태 확인
  const [activeCallState, setActiveCallState] = useState<{ isActive: boolean; startTimestamp: number } | null>(null);
  const [pendingACW, setPendingACW] = useState<{ consultationId: string } | null>(null);
  const [currentCallTime, setCurrentCallTime] = useState(0); // 실시간 카운팅용
  
  useEffect(() => {
    // sessionStorage에서 교육 모드 확인
    const simulationMode = sessionStorage.getItem('simulationMode') === 'true';
    setIsSimulationMode(simulationMode);
    
    // sessionStorage에서 교육 타입 확인
    const eduType = sessionStorage.getItem('educationType') as 'basic' | 'advanced' | null;
    setEducationType(eduType || 'basic');
    
    // localStorage에서 가이드 모드 확인
    const guideModeActive = localStorage.getItem('isGuideModeActive') === 'true';
    setIsGuideModeActive(guideModeActive);
    
    console.log('🔍 [Header] isSimulationMode:', simulationMode);
    console.log('🔍 [Header] educationType:', eduType);
    console.log('🔍 [Header] isGuideModeActive:', guideModeActive);
    console.log('🔍 [Header] pathname:', location.pathname);
    
    // ⭐ 교육 모드 유지 경로: 상담 페이지, 로딩 페이지, 후처리 페이지
    const keepSimulationPaths = ['/consultation/live', '/loading', '/acw'];
    if (!keepSimulationPaths.includes(location.pathname)) {
      sessionStorage.removeItem('simulationMode');
      sessionStorage.removeItem('educationType');
      setIsSimulationMode(false);
    }
  }, [location.pathname]);
  
  // ⭐ 진행 중인 통화/후처리 상태 실시간 확인 (1초마다)
  useEffect(() => {
    const checkActiveStates = () => {
      // 진행 중인 통화 확인
      const activeCallStr = localStorage.getItem('activeCallState');
      if (activeCallStr) {
        try {
          const callState = JSON.parse(activeCallStr);
          setActiveCallState(callState);
          
          // 실시간 카운팅 계산
          if (callState.startTimestamp) {
            const elapsed = Math.floor((Date.now() - callState.startTimestamp) / 1000);
            setCurrentCallTime(elapsed);
          }
        } catch {
          setActiveCallState(null);
        }
      } else {
        setActiveCallState(null);
        setCurrentCallTime(0);
      }
      
      // 미처리 후처리 확인
      const pendingACWStr = localStorage.getItem('pendingACW');
      if (pendingACWStr) {
        try {
          const acwState = JSON.parse(pendingACWStr);
          setPendingACW(acwState);
        } catch {
          setPendingACW(null);
        }
      } else {
        setPendingACW(null);
      }
      
      // 가이드 모드 활성화 상태 확인
      const guideModeActive = localStorage.getItem('isGuideModeActive') === 'true';
      setIsGuideModeActive(guideModeActive);
    };
    
    // 초기 확인
    checkActiveStates();
    
    // 1초마다 확인
    const interval = setInterval(checkActiveStates, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const themeColor = isSimulationMode ? '#10B981' : '#0047AB';
  const themeTextClass = isSimulationMode ? 'text-[#10B981]' : 'text-[#0047AB]';

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  const employeeId = localStorage.getItem('employeeId') || 'EMP-001';
  const employeeName = localStorage.getItem('employeeName') || '홍길동';
  const isAdmin = employeeId.startsWith('ADMIN');
  const userRole = localStorage.getItem('userRole');

  // Outside click handler를 최적화
  useEffect(() => {
    // 메뉴가 열려있을 때만 이벤트 리스너 추가
    if (!isDropdownOpen && !isMobileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, isMobileMenuOpen]); // 상태 변경 시에만 재실행

  const handleLogout = () => {
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeName');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  // 메뉴 아이템을 useMemo로 메모이제이션
  const menuItems = useMemo(() => [
    { label: '대시보드', icon: Home, path: '/dashboard' },
    { label: '상담 시작', icon: Phone, path: '/consultation/live' },
    { label: '교육 시뮬레이션', icon: BookOpen, path: '/simulation' },
    { label: '사원 목록', icon: Users, path: '/employees' },
  ], []);

  const adminMenuItems = useMemo(() => [
    { label: '총괄 현황', icon: BarChart3, path: '/admin/stats' },
    { label: '사원 관리', icon: Settings, path: '/admin/manage' },
    { label: '상담 관리', icon: Phone, path: '/admin/consultations' },
    { label: '공지사항 관리', icon: Megaphone, path: '/admin/notice' },
  ], []);

  const handleMenuClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };
  
  // 교육 모드에 따른 배경색 (그라데이션)
  const headerBgClass = isSimulationMode 
    ? (educationType === 'advanced' 
        ? 'bg-gradient-to-r from-amber-50 to-yellow-50' 
        : 'bg-gradient-to-r from-green-50 to-emerald-50')
    : 'bg-white';
  
  const headerBorderClass = isSimulationMode 
    ? (educationType === 'advanced' 
        ? 'border-amber-200/40' 
        : 'border-[#10B981]/30')
    : 'border-[#E0E0E0]';
  
  // 교육 모드 정보 텍스트
  const educationModeTitle = educationType === 'advanced' 
    ? '우수 상담 사례 학습 모드' 
    : '교육 시뮬레이션 모드';
  
  const educationModeSubtitle = educationType === 'advanced'
    ? '실제 우수 사례 기반 모방 학습 및 유사도 평가'
    : 'AI 시나리오 기반 상담 역량 연습 및 피드백';

  return (
    <header className={`h-[60px] ${headerBgClass} border-b ${headerBorderClass} flex items-center justify-between px-3 sm:px-6 fixed top-0 left-0 right-0 z-50 transition-colors duration-300`}>
      <style>{`
        @keyframes textShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-text-shimmer {
          background: linear-gradient(
            90deg, 
            #059669 0%, 
            #34D399 25%, 
            #059669 50%, 
            #34D399 75%, 
            #059669 100%
          );
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: textShimmer 3s linear infinite;
        }
      `}</style>
      {/* Left Side - Logo & Mobile Menu */}
      <div className="flex items-center gap-2">
        {/* Mobile Menu Button (lg 미만에서만 표시) */}
        <div className="lg:hidden relative" ref={mobileMenuRef}>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
            aria-label="메뉴"
          >
            <Menu className="w-5 h-5 text-[#333333]" />
          </button>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-[#E0E0E0] py-2 z-50">
              {/* 일반 메뉴 */}
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleMenuClick(item.path)}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                      isActive 
                        ? 'bg-[#E8F1FC] text-[#0047AB] font-semibold' 
                        : 'text-[#333333] hover:bg-[#F5F5F5]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}

              {/* 관리자 메뉴 */}
              {userRole === 'admin' && (
                <>
                  <div className="h-px bg-[#E0E0E0] my-2"></div>
                  <div className="px-4 py-1">
                    <span className="text-[10px] text-[#999999] font-semibold uppercase">관리자</span>
                  </div>
                  {adminMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleMenuClick(item.path)}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                          isActive 
                            ? 'bg-[#E8F1FC] text-[#0047AB] font-semibold' 
                            : 'text-[#333333] hover:bg-[#F5F5F5]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate('/dashboard')}
          className="hover:opacity-80 transition-opacity flex items-center gap-3"
        >
          <h1 className={`text-base sm:text-lg font-bold ${themeTextClass}`}>CALL:ACT</h1>
          
          {/* Simulation Mode Text with Shimmer Animation */}
          {isSimulationMode && (
            <span className="text-sm font-extrabold animate-text-shimmer tracking-wider hidden sm:block">
              TRAINING MODE
            </span>
          )}
        </button>
        
        {/* ⭐ 가이드 배지 (교육 모드이고 가이드 활성화 시) */}
        {isSimulationMode && isGuideModeActive && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 text-gray-900 rounded-lg shadow-sm animate-pulse">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-bold">가이드</span>
          </span>
        )}
        
        {/* ⭐ 가이드 시작 버튼 (교육 모드이고 가이드 비활성화 시) */}
        {isSimulationMode && !isGuideModeActive && ['/consultation/live', '/acw', '/simulation'].includes(location.pathname) && (
          <button
            onClick={() => {
              // localStorage에 가이드 시작 요청 플래그 설정
              localStorage.setItem('startGuideRequested', 'true');
              window.dispatchEvent(new Event('storage'));
            }}
            className="flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 shadow-sm"
            title="교육 가이드 다시 보기"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-xs font-medium">가이드</span>
          </button>
        )}
        
        {/* ⭐ 진행 중 상태 배지 */}
        {activeCallState && activeCallState.isActive && (
          <button
            onClick={() => navigate('/consultation/live')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-[#EA4335] to-[#D32F2F] text-white rounded-lg hover:shadow-lg transition-all text-xs font-semibold"
            title="진행 중인 통화로 이동"
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <span className="hidden sm:inline">통화 중</span>
            <span className="tabular-nums">{Math.floor(currentCallTime / 60)}:{String(currentCallTime % 60).padStart(2, '0')}</span>
          </button>
        )}
        
        {pendingACW && !activeCallState && (
          <button
            onClick={() => navigate('/acw')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-[#0047AB] to-[#003580] text-white rounded-lg hover:shadow-lg transition-all text-xs font-semibold"
            title="미처리 후처리로 이동"
          >
            <span className="hidden sm:inline">📝</span>
            <span>후처리 대기</span>
          </button>
        )}
      </div>

      {/* Right Side - Education Mode Info & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* 교육 모드 정보 (교육 모드일 때만 표시) */}
        {isSimulationMode && (
          <div className="text-right hidden lg:block">
            <div className="text-sm font-bold text-gray-800 leading-tight">
              {educationModeTitle}
            </div>
            <div className="text-xs text-gray-600 leading-tight mt-0.5">
              {educationModeSubtitle}
            </div>
          </div>
        )}

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#0047AB] rounded-full flex items-center justify-center">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[10px] text-[#999999]">{isAdmin ? '관리자' : '상담사'}</div>
              <div className="text-xs text-[#333333] font-medium">{employeeName}</div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-[#E0E0E0] py-2 z-50">
              <button
                onClick={() => {
                  navigate('/profile');
                  setIsDropdownOpen(false);
                }}
                className="w-full px-3 sm:px-4 py-2 text-left text-xs text-[#333333] hover:bg-[#F5F5F5] flex items-center gap-2 sm:gap-3 transition-colors"
              >
                <Settings className="w-4 h-4 text-[#666666]" />
                프로필 설정
              </button>
              <div className="h-px bg-[#E0E0E0] my-2"></div>
              <button
                onClick={handleLogout}
                className="w-full px-3 sm:px-4 py-2 text-left text-xs text-[#EA4335] hover:bg-[#FFF5F5] flex items-center gap-2 sm:gap-3 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}