import MainLayout from '../components/layout/MainLayout';
import { Plus, Edit, Trash2, Pin, Eye, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { noticesData as initialNoticesData } from '../../data/mockData';

export default function AdminNoticePage() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState(initialNoticesData);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('전체');
  const [authorFilter, setAuthorFilter] = useState('전체');

  // 초기 로드: LocalStorage에서 공지사항 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('notices');
    if (saved) {
      try {
        const parsedNotices = JSON.parse(saved);
        setNotices(parsedNotices);
      } catch (e) {
        console.error('Failed to load notices', e);
      }
    }
  }, []);

  // 공지사항이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('notices', JSON.stringify(notices));
    
    // 고정 공지사항만 따로 저장 (대시보드용)
    const pinnedNotices = notices.filter(n => n.pinned);
    localStorage.setItem('pinnedAnnouncements', JSON.stringify(pinnedNotices));
  }, [notices]);

  // 공지 픽스 토글
  const togglePin = (id: number) => {
    setNotices(prev =>
      prev.map(notice =>
        notice.id === id ? { ...notice, pinned: !notice.pinned } : notice
      )
    );
  };

  // 공지 삭제
  const handleDelete = (id: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      setNotices(prev => prev.filter(n => n.id !== id));
    }
  };

  // 필터링된 공지사항
  const tags = ['전체', ...Array.from(new Set(notices.map(n => n.tag)))];
  const authors = ['전체', ...Array.from(new Set(notices.map(n => n.author)))];

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         notice.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = tagFilter === '전체' || notice.tag === tagFilter;
    const matchesAuthor = authorFilter === '전체' || notice.author === authorFilter;
    return matchesSearch && matchesTag && matchesAuthor;
  });

  return (
    <MainLayout>
      <div className="h-[calc(100vh-60px)] flex flex-col p-3 gap-3 bg-[#F5F5F5] overflow-hidden">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-[#333333]">공지사항 관리</h1>
            <Button className="bg-[#0047AB] hover:bg-[#003580] h-7 text-[10px] px-2.5" onClick={() => navigate('/admin/notice/create')}>
              <Plus className="w-3 h-3 mr-1" />
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
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-[#E0E0E0] flex flex-col overflow-hidden min-h-0">
          <div className="px-4 py-3 border-b border-[#E0E0E0] flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#333333]">공지사항 목록</h2>
              <span className="text-xs text-[#666666]">검색결과: {filteredNotices.length}건</span>
            </div>
            
            {/* 검색 및 필터 */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999999]" />
                <Input 
                  className="pl-8 h-8 text-xs placeholder:text-xs" 
                  placeholder="제목 또는 내용 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#666666] whitespace-nowrap">분류</span>
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="w-[100px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map(tag => (
                      <SelectItem key={tag} value={tag} className="text-xs">{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#666666] whitespace-nowrap">작성자</span>
                <Select value={authorFilter} onValueChange={setAuthorFilter}>
                  <SelectTrigger className="w-[100px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {authors.map(author => (
                      <SelectItem key={author} value={author} className="text-xs">{author}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white border-b-2 border-[#E0E0E0]">
                <tr>
                  <th className="text-center text-xs font-semibold text-[#666666] py-3 min-w-[60px] w-[60px]">고정</th>
                  <th className="text-left text-xs font-semibold text-[#666666] py-3 min-w-[100px] w-[100px] pl-4">분류</th>
                  <th className="text-left text-xs font-semibold text-[#666666] py-3 pl-4">제목</th>
                  <th className="text-left text-xs font-semibold text-[#666666] py-3 min-w-[90px] w-[90px] pl-4">작성자</th>
                  <th className="text-center text-xs font-semibold text-[#666666] py-3 min-w-[70px] w-[70px]">조회수</th>
                  <th className="text-center text-xs font-semibold text-[#666666] py-3 min-w-[100px] w-[100px]">작성일</th>
                  <th className="text-center text-xs font-semibold text-[#666666] py-3 min-w-[140px] w-[140px]">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotices.sort((a, b) => {
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
                    <td className="py-3 pl-4">
                      <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                        notice.tag === '긴급' ? 'bg-[#FFEBEE] text-[#EA4335]' :
                        notice.tag === '시스템' ? 'bg-[#FFF9E6] text-[#FBBC04]' :
                        'bg-[#E8F1FC] text-[#0047AB]'
                      }`}>
                        [{notice.tag}]
                      </span>
                    </td>
                    <td className="py-3 pl-4">
                      <div className="flex items-center gap-2">
                        {notice.pinned && (
                          <span className="text-xs px-2 py-0.5 bg-[#FBBC04] text-white rounded whitespace-nowrap">
                            고정
                          </span>
                        )}
                        <span className="text-sm font-medium text-[#333333]">{notice.title}</span>
                      </div>
                    </td>
                    <td className="py-3 pl-4">
                      <span className="text-sm text-[#666666] whitespace-nowrap">{notice.author}</span>
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
                        <Button variant="outline" size="sm" className="h-8" onClick={() => navigate(`/admin/notice/edit/${notice.id}`)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-[#EA4335] hover:text-[#EA4335] hover:bg-[#FFEBEE]" onClick={() => handleDelete(notice.id)}>
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