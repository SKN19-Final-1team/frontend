import { Bell, User, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const employeeId = localStorage.getItem('employeeId') || 'EMP-001';
  const employeeName = localStorage.getItem('employeeName') || '홍길동';
  const isAdmin = employeeId.startsWith('ADMIN');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeName');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userRole');
    navigate('/login');
  };
  
  return (
    <header className="h-[60px] bg-white border-b border-[#E0E0E0] flex items-center justify-between px-3 sm:px-6 fixed top-0 left-0 right-0 z-10">
      {/* Logo */}
      <div className="flex items-center">
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