import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function LoginPage() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Mock validation
    // 일반 사원: EMP-001 / 0000
    // 관리자: ADMIN-001 / 0000
    if (employeeId === 'EMP-001' && password === '0000') {
      localStorage.setItem('userRole', 'employee');
      localStorage.setItem('employeeId', 'EMP-001');
      localStorage.setItem('employeeName', '홍길동');
      localStorage.setItem('isAdmin', 'false');
      navigate('/dashboard');
    } else if (employeeId === 'ADMIN-001' && password === '0000') {
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('employeeId', 'ADMIN-001');
      localStorage.setItem('employeeName', '관리자');
      localStorage.setItem('isAdmin', 'true');
      navigate('/dashboard');
    } else if (employeeId && password) {
      setError('입력된 정보가 올바르지 않습니다.');
    } else {
      setError('사번과 비밀번호를 입력하세요.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0047AB] via-[#4A90E2] to-[#0047AB] relative px-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[440px] p-6 sm:p-12">
        {/* Logo */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-[#0047AB] mb-2">
            CALL<span className="text-[#FBBC04]">:</span>ACT
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] tracking-wide">
            상담사 지원 시스템
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          <div>
            <Label htmlFor="employeeId" className="text-[#333333] mb-2 block font-semibold text-sm">
              사번
            </Label>
            <Input
              id="employeeId"
              type="text"
              placeholder="사번을 입력하세요"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="h-11 sm:h-12 border-[#E0E0E0] text-sm sm:text-base"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-[#333333] mb-2 block font-semibold text-sm">
              비밀번호
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 sm:h-12 border-[#E0E0E0] text-sm sm:text-base"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 sm:h-12 bg-[#0047AB] hover:bg-[#003580] text-white rounded-lg mt-6 sm:mt-8 font-bold text-sm sm:text-base"
          >
            로그인
          </Button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-2.5 sm:p-3 bg-[#FEE] border border-[#EA4335] rounded-lg flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[#EA4335] flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs sm:text-sm text-[#EA4335]">{error}</p>
          </div>
        )}

        {/* Demo Accounts */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[#E0E0E0]">
          <p className="text-xs text-[#999999] text-center mb-3">데모 계정</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center bg-[#F5F5F5] p-2.5 sm:p-3 rounded-lg">
              <span className="text-[#666666]">일반 사원</span>
              <span className="font-mono font-semibold text-[#333333]">EMP-001 / 0000</span>
            </div>
            <div className="flex justify-between items-center bg-[#F5F5F5] p-2.5 sm:p-3 rounded-lg">
              <span className="text-[#666666]">관리자</span>
              <span className="font-mono font-semibold text-[#333333]">ADMIN-001 / 0000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}