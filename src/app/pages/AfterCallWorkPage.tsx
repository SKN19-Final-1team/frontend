import MainLayout from '../components/layout/MainLayout';
import { Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AfterCallWorkPage() {
  const navigate = useNavigate();
  const [memo, setMemo] = useState('');
  const [aiSummary, setAiSummary] = useState(`문의사항: 고객이 카드를 분실하여 즉시 사용 정지 및 재발급 요청

처리 결과: 카드 사용 즉시 정지 처리 완료. 재발급 카드 신청 접수하였으며, 등록된 주소(서울시 강남구 테헤란로 123)로 3-5일 내 배송 예정. 고객에게 배송 추적 안내 완료.`);
  
  const [formData, setFormData] = useState({
    title: '',
    status: '진행중',
    category: '카드분실',
    followUpTasks: '',
    handoffDepartment: '없음',
    handoffNotes: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  // 페이지 로드 시 localStorage에서 메모 불러오기
  useEffect(() => {
    const savedMemo = localStorage.getItem('currentConsultationMemo');
    const callTime = localStorage.getItem('consultationCallTime');
    
    if (savedMemo) {
      setMemo(savedMemo);
    }
    
    // 통화 시간이 있으면 콘솔에 표시 (나중에 UI에 추가 가능)
    if (callTime) {
      console.log('통화 시간:', callTime, '초');
    }
  }, []);

  // 후처리 완료 및 저장
  const handleSaveACW = async () => {
    setIsSaving(true);

    // PostgreSQL + pgvector에 저장할 데이터 준비
    const acwData = {
      consultationId: callInfo.id,
      customerId: customerInfo.id,
      title: formData.title,
      status: formData.status,
      category: formData.category,
      aiSummary: aiSummary,
      memo: memo,
      followUpTasks: formData.followUpTasks,
      handoffDepartment: formData.handoffDepartment,
      handoffNotes: formData.handoffNotes,
      callTime: localStorage.getItem('consultationCallTime'),
      datetime: callInfo.datetime,
    };

    try {
      // TODO: FastAPI 엔드포인트 호출
      // const response = await fetch('/api/consultations/acw', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(acwData)
      // });

      // Mock API 호출 시뮬레이션 (1초 대기)
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('💾 PostgreSQL + pgvector에 저장할 데이터:', acwData);

      // localStorage 완전히 clear
      localStorage.removeItem('currentConsultationMemo');
      localStorage.removeItem('consultationCallTime');

      // 저장 완료 후 상담 중 페이지로 이동 (다음 상담 대기)
      setIsSaving(false);
      
      // 실시간 상담 페이지로 완전한 리로드
      window.location.replace('/consultation/live');
    } catch (error) {
      console.error('저장 실패:', error);
      setIsSaving(false);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // Mock data
  const callTranscript = [
    { speaker: 'customer', message: '안녕하세요, 카드를 분실했어요.', timestamp: '14:32' },
    { speaker: 'agent', message: '안녕하세요. 즉시 카드 사용을 정지하겠습니다.', timestamp: '14:33' },
    { speaker: 'customer', message: '빨리 처리해주세요.', timestamp: '14:33' },
    { speaker: 'agent', message: '카드 사용이 정지되었습니다. 재발급 카드는 3-5일 내 배송됩니다.', timestamp: '14:35' },
    { speaker: 'customer', message: '알겠습니다. 감사합니다.', timestamp: '14:37' },
  ];

  const customerInfo = {
    id: 'CUST-001',
    name: '홍길동',
    phone: '010-1234-5678',
  };

  const callInfo = {
    id: 'CS-20250105-1432',
    datetime: '2025-01-05 14:32',
  };

  const currentCase = {
    category: '카드분실',
    summary: '고객이 카드 분실 신고 요청. 즉시 카드 사용 정지 처리 완료. 재발급 카드 등록 주소로 배송 예정.',
    aiRecommendation: 'AI 추천 처리: 재발급 신청 완료 및 배송 안내',
  };

  const similarCase = {
    category: '카드분실',
    summary: '2024-12-28 처리 사례. 고객 카드 분실 신고 후 재발급 처리. 해외 여행 전 긴급 배송 요청하여 익일 배송으로 변경 처리.',
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-60px)] flex bg-[#F5F5F5]">
        {/* 좌측 열 (~30% 너비) */}
        <div className="w-[30%] bg-[#FAFAFA] p-3 overflow-y-auto border-r border-[#E0E0E0]">
          {/* 상담 전문 */}
          <div className="mb-3">
            <h3 className="text-xs font-bold text-[#333333] mb-2">상담 전문</h3>
            <div className="bg-white rounded-lg p-2.5 shadow-sm" style={{ height: '180px', overflowY: 'auto' }}>
              <div className="space-y-1.5">
                {callTranscript.map((msg, index) => (
                  <div key={index} className={`flex ${msg.speaker === 'agent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${msg.speaker === 'agent' ? 'text-right' : 'text-left'}`}>
                      <div 
                        className={`inline-block px-2 py-1 rounded-lg text-[11px] ${
                          msg.speaker === 'agent'
                            ? 'bg-[#0047AB] text-white rounded-tr-sm'
                            : 'bg-[#F5F5F5] text-[#333333] rounded-tl-sm'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <div className="text-[10px] text-[#999999] mt-0.5">{msg.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 피드백 섹션 (접을 수 있음) */}
          <details className="mb-3">
            <summary className="cursor-pointer py-2 border-b border-[#E0E0E0] text-xs font-bold text-[#333333]">
              상담 피드백
            </summary>
            <div className="pt-2">
              {/* 감정 분석 */}
              <div className="mb-3">
                <h4 className="text-[11px] font-bold text-[#666666] mb-2">감정 분석</h4>
                <div className="flex justify-around">
                  <div className="text-center">
                    <div className="text-xl mb-0.5">😠</div>
                    <div className="text-[10px] text-[#EA4335]">초반: 부정적</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl mb-0.5">😐</div>
                    <div className="text-[10px] text-[#666666]">중반: 중립</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl mb-0.5">😊</div>
                    <div className="text-[10px] text-[#34A853]">후반: 긍정적</div>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <span className="px-2 py-0.5 bg-[#34A853] text-white rounded-full text-[10px]">품질 평가: 상</span>
                </div>
              </div>

              {/* 직원 피드백 (간단한 점수 표시) */}
              <div>
                <h4 className="text-[11px] font-bold text-[#666666] mb-2">직원 피드백</h4>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#666666]">후처리 소요 시간</span>
                    <span className="text-[#0047AB] font-semibold">85점</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666666]">감사 표현 비율</span>
                    <span className="text-[#0047AB] font-semibold">75점</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666666]">감정 전환</span>
                    <span className="text-[#0047AB] font-semibold">88점</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666666]">매뉴얼 준수</span>
                    <span className="text-[#0047AB] font-semibold">92점</span>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* 우측 열 (메인 ~70% 너비) */}
        <div className="flex-1 bg-white p-4 overflow-y-auto">
          {/* 유사 사례 참고 카드 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white border-2 border-[#0047AB] rounded-lg p-3">
              <h3 className="text-sm font-bold text-[#0047AB] mb-2">현재 상담 케이스</h3>
              <span className="inline-block px-2 py-0.5 bg-[#E8F1FC] text-[#0047AB] rounded text-[10px] mb-2">
                [{currentCase.category}]
              </span>
              <p className="text-xs text-[#333333] leading-relaxed mb-2">{currentCase.summary}</p>
              <p className="text-[10px] text-[#4A90E2]">{currentCase.aiRecommendation}</p>
            </div>

            <div className="bg-[#F8F8F8] border border-[#E0E0E0] rounded-lg p-3">
              <h3 className="text-sm font-bold text-[#666666] mb-2">유사 사례 참고</h3>
              <span className="inline-block px-2 py-0.5 bg-[#E8F1FC] text-[#0047AB] rounded text-[10px] mb-2">
                [{similarCase.category}]
              </span>
              <p className="text-xs text-[#333333] leading-relaxed mb-2">{similarCase.summary}</p>
              <button className="text-[10px] text-[#0047AB] hover:underline">자세히 보기</button>
            </div>
          </div>

          {/* AI 생성 후처리 문서 */}
          <h2 className="text-sm font-bold text-[#333333] mb-3">상담 후처리 문서</h2>

          <div className="space-y-3">
            {/* 상담 제목 */}
            <div>
              <Label className="text-xs text-[#666666] mb-1.5 block">제목</Label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full h-9 px-3 border border-[#E0E0E0] rounded-md text-xs"
                placeholder="상담 제목을 입력하세요"
              />
            </div>

            {/* 상담 ID (읽기 전용) */}
            <div>
              <Label className="text-xs text-[#666666] mb-1.5 block">상담 ID</Label>
              <input
                type="text"
                value={callInfo.id}
                readOnly
                className="w-full h-9 px-3 border border-[#E0E0E0] rounded-md bg-[#F5F5F5] text-[#999999] text-xs"
              />
            </div>

            {/* 상태 & 분류 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#666666] mb-1.5 block">상담 상태</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full h-9 px-3 border border-[#E0E0E0] rounded-md text-xs"
                >
                  <option>진행중</option>
                  <option>완료</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-[#666666] mb-1.5 block">상담 분류</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full h-9 px-3 border border-[#E0E0E0] rounded-md text-xs"
                >
                  <option>카드분실</option>
                  <option>해외결제</option>
                  <option>수수료문의</option>
                  <option>기타</option>
                </select>
              </div>
            </div>

            {/* 고객 정보 (읽기 전용) */}
            <div>
              <Label className="text-xs text-[#666666] mb-1.5 block">고객 정보</Label>
              <div className="bg-[#F5F5F5] border border-[#E0E0E0] rounded-md p-3">
                <div className="text-[10px] text-[#666666] leading-relaxed">
                  <div>고객 ID: {customerInfo.id}</div>
                  <div>이름: {customerInfo.name}</div>
                  <div>전화번호: {customerInfo.phone}</div>
                </div>
              </div>
            </div>

            {/* 통화 일시 (읽기 전용) */}
            <div>
              <Label className="text-xs text-[#666666] mb-1.5 block">통화 일시</Label>
              <input
                type="text"
                value={callInfo.datetime}
                readOnly
                className="w-full h-9 px-3 border border-[#E0E0E0] rounded-md bg-[#F5F5F5] text-[#999999] text-xs"
              />
            </div>

            {/* AI 상담 요약본 */}
            <div>
              <Label className="text-xs text-[#666666] mb-1.5 block">AI 상담 요약본</Label>
              <Textarea
                value={aiSummary}
                onChange={(e) => setAiSummary(e.target.value)}
                className="h-40 border border-[#E0E0E0] rounded-md p-3 text-xs"
              />
            </div>

            {/* 후속 일정 */}
            <div>
              <Label className="text-xs text-[#666666] mb-1.5 block">후속 일정</Label>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-[10px] text-[#999999] mb-1.5 block">추후 할 일</Label>
                  <Textarea
                    value={formData.followUpTasks}
                    onChange={(e) => setFormData({...formData, followUpTasks: e.target.value})}
                    className="h-16 border border-[#E0E0E0] rounded-md p-2.5 text-xs"
                    placeholder="후속 조치가 필요한 경우 입력하세요"
                  />
                </div>

                <div>
                  <Label className="text-[10px] text-[#999999] mb-1.5 block">이관 부서</Label>
                  <select
                    value={formData.handoffDepartment}
                    onChange={(e) => setFormData({...formData, handoffDepartment: e.target.value})}
                    className="w-full h-9 px-3 border border-[#E0E0E0] rounded-md text-xs"
                  >
                    <option>없음</option>
                    <option>카드발급팀</option>
                    <option>분실처리팀</option>
                    <option>결제팀</option>
                  </select>
                </div>

                <div>
                  <Label className="text-[10px] text-[#999999] mb-1.5 block">이관 부서 전달 사항</Label>
                  <Textarea
                    value={formData.handoffNotes}
                    onChange={(e) => setFormData({...formData, handoffNotes: e.target.value})}
                    className="h-16 border border-[#E0E0E0] rounded-md p-2.5 text-xs"
                    placeholder="이관 시 전달할 내용을 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 상담 메모 */}
            <div>
              <Label className="text-xs text-[#666666] mb-1.5 block">담 메모</Label>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="h-20 border border-[#E0E0E0] rounded-md p-2.5 text-xs"
                placeholder="CSU에서 작성한 메모가 자동으로 입력됩니다"
              />
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end pt-3">
              <Button
                className="w-40 h-10 bg-[#0047AB] hover:bg-[#003580] text-sm font-bold shadow-lg"
                onClick={handleSaveACW}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? '저장 중...' : '후처리 완료 및 저장'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}