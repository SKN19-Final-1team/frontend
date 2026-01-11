import { Bell, User, LogOut, Settings, Menu, Home, Phone, BookOpen, Users, BarChart3, Megaphone } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect, useMemo } from 'react';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
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
  
  return (
    <header className="h-[60px] bg-white border-b border-[#E0E0E0] flex items-center justify-between px-3 sm:px-6 fixed top-0 left-0 right-0 z-10">
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
          className="hover:opacity-80 transition-opacity"
        >
          <h1 className="text-base sm:text-lg font-bold text-[#0047AB]">CALL:ACT</h1>
        </button>
      </div>

      {/* Right Side - Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notification Icon */}
        <button className="relative p-2 hover:bg-[#F5F5F5] rounded-full transition-colors">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#666666]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#EA4335] rounded-full"></span>
        </button>

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