import MainLayout from '../components/layout/MainLayout';
import { Play, Lock, Star, Clock, Trophy } from 'lucide-react';
import { Button } from '../components/ui/button';

const scenarios = [
  {
    id: 'SIM-001',
    title: '카드 분실 신고 및 재발급',
    difficulty: '초급',
    duration: '5분',
    description: '고객의 카드 분실 신고를 접수하고 재발급 절차를 안내하는 시나리오',
    tags: ['카드분실', '재발급', '기본상담'],
    completed: true,
    score: 95,
    locked: false
  },
  {
    id: 'SIM-002',
    title: '해외 결제 차단 해제 요청',
    difficulty: '중급',
    duration: '7분',
    description: '해외 여행 중 카드 결제가 차단된 고객의 문의를 처리하는 시나리오',
    tags: ['해외결제', '차단해제', '긴급처리'],
    completed: true,
    score: 88,
    locked: false
  },
  {
    id: 'SIM-003',
    title: '복잡한 수수료 환불 요청',
    difficulty: '고급',
    duration: '10분',
    description: '여러 건의 수수료 환불을 요청하는 까다로운 고객 응대',
    tags: ['수수료', '환불', '복잡처리'],
    completed: false,
    score: null,
    locked: false
  },
  {
    id: 'SIM-004',
    title: '진상 고객 감정 전환',
    difficulty: '고급',
    duration: '12분',
    description: '화가 난 고객의 감정을 전환하고 문제를 해결하는 고난이도 시나리오',
    tags: ['감정전환', '진상고객', '위기관리'],
    completed: false,
    score: null,
    locked: true
  },
  {
    id: 'SIM-005',
    title: '프로모션 크로스셀 실전',
    difficulty: '중급',
    duration: '8분',
    description: '상담 중 적절한 타이밍에 프로모션을 제안하는 영업 스킬 훈련',
    tags: ['크로스셀', '프로모션', '영업'],
    completed: false,
    score: null,
    locked: true
  },
  {
    id: 'SIM-006',
    title: '다단계 복합 문의 처리',
    difficulty: '고급',
    duration: '15분',
    description: '여러 문제가 얽힌 복잡한 상담을 효율적으로 처리하는 시나리오',
    tags: ['복합문의', '다단계처리', '고급'],
    completed: false,
    score: null,
    locked: true
  },
];

const recentAttempts = [
  { id: 1, scenario: 'SIM-001', title: '카드 분실 신고 및 재발급', score: 95, date: '2025-01-05 14:30', duration: '4분 50초' },
  { id: 2, scenario: 'SIM-002', title: '해외 결제 차단 해제 요청', score: 88, date: '2025-01-04 10:20', duration: '6분 35초' },
  { id: 3, scenario: 'SIM-001', title: '카드 분실 신고 및 재발급', score: 92, date: '2025-01-03 16:10', duration: '5분 10초' },
];

export default function SimulationPage() {
  return (
    <MainLayout>
      <div className="h-[calc(100vh-60px)] flex flex-col p-4 gap-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0047AB] to-[#4A90E2] rounded-lg shadow-sm p-4 text-white border border-[#0047AB] flex-shrink-0">
          <h1 className="text-lg font-bold mb-1">교육 시뮬레이션</h1>
          <p className="text-xs opacity-90">실전과 같은 상담 시뮬레이션으로 스킬을 향상시키세요</p>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
              <div className="text-xl font-bold">{scenarios.filter(s => s.completed).length}</div>
              <div className="text-[11px] opacity-80 mt-0.5">완료한 시나리오</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center gap-1">
                <div className="text-xl font-bold">92</div>
                <Star className="w-3.5 h-3.5 text-[#FBBC04] fill-current" />
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">평균 점수</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
              <div className="text-xl font-bold">{recentAttempts.length}</div>
              <div className="text-[11px] opacity-80 mt-0.5">총 시도 횟수</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
              <div className="text-xl font-bold">{scenarios.length - scenarios.filter(s => s.locked).length}</div>
              <div className="text-[11px] opacity-80 mt-0.5">이용 가능</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 flex-1">
          {/* Left - Scenarios */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[#E0E0E0]">
              <h2 className="text-base font-bold text-[#333333]">시나리오 선택</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 gap-3">
                {scenarios.map((scenario) => (
                  <div 
                    key={scenario.id}
                    className={`border-2 rounded-lg p-3 transition-all ${
                      scenario.locked 
                        ? 'border-[#E0E0E0] bg-[#F5F5F5] opacity-60' 
                        : scenario.completed
                          ? 'border-[#34A853] bg-[#F0FFF4] hover:shadow-md cursor-pointer'
                          : 'border-[#E0E0E0] hover:border-[#0047AB] hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-sm font-bold text-[#333333]">{scenario.title}</h3>
                          {scenario.completed && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#34A853] text-white text-[10px] rounded-full">
                              <Star className="w-2.5 h-2.5" />
                              {scenario.score}점
                            </div>
                          )}
                          {scenario.locked && (
                            <Lock className="w-3.5 h-3.5 text-[#999999]" />
                          )}
                        </div>
                        <p className="text-xs text-[#666666] mb-2">{scenario.description}</p>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {scenario.tags.map((tag, index) => (
                            <span key={index} className="text-[10px] px-1.5 py-0.5 bg-[#E8F1FC] text-[#0047AB] rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-[#E0E0E0]">
                      <div className="flex items-center gap-3 text-xs text-[#666666]">
                        <div className={`px-2 py-0.5 rounded text-[10px] ${
                          scenario.difficulty === '초급' ? 'bg-[#E8F5E9] text-[#34A853]' :
                          scenario.difficulty === '중급' ? 'bg-[#FFF9E6] text-[#FBBC04]' :
                          'bg-[#FFEBEE] text-[#EA4335]'
                        }`}>
                          {scenario.difficulty}
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <Clock className="w-3 h-3" />
                          {scenario.duration}
                        </div>
                      </div>
                      
                      <Button 
                        disabled={scenario.locked}
                        className={`text-xs px-3 py-1 h-auto ${
                          scenario.locked
                            ? 'bg-[#E0E0E0] text-[#999999] cursor-not-allowed'
                            : 'bg-[#0047AB] hover:bg-[#003580]'
                        }`}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        {scenario.locked ? '잠김' : '시작하기'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Recent Attempts */}
          <div className="bg-white rounded-lg shadow-sm flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[#E0E0E0]">
              <h2 className="text-base font-bold text-[#333333] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#FBBC04]" />
                최근 기록
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-3">
                {recentAttempts.map((attempt, index) => (
                  <div 
                    key={attempt.id}
                    className="border border-[#E0E0E0] rounded-lg p-3 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1">
                        <div className="text-[10px] text-[#999999] mb-0.5">{attempt.scenario}</div>
                        <div className="text-xs font-semibold text-[#333333] line-clamp-2 mb-1.5">
                          {attempt.title}
                        </div>
                      </div>
                      <div className={`text-lg font-bold ml-2 ${
                        attempt.score >= 90 ? 'text-[#34A853]' :
                        attempt.score >= 80 ? 'text-[#FBBC04]' :
                        'text-[#EA4335]'
                      }`}>
                        {attempt.score}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] text-[#666666]">
                      <span>{attempt.date}</span>
                      <span>{attempt.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}