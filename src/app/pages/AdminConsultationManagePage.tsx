import MainLayout from '../components/layout/MainLayout';
import { Search, Play, Pause, Download, Eye, Star, StarOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsultationDetailModal from '../components/modals/ConsultationDetailModal';
import React from 'react';
import { consultationsData as initialConsultationsData } from '../../data/mockData';

export default function AdminConsultationManagePage() {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState(initialConsultationsData);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [playingRow, setPlayingRow] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(312); // 5:12 in seconds
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    agent: '전체',
    category: '전체',
    status: '전체',
  });

  const handleRowSelect = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredConsultations.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredConsultations.map(c => c.id));
    }
  };

  const handlePlayClick = (id: string) => {
    if (playingRow === id) {
      setPlayingRow(null);
      setIsPlaying(false);
    } else {
      setPlayingRow(id);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseInt(e.target.value));
  };

  // 우수사례 토글 기능
  const toggleBestPractice = (id: string) => {
    setConsultations(prev => 
      prev.map(c => 
        c.id === id ? { ...c, isBestPractice: !c.isBestPractice } : c
      )
    );
    // 교육 시뮬레이션 자료로 등록되었다는 알림 표시
    alert(
      consultations.find(c => c.id === id)?.isBestPractice
        ? '우수사례에서 제외되었습니다.'
        : '교육 시뮬레이션 자료로 등록되었습니다!'
    );
  };

  // 일괄 우수사례 등록
  const handleBulkBestPractice = () => {
    setConsultations(prev =>
      prev.map(c =>
        selectedRows.includes(c.id) ? { ...c, isBestPractice: true } : c
      )
    );
    alert(`${selectedRows.length}개의 상담이 교육 시뮬레이션 자료로 등록되었습니다!`);
    setSelectedRows([]);
  };

  // 필터 적용
  const filteredConsultations = consultations.filter(item => {
    const matchesAgent = filters.agent === '전체' || item.agent === filters.agent;
    const matchesCategory = filters.category === '전체' || item.category === filters.category;
    const matchesStatus = filters.status === '전체' || item.status === filters.status;
    const matchesDateFrom = !filters.dateFrom || item.datetime >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || item.datetime <= filters.dateTo + ' 23:59';
    
    return matchesAgent && matchesCategory && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  return (
    <MainLayout>
      <div className="h-[calc(100vh-60px)] flex flex-col p-4 gap-3 bg-[#F5F5F5]">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-3 flex-shrink-0">
          <h1 className="text-base font-bold text-[#333333]">상담 관리</h1>
        </div>

        {/* 필터 바 */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-3 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#666666] font-semibold">기간:</span>
              <input 
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="h-8 px-2 border border-[#E0E0E0] rounded text-xs placeholder:text-[10px]"
                style={{ width: '140px' }}
              />
              <span className="text-xs text-[#666666]">~</span>
              <input 
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="h-8 px-2 border border-[#E0E0E0] rounded text-xs placeholder:text-[10px]"
                style={{ width: '140px' }}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#666666] font-semibold">상담사:</span>
              <select 
                className="h-8 px-2 border border-[#E0E0E0] rounded text-xs"
                style={{ width: '120px' }}
                value={filters.agent}
                onChange={(e) => setFilters({...filters, agent: e.target.value})}
              >
                <option>전체</option>
                <option>홍길동</option>
                <option>이영희</option>
                <option>김민수</option>
                <option>김태희</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#666666] font-semibold">카테고리:</span>
              <select 
                className="h-8 px-2 border border-[#E0E0E0] rounded text-xs"
                style={{ width: '120px' }}
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
              >
                <option>전체</option>
                <option>카드분실</option>
                <option>해외결제</option>
                <option>수수료문의</option>
                <option>포인트</option>
                <option>한도조회</option>
                <option>프로모션</option>
                <option>기타</option>
              </select>
            </div>

            <div className="flex gap-2 ml-auto">
              {['전체', '완료', '진행중', '미완료'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilters({...filters, status})}
                  className={`h-8 px-3 rounded text-xs font-medium transition-colors ${
                    filters.status === status
                      ? 'bg-[#0047AB] text-white'
                      : 'bg-[#F5F5F5] text-[#666666] hover:bg-[#E0E0E0]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="text-xs text-[#666666] font-bold">
              {filteredConsultations.length}건
            </div>
          </div>

          {/* 일괄 작업 바 */}
          {selectedRows.length > 0 && (
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E0E0E0]">
              <span className="text-xs text-[#666666]">{selectedRows.length}개 선택됨</span>
              <Button 
                onClick={handleBulkBestPractice}
                className="bg-[#FBBC04] hover:bg-[#E0A800] text-white h-8 text-xs"
              >
                <Star className="w-3.5 h-3.5 mr-1.5" />
                우수 사례 일괄 등록
              </Button>
            </div>
          )}
        </div>

        {/* 상담 테이블 */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-[#E0E0E0] flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="border-b-2 border-[#E0E0E0] sticky top-0 bg-white z-10">
                <tr>
                  <th className="text-center text-[10px] font-semibold text-[#666666] px-2 py-2 w-10">
                    <input 
                      type="checkbox"
                      checked={selectedRows.length === filteredConsultations.length && filteredConsultations.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="text-center text-[10px] font-semibold text-[#666666] px-2 py-2 w-[110px]">상담 ID</th>
                  <th className="text-center text-[10px] font-semibold text-[#666666] px-2 py-2 w-[70px]">상담사</th>
                  <th className="text-center text-[10px] font-semibold text-[#666666] px-2 py-2 w-[70px]">고객명</th>
                  <th className="text-center text-[10px] font-semibold text-[#666666] px-2 py-2 w-[85px]">카테고리</th>
                  <th className="text-center text-[10px] font-semibold text-[#666666] px-2 py-2 w-[70px]">상태</th>
                  <th className="text-left text-[10px] font-semibold text-[#666666] px-2.5 py-2">상담 내용</th>
                  <th className="text-center text-[10px] font-semibold text-[#666666] px-2 py-2 w-[95px]">일시</th>
                  <th className="text-center text-[10px] font-semibold text-[#666666] px-2 py-2 w-[70px]">통화시간</th>
                  <th className="text-center text-[10px] font-semibold text-[#666666] px-2 py-2 w-12">재생</th>
                  <th className="text-center text-[10px] font-semibold text-[#666666] px-2 py-2 w-12">상세</th>
                  <th className="text-center text-[10px] font-semibold text-[#666666] px-2 py-2 w-16">우수사례</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsultations.flatMap((item) => {
                  const dateTime = item.datetime.split(' ');
                  const date = dateTime[0];
                  const time = dateTime[1];
                  const rows = [
                    <tr 
                      key={item.id}
                      className={`border-b border-[#F0F0F0] hover:bg-[#F8F9FA] transition-all ${
                        playingRow === item.id ? 'bg-[#F8F9FA]' : ''
                      }`}
                    >
                      <td className="px-2 py-2 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedRows.includes(item.id)}
                          onChange={() => handleRowSelect(item.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className="text-[10px] text-[#0047AB] font-mono font-semibold whitespace-nowrap">{item.id}</span>
                      </td>
                      <td className="px-2 py-2 text-[10px] text-[#666666] text-center">{item.agent}</td>
                      <td className="px-2 py-2 text-[10px] text-[#666666] text-center">{item.customer}</td>
                      <td className="px-2 py-2 text-center">
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#E8F1FC] text-[#0047AB] rounded inline-block whitespace-nowrap">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded inline-block whitespace-nowrap ${
                          item.status === '완료' ? 'bg-[#E8F5E9] text-[#34A853]' :
                          item.status === '진행중' ? 'bg-[#E3F2FD] text-[#0047AB]' :
                          'bg-[#F5F5F5] text-[#999999]'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-2.5 py-2 text-[10px] text-[#333333] truncate max-w-[200px]">{item.memo}</td>
                      <td className="px-2 py-2 text-center">
                        <div className="text-[10px] text-[#666666]">
                          <div className="font-medium">{date}</div>
                          <div className="text-[#999999] font-mono">{time}</div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-[10px] text-[#666666] font-mono text-center">{item.duration}</td>
                      <td className="px-2 py-2 text-center">
                        <button 
                          onClick={() => handlePlayClick(item.id)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-[#E8F1FC] rounded transition-colors mx-auto"
                        >
                          <Play className="w-3.5 h-3.5 text-[#0047AB]"/>
                        </button>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button 
                          onClick={() => {
                            setSelectedConsultation(item);
                            setIsConsultationModalOpen(true);
                          }}
                          className="w-6 h-6 flex items-center justify-center hover:bg-[#E8F1FC] rounded transition-colors mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0047AB]"/>
                        </button>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button 
                          onClick={() => toggleBestPractice(item.id)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-[#FFF9E6] rounded transition-colors mx-auto"
                        >
                          {item.isBestPractice ? (
                            <Star className="w-3.5 h-3.5 text-[#FBBC04] fill-current"/>
                          ) : (
                            <StarOff className="w-3.5 h-3.5 text-[#999999]"/>
                          )}
                        </button>
                      </td>
                    </tr>
                  ];
                  
                  if (playingRow === item.id) {
                    rows.push(
                      <tr key={`${item.id}-player`}>
                        <td colSpan={12} className="px-3 pb-2">
                          <div className="bg-[#F8F8F8] rounded p-2.5 flex items-center gap-2">
                            <button 
                              onClick={togglePlayPause}
                              className="w-6 h-6 rounded-full bg-[#0047AB] flex items-center justify-center hover:bg-[#003580] transition-colors flex-shrink-0"
                            >
                              {isPlaying ? (
                                <Pause className="w-3 h-3 text-white"/>
                              ) : (
                                <Play className="w-3 h-3 text-white ml-0.5"/>
                              )}
                            </button>
                            
                            <div className="flex-1">
                              <input
                                type="range"
                                min="0"
                                max={duration}
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full h-0.5 bg-[#E0E0E0] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-[#0047AB] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                              />
                            </div>
                            
                            <span className="text-[10px] text-[#666666] flex-shrink-0 font-mono">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                            
                            <button className="w-4 h-4 flex items-center justify-center hover:bg-[#E0E0E0] rounded transition-colors flex-shrink-0">
                              <Download className="w-3 h-3 text-[#666666]"/>
                            </button>
                            
                            <select className="h-6 text-[10px] bg-transparent border-none text-[#666666] cursor-pointer flex-shrink-0">
                              <option>1x</option>
                              <option>1.5x</option>
                              <option>2x</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  
                  return rows;
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ConsultationDetailModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        consultation={selectedConsultation}
      />
    </MainLayout>
  );
}