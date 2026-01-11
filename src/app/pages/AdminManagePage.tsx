import MainLayout from '../components/layout/MainLayout';
import { Search, Plus, Edit, Trash2, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useState } from 'react';
import { employeesData } from '../../data/mockData';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';

export default function AdminManagePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [teamFilter, setTeamFilter] = useState<string>('전체');
  const [positionFilter, setPositionFilter] = useState<string>('전체');
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 팀, 직급 목록 추출
  const teams = ['전체', ...Array.from(new Set(employeesData.map(emp => emp.team)))];
  const positions = ['전체', ...Array.from(new Set(employeesData.map(emp => emp.position)))];

  const filteredEmployees = employeesData.filter(emp => {
    const matchesSearch = emp.name.includes(searchTerm) || 
                          emp.id.includes(searchTerm) ||
                          emp.team.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || emp.status === filterStatus;
    const matchesTeam = teamFilter === '전체' || emp.team === teamFilter;
    const matchesPosition = positionFilter === '전체' || emp.position === positionFilter;
    return matchesSearch && matchesFilter && matchesTeam && matchesPosition;
  });

  // 정렬 함수
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // 정렬된 데이터
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let aValue: any = a[sortColumn as keyof typeof a];
    let bValue: any = b[sortColumn as keyof typeof b];

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

  // 정렬 아이콘 렌더링
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 text-[#999999] ml-1 inline" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-3 h-3 text-[#0047AB] ml-1 inline" /> : 
      <ArrowDown className="w-3 h-3 text-[#0047AB] ml-1 inline" />;
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-60px)] flex flex-col p-3 sm:p-4 gap-3 bg-[#F5F5F5] overflow-y-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-3 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h1 className="text-base font-bold text-[#333333]">사원 관리</h1>
            <Button className="bg-[#0047AB] hover:bg-[#003580] h-8 text-xs px-3 w-full sm:w-auto">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              사원 추가
            </Button>
          </div>
          
          <div className="flex flex-col gap-2">
            {/* Search */}
            <div className="w-full relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999999]" />
              <Input 
                className="pl-8 h-8 text-xs placeholder:text-[10px]" 
                placeholder="사원명, 사번, 팀 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters Row 1 - 팀/직급 */}
            <div className="flex gap-2">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="flex-1 h-8 text-xs border-[#E0E0E0]">
                  <SelectValue placeholder="팀 선택" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team} value={team} className="text-xs">{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="flex-1 h-8 text-xs border-[#E0E0E0]">
                  <SelectValue placeholder="직급 선택" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map(position => (
                    <SelectItem key={position} value={position} className="text-xs">{position}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filters Row 2 - 상태 */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                className={`h-8 text-xs px-2 ${filterStatus === 'all' ? 'bg-[#0047AB]' : ''}`}
              >
                전체
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
                className={`h-8 text-xs px-2 ${filterStatus === 'active' ? 'bg-[#34A853]' : ''}`}
              >
                재직
              </Button>
              <Button
                variant={filterStatus === 'vacation' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('vacation')}
                className={`h-8 text-xs px-2 ${filterStatus === 'vacation' ? 'bg-[#FBBC04]' : ''}`}
              >
                휴가
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('inactive')}
                className={`h-8 text-xs px-2 ${filterStatus === 'inactive' ? 'bg-[#EA4335]' : ''}`}
              >
                비활성
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm p-2.5 text-center border border-[#E0E0E0]">
            <div className="text-xl font-bold text-[#0047AB] mb-0.5">
              {employeesData.length}
            </div>
            <div className="text-[10px] text-[#666666]">전체 사원</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-2.5 text-center border border-[#E0E0E0]">
            <div className="text-xl font-bold text-[#34A853] mb-0.5">
              {employeesData.filter(e => e.status === 'active').length}
            </div>
            <div className="text-[10px] text-[#666666]">재직 중</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-2.5 text-center border border-[#E0E0E0]">
            <div className="text-xl font-bold text-[#FBBC04] mb-0.5">
              {employeesData.filter(e => e.status === 'vacation').length}
            </div>
            <div className="text-[10px] text-[#666666]">휴가 중</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-2.5 text-center border border-[#E0E0E0]">
            <div className="text-xl font-bold text-[#EA4335] mb-0.5">
              {employeesData.filter(e => e.status === 'inactive').length}
            </div>
            <div className="text-[10px] text-[#666666]">비활성</div>
          </div>
        </div>

        {/* Employee Table/List */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-[#E0E0E0] flex flex-col overflow-hidden min-h-0 flex-shrink-0">
          <div className="px-3 py-2 border-b border-[#E0E0E0] flex-shrink-0">
            <h2 className="text-sm font-bold text-[#333333]">
              사원 목록 ({filteredEmployees.length}명)
            </h2>
          </div>
          
          {/* 데스크톱 테이블 */}
          <div className="hidden lg:block flex-1 overflow-y-auto overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-[#E0E0E0] sticky top-0 bg-white">
                <tr>
                  <th className="text-center text-[11px] font-semibold text-[#666666] py-2 px-3 w-[100px] cursor-pointer align-middle" onClick={() => handleSort('id')}>
                    사번 {renderSortIcon('id')}
                  </th>
                  <th className="text-center text-[11px] font-semibold text-[#666666] py-2 px-3 w-[100px] cursor-pointer align-middle" onClick={() => handleSort('name')}>
                    이름 {renderSortIcon('name')}
                  </th>
                  <th className="text-center text-[11px] font-semibold text-[#666666] py-2 px-3 w-[100px] cursor-pointer align-middle" onClick={() => handleSort('team')}>
                    소속 {renderSortIcon('team')}
                  </th>
                  <th className="text-center text-[11px] font-semibold text-[#666666] py-2 px-3 w-[80px] cursor-pointer align-middle" onClick={() => handleSort('position')}>
                    직급 {renderSortIcon('position')}
                  </th>
                  <th className="text-center text-[11px] font-semibold text-[#666666] py-2 px-3 w-[100px] cursor-pointer align-middle" onClick={() => handleSort('status')}>
                    상태 {renderSortIcon('status')}
                  </th>
                  <th className="text-center text-[11px] font-semibold text-[#666666] py-2 px-3 w-[180px] cursor-pointer align-middle" onClick={() => handleSort('email')}>
                    이메일 {renderSortIcon('email')}
                  </th>
                  <th className="text-center text-[11px] font-semibold text-[#666666] py-2 px-3 w-[120px] cursor-pointer align-middle" onClick={() => handleSort('phone')}>
                    연락처 {renderSortIcon('phone')}
                  </th>
                  <th className="text-center text-[11px] font-semibold text-[#666666] py-2 px-3 w-[100px] cursor-pointer align-middle" onClick={() => handleSort('joinDate')}>
                    입사일 {renderSortIcon('joinDate')}
                  </th>
                  <th className="text-center text-[11px] font-semibold text-[#666666] py-2 px-3 w-[120px] align-middle">관리</th>
                </tr>
              </thead>
              <tbody>
                {sortedEmployees.map((emp) => (
                  <tr 
                    key={emp.id}
                    className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA] transition-colors"
                  >
                    <td className="py-2 px-3 text-center align-middle">
                      <span className="text-xs text-[#666666] font-mono">{emp.id}</span>
                    </td>
                    <td className="py-2 px-3 text-center align-middle">
                      <span className="text-xs font-semibold text-[#333333]">{emp.name}</span>
                    </td>
                    <td className="py-2 px-3 text-center align-middle">
                      <span className="text-xs text-[#666666]">{emp.team}</span>
                    </td>
                    <td className="py-2 px-3 text-center align-middle">
                      <span className="text-xs px-2 py-1 bg-[#E8F1FC] text-[#0047AB] rounded">
                        {emp.position}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center align-middle">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        emp.status === 'active' ? 'bg-[#E8F5E9] text-[#34A853]' :
                        emp.status === 'vacation' ? 'bg-[#FFF9E6] text-[#FBBC04]' :
                        'bg-[#F5F5F5] text-[#999999]'
                      }`}>
                        {emp.status === 'active' ? '재직' : emp.status === 'vacation' ? '휴가' : '비활성'}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center align-middle">
                      <span className="text-xs text-[#666666]">{emp.email}</span>
                    </td>
                    <td className="py-2 px-3 text-center align-middle">
                      <span className="text-xs text-[#666666] font-mono">{emp.phone}</span>
                    </td>
                    <td className="py-2 px-3 text-center align-middle">
                      <span className="text-xs text-[#666666]">{emp.joinDate}</span>
                    </td>
                    <td className="py-2 px-3 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="sm" className="h-8">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-[#EA4335] hover:text-[#EA4335] hover:bg-[#FFEBEE]">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일/태블릿 카드 뷰 */}
          <div className="lg:hidden flex-1 overflow-y-auto p-3">
            <div className="space-y-3">
              {sortedEmployees.map((emp) => (
                <div 
                  key={emp.id}
                  className="bg-white border border-[#E0E0E0] rounded-lg p-3 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-[#333333]">{emp.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-[#E8F1FC] text-[#0047AB] rounded">
                          {emp.position}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#999999] font-mono">{emp.id}</div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                      emp.status === 'active' ? 'bg-[#E8F5E9] text-[#34A853]' :
                      emp.status === 'vacation' ? 'bg-[#FFF9E6] text-[#FBBC04]' :
                      'bg-[#F5F5F5] text-[#999999]'
                    }`}>
                      {emp.status === 'active' ? '재직' : emp.status === 'vacation' ? '휴가' : '비활성'}
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#999999] w-12">소속:</span>
                      <span className="text-[#333333]">{emp.team}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#999999] w-12">이메일:</span>
                      <span className="text-[#333333] truncate">{emp.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#999999] w-12">연락처:</span>
                      <span className="text-[#333333] font-mono">{emp.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#999999] w-12">입사일:</span>
                      <span className="text-[#333333]">{emp.joinDate}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-[#E0E0E0]">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
                      <Edit className="w-3 h-3 mr-1" />
                      수정
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs text-[#EA4335] hover:text-[#EA4335] hover:bg-[#FFEBEE]">
                      <Trash2 className="w-3 h-3 mr-1" />
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}