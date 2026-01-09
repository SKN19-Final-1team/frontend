import MainLayout from '../components/layout/MainLayout';
import { Plus, Edit, Trash2, Pin, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useState, useEffect } from 'react';
import { noticesData as initialNoticesData } from '../../data/mockData';

export default function AdminNoticePage() {
  const [notices, setNotices] = useState(initialNoticesData);

  // 공지사항이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    const pinnedNotices = notices.filter(n => n.pinned);
    localStorage.setItem('pinnedAnnouncements', JSON.stringify(pinnedNotices));
  }, [notices]);

  // 초기 로드 시 localStorage에서 가져오기
  useEffect(() => {
    const saved = localStorage.getItem('pinnedAnnouncements');
    if (saved) {
      try {
        const pinnedIds = JSON.parse(saved).map((n: any) => n.id);
        setNotices(prev => 
          prev.map(notice => ({
            ...notice,
            pinned: pinnedIds.includes(notice.id)
          }))
        );
      } catch (e) {
        console.error('Failed to load pinned announcements', e);
      }
    }
  }, []);

  // 공지 픽스 토글
  const togglePin = (id: number) => {
    setNotices(prev =>
      prev.map(notice =>
        notice.id === id ? { ...notice, pinned: !notice.pinned } : notice
      )
    );
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-60px)] flex flex-col p-4 gap-3 bg-[#F5F5F5]">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-bold text-[#333333]">공지사항 관리</h1>
            <Button className="bg-[#0047AB] hover:bg-[#003580] h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              공지 작성
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm p-2.5 text-center border border-[#E0E0E0]">
            <div className="text-lg font-bold text-[#0047AB] mb-0.5">
              {notices.length}
            </div>
            <div className="text-[10px] text-[#666666]">전체 공지</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-2.5 text-center border border-[#E0E0E0]">
            <div className="text-lg font-bold text-[#EA4335] mb-0.5">
              {notices.filter(n => n.tag === '긴급').length}
            </div>
            <div className="text-[10px] text-[#666666]">긴급 공지</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-2.5 text-center border border-[#E0E0E0]">
            <div className="text-lg font-bold text-[#FBBC04] mb-0.5">
              {notices.filter(n => n.pinned).length}
            </div>
            <div className="text-[10px] text-[#666666]">고정 공지</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-2.5 text-center border border-[#E0E0E0]">
            <div className="text-lg font-bold text-[#34A853] mb-0.5">
              {notices.reduce((sum, n) => sum + n.views, 0)}
            </div>
            <div className="text-[10px] text-[#666666]">총 조회수</div>
          </div>
        </div>

        {/* Notices Table */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-[#E0E0E0] flex flex-col overflow-hidden min-h-0">
          <div className="px-5 py-3 border-b border-[#E0E0E0] flex-shrink-0">
            <h2 className="font-bold text-[#333333]">공지사항 목록</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <table className="w-full">
              <thead className="border-b-2 border-[#E0E0E0]">
                <tr>
                  <th className="text-center text-xs font-semibold text-[#666666] pb-3 w-[60px]">고정</th>
                  <th className="text-left text-xs font-semibold text-[#666666] pb-3 w-[100px]">분류</th>
                  <th className="text-left text-xs font-semibold text-[#666666] pb-3">제목</th>
                  <th className="text-left text-xs font-semibold text-[#666666] pb-3 w-[100px]">작성자</th>
                  <th className="text-center text-xs font-semibold text-[#666666] pb-3 w-[100px]">조회수</th>
                  <th className="text-center text-xs font-semibold text-[#666666] pb-3 w-[120px]">작성일</th>
                  <th className="text-center text-xs font-semibold text-[#666666] pb-3 w-[120px]">관리</th>
                </tr>
              </thead>
              <tbody>
                {notices.sort((a, b) => {
                  if (a.pinned && !b.pinned) return -1;
                  if (!a.pinned && b.pinned) return 1;
                  return b.id - a.id;
                }).map((notice) => (
                  <tr 
                    key={notice.id}
                    className={`border-b border-[#F0F0F0] hover:bg-[#F8F9FA] transition-colors ${
                      notice.pinned ? 'bg-[#FFF9E6]' : ''
                    }`}
                  >
                    <td className="py-3 text-center">
                      <button
                        onClick={() => togglePin(notice.id)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-[#FFF9E6] rounded transition-colors mx-auto"
                        title={notice.pinned ? '고정 해제' : '대시보드에 고정'}
                      >
                        <Pin 
                          className={`w-4 h-4 ${
                            notice.pinned 
                              ? 'text-[#FBBC04] fill-current' 
                              : 'text-[#999999]'
                          }`} 
                        />
                      </button>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        notice.tag === '긴급' ? 'bg-[#FFEBEE] text-[#EA4335]' :
                        notice.tag === '시스템' ? 'bg-[#FFF9E6] text-[#FBBC04]' :
                        'bg-[#E8F1FC] text-[#0047AB]'
                      }`}>
                        [{notice.tag}]
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {notice.pinned && (
                          <span className="text-xs px-2 py-0.5 bg-[#FBBC04] text-white rounded">
                            고정
                          </span>
                        )}
                        <span className="text-sm font-medium text-[#333333]">{notice.title}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-[#666666]">{notice.author}</span>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-[#666666]">
                        <Eye className="w-3 h-3" />
                        {notice.views}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-sm text-[#666666]">{notice.date}</span>
                    </td>
                    <td className="py-3">
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
        </div>
      </div>
    </MainLayout>
  );
}