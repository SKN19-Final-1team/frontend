import MainLayout from '../components/layout/MainLayout';
import { Search, Filter, Calendar, Download, Eye } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useState } from 'react';
import ConsultationDetailModal from '../components/modals/ConsultationDetailModal';
import { consultationsData } from '../../data/mockData';

export default function ConsultationHistoryPage() {
  const [consultations] = useState(consultationsData.map(c => ({
    ...c,
    title: c.memo || '상담 내용',
    date: c.datetime.split(' ')[0],
    time: c.datetime.split(' ')[1]
  })));
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('전체');

  const filteredConsultations = consultations.filter(item => {
    const matchesSearch = item.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === '전체' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleConsultationClick = (consultation: any) => {
    setSelectedConsultation(consultation);
    setIsConsultationModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-60px)] flex flex-col p-4 gap-3 bg-[#F5F5F5]">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-[#333333]">📋 상담 내역</h1>
              <p className="text-[11px] text-[#666666] mt-0.5">전체 {filteredConsultations.length}건의 상담 내역</p>
            </div>
            <Button className="bg-[#0047AB] hover:bg-[#003580] h-8 text-xs">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              엑셀 다운로드
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] p-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999999]" />
              <Input 
                className="pl-9 h-8 text-xs placeholder:text-xs" 
                placeholder="상담 ID, 고객명, 카테고리 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#666666]" />
              <Button 
                variant={filterStatus === '전체' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('전체')}
                className={`h-7 text-xs ${filterStatus === '전체' ? 'bg-[#0047AB] hover:bg-[#003580]' : ''}`}
              >
                전체
              </Button>
              <Button 
                variant={filterStatus === '완료' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('완료')}
                className={`h-7 text-xs ${filterStatus === '완료' ? 'bg-[#34A853] hover:bg-[#2D8F47]' : ''}`}
              >
                완료
              </Button>
              <Button 
                variant={filterStatus === '진행중' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('진행중')}
                className={`h-7 text-xs ${filterStatus === '진행중' ? 'bg-[#FBBC04] hover:bg-[#F9A825]' : ''}`}
              >
                진행중
              </Button>
              <Button 
                variant={filterStatus === '미완료' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('미완료')}
                className={`h-7 text-xs ${filterStatus === '미완료' ? 'bg-[#EA4335] hover:bg-[#C8362D]' : ''}`}
              >
                미완료
              </Button>
            </div>
          </div>
        </div>

        {/* Consultations Table */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-[#E0E0E0] overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="border-b-2 border-[#E0E0E0] sticky top-0 bg-white">
                <tr>
                  <th className="text-center text-xs font-semibold text-[#666666] px-2.5 py-2.5 w-[110px]">상담 ID</th>
                  <th className="text-center text-xs font-semibold text-[#666666] px-2 py-2.5 w-[70px]">상태</th>
                  <th className="text-center text-xs font-semibold text-[#666666] px-2 py-2.5 w-[85px]">카테고리</th>
                  <th className="text-left text-xs font-semibold text-[#666666] px-2.5 py-2.5">상담 내용</th>
                  <th className="text-center text-xs font-semibold text-[#666666] px-2 py-2.5 w-[70px]">고객명</th>
                  <th className="text-center text-xs font-semibold text-[#666666] px-2 py-2.5 w-[70px]">상담사</th>
                  <th className="text-center text-xs font-semibold text-[#666666] px-2 py-2.5 w-[95px]">일시</th>
                  <th className="text-center text-xs font-semibold text-[#666666] px-2 py-2.5 w-[70px]">통화시간</th>
                  <th className="text-center text-xs font-semibold text-[#666666] px-2 py-2.5 w-[50px]">FCR</th>
                  <th className="text-center text-xs font-semibold text-[#666666] px-2 py-2.5 w-[60px]">상세</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsultations.map((consultation) => (
                  <tr 
                    key={consultation.id}
                    className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA] cursor-pointer transition-colors"
                    onClick={() => handleConsultationClick(consultation)}
                  >
                    <td className="px-2.5 py-2.5 text-center">
                      <span className="text-xs font-mono font-semibold text-[#0047AB] whitespace-nowrap">{consultation.id}</span>
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${
                        consultation.status === '완료' ? 'bg-[#E8F5E9] text-[#34A853]' :
                        consultation.status === '진행중' ? 'bg-[#E3F2FD] text-[#0047AB]' :
                        'bg-[#F5F5F5] text-[#999999]'
                      }`}>
                        {consultation.status}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <span className="text-[11px] px-2 py-0.5 bg-[#E8F1FC] text-[#0047AB] rounded inline-block whitespace-nowrap">
                        {consultation.category}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5 text-xs text-[#333333] truncate max-w-[200px]">{consultation.title}</td>
                    <td className="px-2 py-2.5 text-xs text-[#666666] text-center">{consultation.customer}</td>
                    <td className="px-2 py-2.5 text-xs text-[#666666] text-center">{consultation.agent}</td>
                    <td className="px-2 py-2.5 text-center">
                      <div className="text-xs text-[#666666]">
                        <div className="font-medium">{consultation.date}</div>
                        <div className="text-[11px] text-[#999999] font-mono">{consultation.time}</div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs text-[#666666] font-mono">{consultation.duration}</td>
                    <td className="px-2 py-2.5 text-center">
                      {consultation.fcr ? (
                        <div className="w-5 h-5 bg-[#34A853] text-white rounded-full flex items-center justify-center mx-auto text-xs">
                          ✓
                        </div>
                      ) : (
                        <span className="text-xs text-[#999999]">-</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConsultationClick(consultation);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedConsultation && (
        <ConsultationDetailModal
          isOpen={isConsultationModalOpen}
          onClose={() => setIsConsultationModalOpen(false)}
          consultation={selectedConsultation}
        />
      )}
    </MainLayout>
  );
}