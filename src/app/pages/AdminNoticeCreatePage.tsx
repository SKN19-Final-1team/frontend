import MainLayout from '../components/layout/MainLayout';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showWarning } from '@/utils/toast';

export default function AdminNoticeCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    tag: '공지' as '긴급' | '시스템' | '이벤트' | '교육' | '정책' | '근무' | '복지' | '공지',
    content: '',
    pinned: false,
    author: '관리자', // 실제로는 로그인한 사용자 정보
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      showWarning('제목과 내용을 입력해주세요.');
      return;
    }

    // 새 공지사항 생성
    const newNotice = {
      id: Date.now(),
      title: formData.title,
      tag: formData.tag,
      content: formData.content,
      author: formData.author,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      views: 0,
      pinned: formData.pinned,
    };

    // LocalStorage에서 기존 공지사항 목록 가져오기
    const savedNotices = localStorage.getItem('notices');
    let notices = [];
    
    if (savedNotices) {
      try {
        notices = JSON.parse(savedNotices);
      } catch (e) {
        console.error('Failed to parse notices', e);
      }
    }

    // 새 공지사항 추가
    notices.unshift(newNotice);
    localStorage.setItem('notices', JSON.stringify(notices));

    // 고정 공지사항이면 pinnedAnnouncements도 업데이트
    if (formData.pinned) {
      const pinnedNotices = notices.filter((n: any) => n.pinned);
      localStorage.setItem('pinnedAnnouncements', JSON.stringify(pinnedNotices));
    }

    showSuccess('공지사항이 등록되었습니다.');
    navigate('/admin/notice');
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-60px)] flex flex-col p-3 sm:p-4 gap-3 bg-[#F5F5F5] overflow-y-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/notice')}
              className="w-8 h-8 flex items-center justify-center hover:bg-[#F5F5F5] rounded transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#666666]" />
            </button>
            <h1 className="text-base font-bold text-[#333333]">공지사항 작성</h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-4 flex-shrink-0">
          <div className="space-y-4">
            {/* 제목 */}
            <div>
              <Label className="text-xs text-[#666666] mb-1.5 block">
                제목 <span className="text-[#EA4335]">*</span>
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-9 text-xs"
                placeholder="공지사항 제목을 입력하세요"
                required
              />
            </div>

            {/* 태그 & 고정 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#666666] mb-1.5 block">
                  분류 <span className="text-[#EA4335]">*</span>
                </Label>
                <select
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value as any })}
                  className="w-full h-9 px-3 border border-[#E0E0E0] rounded-md text-xs"
                  required
                >
                  <option value="공지">공지</option>
                  <option value="긴급">긴급</option>
                  <option value="시스템">시스템</option>
                  <option value="이벤트">이벤트</option>
                  <option value="교육">교육</option>
                  <option value="정책">정책</option>
                  <option value="근무">근무</option>
                  <option value="복지">복지</option>
                </select>
              </div>

              <div>
                <Label className="text-xs text-[#666666] mb-1.5 block">고정 여부</Label>
                <div className="flex items-center h-9">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.pinned}
                      onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                      className="w-4 h-4 accent-[#0047AB]"
                    />
                    <span className="text-xs text-[#333333]">대시보드에 고정</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 내용 */}
            <div>
              <Label className="text-xs text-[#666666] mb-1.5 block">
                내용 <span className="text-[#EA4335]">*</span>
              </Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="min-h-[300px] border border-[#E0E0E0] rounded-md p-3 text-xs"
                placeholder="공지사항 내용을 입력하세요"
                required
              />
            </div>

            {/* 작성자 */}
            <div>
              <Label className="text-xs text-[#666666] mb-1.5 block">작성자</Label>
              <Input
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="h-9 text-xs"
                placeholder="작성자명"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-[#E0E0E0]">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/notice')}
                className="flex-1 h-10 text-xs"
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10 text-xs bg-[#0047AB] hover:bg-[#003580]"
              >
                <Save className="w-4 h-4 mr-2" />
                공지 등록
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
