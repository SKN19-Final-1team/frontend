import MainLayout from '../components/layout/MainLayout';
import { Search, Trophy, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '../components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { employeesData } from '../../data/mockData';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [teamFilter, setTeamFilter] = useState<string>('전체');
  const [positionFilter, setPositionFilter] = useState<string>('전체');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const tableBodyRef = useRef<HTMLDivElement>(null);

  // 화면 크기에 따라 표시할 항목 수 동적 계산
  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (tableBodyRef.current) {
        const availableHeight = tableBodyRef.current.clientHeight;
        const rowHeight = 34; // 대략적인 행 높이 (py-1.5 포함)
        const itemCount = Math.floor(availableHeight / rowHeight);
        setItemsPerPage(Math.max(5, itemCount)); // 최소 5개
      }
    };

    calculateItemsPerPage();
    window.addEventListener('resize', calculateItemsPerPage);
    return () => window.removeEventListener('resize', calculateItemsPerPage);
  }, []);

  // 팀, 직급 목록 추출
  const teams = ['전체', ...Array.from(new Set(employeesData.map(emp => emp.team)))];
  const positions = ['전체', ...Array.from(new Set(employeesData.map(emp => emp.position)))];

  const filteredEmployees = employeesData.filter(emp => {
    const matchesSearch = emp.name.includes(searchTerm) || 
                         emp.id.includes(searchTerm) ||
                         emp.team.includes(searchTerm);
    const matchesTeam = teamFilter === '전체' || emp.team === teamFilter;
    const matchesPosition = positionFilter === '전체' || emp.position === positionFilter;
    return matchesSearch && matchesTeam && matchesPosition;
  });

  // Top 3는 항상 전체 데이터에서 각각 한 명씩 가져옴 (rank 1, 2, 3)
  const topPerformers = [1, 2, 3].map(rank => 
    employeesData.find(emp => emp.rank === rank)
  ).filter(Boolean);

  // 정렬 함수
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // 같은 컬럼 클릭 시 방향 토글
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 새로운 컬럼 클릭 시 오름차순으로 시작
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // 정렬된 데이터
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let aValue: any = a[sortColumn as keyof typeof a];
    let bValue: any = b[sortColumn as keyof typeof b];

    // 평균 시간은 문자열이므로 숫자로 변환 (mm:ss -> 초)
    if (sortColumn === 'avgTime') {
      const aSeconds = parseInt(aValue.split(':')[0]) * 60 + parseInt(aValue.split(':')[1]);
      const bSeconds = parseInt(bValue.split(':')[0]) * 60 + parseInt(bValue.split(':')[1]);
      aValue = aSeconds;
      bValue = bSeconds;
    }

    // 추이는 정렬 불가능하므로 순위로 처리
    if (sortColumn === 'trend') {
      return 0;
    }

    if (sortDirection === 'asc') {
      if (typeof aValue === 'string') {
        return aValue.localeCompare(bValue);
      }
      return aValue - bValue;
    } else {
      if (typeof aValue === 'string') {
        return bValue.localeCompare(aValue);
      }
      return bValue - aValue;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = sortedEmployees.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 정렬 아이콘 렌더링
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 text-[#999999] ml-1" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-3 h-3 text-[#0047AB] ml-1" /> : 
      <ArrowDown className="w-3 h-3 text-[#0047AB] ml-1" />;
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-60px)] flex flex-col p-6 gap-4 bg-[#F5F5F5]">
        {/* Header with Top 3 + Search Box (Search on the right) */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          {/* Top 3 Performers - 컴팩트 카드 */}
          {topPerformers.map((emp, index) => (
            <div 
              key={emp.id}
              className={`bg-gradient-to-br rounded-lg shadow-md p-2.5 text-white relative overflow-hidden ${
                index === 0 ? 'from-[#FBBC04] to-[#F9A825]' :
                index === 1 ? 'from-[#9E9E9E] to-[#757575]' :
                'from-[#CD7F32] to-[#A0522D]'
              }`}
            >
              {/* 메달 아이콘과 이름 - 최상단 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="font-bold text-base">{emp.name}</div>
                </div>
                
                {/* 우측 상단에 사번과 팀 배치 */}
                <div className="text-right">
                  <div className="text-[10px] opacity-90 leading-tight">{emp.id}</div>
                  <div className="text-[10px] opacity-90 leading-tight">{emp.team}</div>
                </div>
              </div>
              
              {/* 상담건수, FCR, 평균시간 - 3개 컬럼 */}
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                <div className="text-center">
                  <div className="opacity-70">상담</div>
                  <div className="font-bold text-xs">{emp.consultations}</div>
                </div>
                <div className="text-center">
                  <div className="opacity-70">FCR</div>
                  <div className="font-bold text-xs">{emp.fcr}%</div>
                </div>
                <div className="text-center">
                  <div className="opacity-70">평균</div>
                  <div className="font-bold text-xs">{emp.avgTime}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Search Box - 우측 */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-3 flex flex-col justify-center">
            <h2 className="text-base font-bold text-[#333333] mb-0.5">사원 검색</h2>
            <p className="text-[10px] text-[#999999] mb-2">총 {employeesData.length}명</p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999999]" />
              <Input 
                className="pl-8 h-8 text-xs placeholder:text-[10px]" 
                placeholder="사원명, 사번, 팀 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Employee Table - 스크롤 없이, 내용 아래로 쭉 표시 */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-[#E0E0E0] overflow-hidden flex flex-col min-h-0">
          <div className="px-5 py-2.5 border-b border-[#E0E0E0] flex-shrink-0 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#333333]">전체 사원 현황</h2>
            
            {/* 필터 컨트롤 */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#666666]">팀</span>
              <Select value={teamFilter} onValueChange={(value) => { setTeamFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-[120px] h-8 text-xs border-[#E0E0E0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team} value={team} className="text-xs">{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-[11px] text-[#666666]">직급</span>
              <Select value={positionFilter} onValueChange={(value) => { setPositionFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-[100px] h-8 text-xs border-[#E0E0E0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {positions.map(position => (
                    <SelectItem key={position} value={position} className="text-xs">{position}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-[11px] text-[#999999]">(검색: {filteredEmployees.length}명)</span>
            </div>
          </div>
          
          <div className="flex-1 p-3">
            <table className="w-full">
              <thead className="border-b-2 border-[#E0E0E0]">
                <tr>
                  <th 
                    className="text-center text-[11px] font-semibold text-[#666666] pb-2 w-[60px] cursor-pointer hover:bg-[#F8F9FA] transition-colors px-2"
                    onClick={() => handleSort('rank')}
                  >
                    순위
                  </th>
                  <th 
                    className="text-left text-[11px] font-semibold text-[#666666] pb-2 w-[120px] cursor-pointer hover:bg-[#F8F9FA] transition-colors px-2"
                    onClick={() => handleSort('id')}
                  >
                    사번
                  </th>
                  <th 
                    className="text-left text-[11px] font-semibold text-[#666666] pb-2 w-[100px] cursor-pointer hover:bg-[#F8F9FA] transition-colors px-2"
                    onClick={() => handleSort('name')}
                  >
                    이름
                  </th>
                  <th 
                    className="text-left text-[11px] font-semibold text-[#666666] pb-2 w-[100px] cursor-pointer hover:bg-[#F8F9FA] transition-colors px-2"
                    onClick={() => handleSort('team')}
                  >
                    소속
                  </th>
                  <th 
                    className="text-left text-[11px] font-semibold text-[#666666] pb-2 w-[80px] cursor-pointer hover:bg-[#F8F9FA] transition-colors px-2"
                    onClick={() => handleSort('position')}
                  >
                    직급
                  </th>
                  <th 
                    className="text-center text-[11px] font-semibold text-[#666666] pb-2 w-[100px] cursor-pointer hover:bg-[#F8F9FA] transition-colors px-2"
                    onClick={() => handleSort('consultations')}
                  >
                    상담 건수
                  </th>
                  <th 
                    className="text-center text-[11px] font-semibold text-[#666666] pb-2 w-[80px] cursor-pointer hover:bg-[#F8F9FA] transition-colors px-2"
                    onClick={() => handleSort('fcr')}
                  >
                    FCR
                  </th>
                  <th 
                    className="text-center text-[11px] font-semibold text-[#666666] pb-2 w-[100px] cursor-pointer hover:bg-[#F8F9FA] transition-colors px-2"
                    onClick={() => handleSort('avgTime')}
                  >
                    평균 시간
                  </th>
                  <th className="text-center text-[11px] font-semibold text-[#666666] pb-2 w-[80px] px-2">
                    추이
                  </th>
                </tr>
              </thead>
              <tbody ref={tableBodyRef}>
                {currentEmployees.map((emp) => (
                  <tr 
                    key={emp.id}
                    className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA] cursor-pointer transition-colors"
                  >
                    <td className="py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {emp.rank <= 3 && <Trophy className="w-3.5 h-3.5 text-[#FBBC04]" />}
                        <span className="font-semibold text-[#0047AB] text-[13px]">{emp.rank}</span>
                      </div>
                    </td>
                    <td className="py-1.5">
                      <span className="text-[13px] text-[#666666] font-mono">{emp.id}</span>
                    </td>
                    <td className="py-1.5">
                      <span className="text-[13px] font-semibold text-[#333333]">{emp.name}</span>
                    </td>
                    <td className="py-1.5">
                      <span className="text-[13px] text-[#666666]">{emp.team}</span>
                    </td>
                    <td className="py-1.5">
                      <span className="text-[11px] px-2 py-0.5 bg-[#E8F1FC] text-[#0047AB] rounded">
                        {emp.position}
                      </span>
                    </td>
                    <td className="py-1.5 text-center">
                      <span className="text-[13px] font-semibold text-[#333333]">{emp.consultations}</span>
                    </td>
                    <td className="py-1.5 text-center">
                      <span className={`text-[13px] font-semibold ${
                        emp.fcr >= 95 ? 'text-[#34A853]' :
                        emp.fcr >= 90 ? 'text-[#FBBC04]' :
                        'text-[#EA4335]'
                      }`}>
                        {emp.fcr}%
                      </span>
                    </td>
                    <td className="py-1.5 text-center">
                      <span className="text-[13px] text-[#666666] font-mono">{emp.avgTime}</span>
                    </td>
                    <td className="py-1.5 text-center">
                      {emp.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-[#34A853] mx-auto" />}
                      {emp.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-[#EA4335] mx-auto" />}
                      {emp.trend === 'same' && <span className="text-[#999999]">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-5 py-2.5 border-t border-[#E0E0E0] flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button 
                className="bg-[#0047AB] hover:bg-[#003380] disabled:bg-[#E0E0E0] disabled:text-[#999999] text-white border-0 px-3 py-1.5 rounded transition-colors"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-[#666666] min-w-[60px] text-center">
                {currentPage} / {totalPages}
              </span>
              <Button 
                className="bg-[#0047AB] hover:bg-[#003380] disabled:bg-[#E0E0E0] disabled:text-[#999999] text-white border-0 px-3 py-1.5 rounded transition-colors"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#666666]">페이지 이동:</span>
              <Input 
                className="w-16 h-8 px-2 text-sm text-[#666666] border border-[#E0E0E0] rounded"
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 1 && value <= totalPages) {
                    handlePageChange(value);
                  }
                }}
                min="1"
                max={totalPages}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}