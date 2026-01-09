import MainLayout from '../components/layout/MainLayout';
import { Eye, Pin } from 'lucide-react';
import { useState, useEffect } from 'react';
import AnnouncementModal from '../components/modals/AnnouncementModal';
import { noticesData as initialNoticesData } from '../../data/mockData';

export default function NoticePage() {
  const [notices, setNotices] = useState(initialNoticesData);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  // localStorage에서 관리자가 고정한 공지사항 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('pinnedAnnouncements');
    if (saved) {
      try {
        const pinnedAnnouncements = JSON.parse(saved);
        if (pinnedAnnouncements.length > 0) {
          const pinnedIds = pinnedAnnouncements.map((n: any) => n.id);
          setNotices(prev => 
            prev.map(notice => ({
              ...notice,
              pinned: pinnedIds.includes(notice.id)
            }))
          );
        }
      } catch (e) {
        console.error('Failed to load pinned announcements', e);
      }
    }
  }, []);

  const handleAnnouncementClick = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setIsAnnouncementModalOpen(true);
    
    // 조회수 증가
    setNotices(prev =>
      prev.map(n =>
        n.id === announcement.id ? { ...n, views: n.views + 1 } : n
      )
    );
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-60px)] flex flex-col p-4 gap-3 bg-[#F5F5F5]">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-3 flex-shrink-0">
          <h1 className="text-base font-bold text-[#333333]">📢 공지사항</h1>
          <p className="text-[11px] text-[#666666] mt-0.5">중요한 공지사항을 확인하세요</p>
        </div>

        {/* Notices List - 2열로, 스크롤은 페이지 전체 */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {notices.sort((a, b) => {
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              return b.id - a.id;
            }).map((notice) => (
              <div 
                key={notice.id}
                onClick={() => handleAnnouncementClick(notice)}
                className={`bg-white rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md p-3 ${
                  notice.pinned 
                    ? 'border-[#FBBC04] ring-1 ring-[#FFF9E6]' 
                    : 'border-[#E0E0E0] hover:border-[#0047AB]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {notice.pinned && (
                      <Pin className="w-3 h-3 text-[#FBBC04] fill-current flex-shrink-0" />
                    )}
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                      notice.tag === '긴급' ? 'bg-[#FFEBEE] text-[#EA4335]' :
                      notice.tag === '시스템' ? 'bg-[#FFF9E6] text-[#FBBC04]' :
                      notice.tag === '이벤트' ? 'bg-[#E8F1FC] text-[#0047AB]' :
                      notice.tag === '교육' ? 'bg-[#F3E5F5] text-[#9C27B0]' :
                      notice.tag === '정책' ? 'bg-[#E0F2F1] text-[#00897B]' :
                      notice.tag === '근무' ? 'bg-[#FFF3E0] text-[#F57C00]' :
                      notice.tag === '복지' ? 'bg-[#E3F2FD] text-[#1976D2]' :
                      'bg-[#E8F1FC] text-[#0047AB]'
                    }`}>
                      [{notice.tag}]
                    </span>
                    {notice.pinned && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#FBBC04] text-white rounded">
                        고정
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#999999]">{notice.date}</span>
                </div>
                
                <h3 className="font-bold text-xs text-[#333333] mb-1.5 line-clamp-1">
                  {notice.title}
                </h3>
                
                <p className="text-[11px] text-[#666666] mb-2 line-clamp-2 leading-relaxed">
                  {notice.content}
                </p>
                
                <div className="flex items-center justify-between text-[11px] text-[#999999]">
                  <span>작성자: {notice.author}</span>
                  <div className="flex items-center gap-0.5">
                    <Eye className="w-3 h-3" />
                    {notice.views}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedAnnouncement && (
        <AnnouncementModal
          isOpen={isAnnouncementModalOpen}
          onClose={() => setIsAnnouncementModalOpen(false)}
          announcement={selectedAnnouncement}
        />
      )}
    </MainLayout>
  );
}