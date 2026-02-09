import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { useState, useEffect, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import {
  mockFeedbackData,
  calculateAcwTimeScore,
  getManualComplianceMessage,
  getGratitudeMessage,
  getAcwTimeMessage,
  getEmotionTransitionMessage,
  getAhtMessage,
  getSimilarityMessage,
  getMimicryMessage,
  getMimicryGrade,
  EmotionAnalysis
} from '../../../data/feedbackRules';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  acwTimeSeconds?: number; // ⭐ 실제 후처리 시간 (초 단위)
  callTimeSeconds?: number; // ⭐ 통화 시간 (초 단위)
  educationType?: 'basic' | 'advanced'; // ⭐ 교육 모드 ('basic'=기본 시나리오, 'advanced'=우수 사례)
}

// ⭐ LLM 평가 데이터 타입 정의
interface LLMEvaluation {
  manual_compliance: {
    intro_score: number;
    response_score: number;
    explanation_score: number;
    proactivity_score: number;
    accuracy_score: number;
    manual_score: string | number;
  };
  customer_thanks: {
    count: number;
    thanks_score: string | number;
  };
  feedback: string;
  emotions: {
    early: string;
    mid: string;
    late: string;
  };
  emotion_score?: number;
}

// ⭐ 한글 감정을 영어로 매핑
function mapEmotionToEnglish(koreanEmotion: string): 'negative' | 'neutral' | 'positive' {
  const emotionMap: { [key: string]: 'negative' | 'neutral' | 'positive' } = {
    '부정': 'negative',
    '중립': 'neutral',
    '긍정': 'positive'
  };
  return emotionMap[koreanEmotion] || 'neutral';
}

// ⭐ 점수 문자열에서 숫자 추출 ("45점" -> 45)
function parseScore(scoreValue: string | number): number {
  if (typeof scoreValue === 'number') return scoreValue;
  const match = scoreValue.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  onConfirm,
  acwTimeSeconds = 0,
  callTimeSeconds = 0,
  educationType
}: FeedbackModalProps) {
  const isEducationMode = !!educationType;
  const isAdvancedMode = educationType === 'advanced';
  const [dontShowToday, setDontShowToday] = useState(false);
  const [showDetailScores, setShowDetailScores] = useState(false);

  // ⭐ 교육 모드: 유사도 점수 로드 (localStorage 또는 mock)
  const educationScores = useMemo(() => {
    if (!isEducationMode) return null;
    const stored = localStorage.getItem('educationScores');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('[FeedbackModal] 교육 점수 로드:', parsed);
        return {
          similarityScore: Math.min(parsed.similarityScore ?? 22, 30),
          mimicryScore: isAdvancedMode ? Math.min(parsed.mimicryScore ?? 0, 100) : undefined,
        };
      } catch { /* fallback */ }
    }
    // Mock fallback
    return {
      similarityScore: 22,
      mimicryScore: isAdvancedMode ? 68 : undefined,
    };
  }, [isOpen, isEducationMode, isAdvancedMode]);

  // ⭐ localStorage에서 LLM 평가 데이터 읽기
  const llmEvaluation = useMemo<LLMEvaluation | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('llmEvaluation');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      console.log('📊 [FeedbackModal] LLM 평가 데이터 로드:', parsed);
      return parsed;
    } catch (e) {
      console.error('❌ [FeedbackModal] LLM 평가 데이터 파싱 오류:', e);
      return null;
    }
  }, [isOpen]);

  // ⭐ 실제 데이터 또는 mock 데이터 사용
  const feedbackData = useMemo(() => {
    if (llmEvaluation) {
      // LLM 데이터를 피드백 형식에 맞게 변환
      const manualScore = parseScore(llmEvaluation.manual_compliance?.manual_score || 0);
      const thanksScore = parseScore(llmEvaluation.customer_thanks?.thanks_score || 0);
      const emotionScore = llmEvaluation.emotion_score ?? 0;

      // 감정 데이터 매핑 (mid -> middle)
      const emotions: EmotionAnalysis = {
        early: mapEmotionToEnglish(llmEvaluation.emotions?.early || '중립'),
        middle: mapEmotionToEnglish(llmEvaluation.emotions?.mid || '중립'),
        late: mapEmotionToEnglish(llmEvaluation.emotions?.late || '중립')
      };

      // 매뉴얼 상세 점수 매핑
      const manualDetails = {
        greeting: llmEvaluation.manual_compliance?.intro_score || 0,
        customerCheck: 0, // intro_score에 포함
        empathy: llmEvaluation.manual_compliance?.response_score || 0,
        apology: 0, // response_score에 포함
        communication: llmEvaluation.manual_compliance?.explanation_score || 0,
        explanation: 0, // explanation_score에 포함
        proactiveness: llmEvaluation.manual_compliance?.proactivity_score || 0,
        language: 0, // proactivity_score에 포함
        accuracy: llmEvaluation.manual_compliance?.accuracy_score || 0
      };

      console.log('✅ [FeedbackModal] 실제 LLM 데이터 사용:', {
        manualScore,
        thanksScore,
        emotionScore,
        emotions,
        feedback: llmEvaluation.feedback  // ⭐ [v24] 피드백 텍스트도 로그
      });

      return {
        manualCompliance: manualScore,
        customerGratitude: thanksScore,
        emotionTransition: emotionScore,
        emotion: emotions,
        manualDetails,
        feedback: llmEvaluation.feedback || ''  // ⭐ [v24] LLM 피드백 텍스트 추가
      };
    }

    // LLM 데이터 없으면 mock 사용
    console.log('⚠️ [FeedbackModal] LLM 데이터 없음 - mock 데이터 사용');
    return {
      manualCompliance: mockFeedbackData.manualCompliance,
      customerGratitude: mockFeedbackData.customerGratitude,
      emotionTransition: mockFeedbackData.emotionTransition,
      emotion: mockFeedbackData.emotion,
      manualDetails: mockFeedbackData.manualDetails,
      feedback: ''  // ⭐ [v24] mock에서는 빈 문자열
    };
  }, [llmEvaluation]);

  // ⭐ 후처리 시간 점수 계산 (업계 표준 기준: 45초 기준)
  const acwScore = acwTimeSeconds > 0 ? calculateAcwTimeScore(acwTimeSeconds) : mockFeedbackData.acwTime;
  
  // ⭐ 시간 포맷팅 함수
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  const acwTimeDisplay = acwTimeSeconds > 0 ? formatTime(acwTimeSeconds) : '측정 중';
  const callTimeDisplay = callTimeSeconds > 0 ? formatTime(callTimeSeconds) : localStorage.getItem('consultationCallTime') 
    ? formatTime(parseInt(localStorage.getItem('consultationCallTime') || '0'))
    : '0분 0초';
  
  // ⭐ AHT 계산 (Average Handle Time)
  const actualCallTime = callTimeSeconds > 0 
    ? callTimeSeconds 
    : parseInt(localStorage.getItem('consultationCallTime') || '0');
  const ahtSeconds = actualCallTime + (acwTimeSeconds > 0 ? acwTimeSeconds : 0);
  const ahtDisplay = formatTime(ahtSeconds);

  // ⭐ 총점 재계산 (교육 모드 분기)
  const totalScore = isEducationMode
    ? feedbackData.manualCompliance + (educationScores?.similarityScore ?? 0) + acwScore
    : feedbackData.manualCompliance + feedbackData.customerGratitude + acwScore + feedbackData.emotionTransition;

  // ⭐ 오각형 차트 데이터 (5개 항목: 도입부, 응대, 설명, 적극성, 정확성)
  // LLM 데이터가 있으면 실제 점수 사용, 없으면 기본값
  const radarData = useMemo(() => {
    if (llmEvaluation) {
      const mc = llmEvaluation.manual_compliance;
      // 각 항목: 0점이면 10점(완벽), -5점이면 5점, -10점이면 0점
      return [
        { category: '도입부', score: 10 + (mc?.intro_score || 0), maxScore: 10 },
        { category: '응대', score: 10 + (mc?.response_score || 0), maxScore: 10 },
        { category: '설명', score: 10 + (mc?.explanation_score || 0), maxScore: 10 },
        { category: '적극성', score: 10 + (mc?.proactivity_score || 0), maxScore: 10 },
        { category: '정확성', score: 10 + (mc?.accuracy_score || 0), maxScore: 10 },
      ];
    }
    return [
      { category: '도입부', score: 9.5, maxScore: 10 },
      { category: '응대', score: 10, maxScore: 10 },
      { category: '설명', score: 10, maxScore: 10 },
      { category: '적극성', score: 10, maxScore: 10 },
      { category: '정확성', score: 10, maxScore: 10 },
    ];
  }, [llmEvaluation]);

  // ⭐ 감정 이모지 매핑
  const emotionEmoji = {
    negative: '😠',
    neutral: '😐',
    positive: '😊',
  };

  const emotionColor = {
    negative: '#EA4335',
    neutral: '#666666',
    positive: '#34A853',
  };

  const emotionText = {
    negative: '부정적',
    neutral: '중립',
    positive: '긍정적',
  };

  // ⭐ 메시지 함수 호출 (실제 데이터 사용)
  const manualMessage = getManualComplianceMessage(feedbackData.manualCompliance);
  const gratitudeMessage = getGratitudeMessage(feedbackData.customerGratitude);
  const acwMessage = getAcwTimeMessage(acwTimeSeconds > 0 ? acwTimeSeconds : mockFeedbackData.acwTimeSeconds);
  const emotionMessage = getEmotionTransitionMessage(feedbackData.emotionTransition, feedbackData.emotion);
  const ahtMessage = getAhtMessage(ahtSeconds);

  // ⭐ "확인" 버튼 클릭
  const handleConfirm = () => {
    if (dontShowToday) {
      const today = new Date().toDateString();
      localStorage.setItem('feedbackDontShowUntil', today);
    }
    onConfirm();
  };

  // ⭐ ESC 키로 모달 닫기, Enter 키로 확인
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        handleConfirm();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, handleConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl">
        {/* 헤더 */}
        <div className={`${
          isEducationMode
            ? 'bg-gradient-to-r from-[#10B981] to-[#059669]'
            : 'bg-gradient-to-r from-[#0047AB] to-[#003580]'
        } text-white p-3 rounded-t-lg flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold">
                {isAdvancedMode ? '🏆 우수 사례 교육 평가' : isEducationMode ? '🎓 시나리오 교육 평가' : '🎯 상담 품질 피드백'}
              </h2>
              <p className="text-xs opacity-90">
                {isAdvancedMode ? '실제 우수 사례 대비 모방 유사도 분석' : isEducationMode ? 'AI 시나리오 기반 응대 역량 평가' : 'AI 분석 기반 상담 품질 평가'}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <span className="text-2xl font-bold">{totalScore}</span>
              <span className="text-sm opacity-90">/ 100점</span>
              <span className="ml-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
                {totalScore >= 90 ? '우수' : totalScore >= 80 ? '양호' : totalScore >= 70 ? '보통' : '개선 필요'}
              </span>
              {isEducationMode && (
                <span className="ml-1 px-2 py-0.5 bg-white/30 rounded text-[10px]">
                  {isAdvancedMode ? '우수사례' : '시나리오'} 교육
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 2열 레이아웃: 좌측 오각형 차트 + 우측 점수 */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            {/* 좌측: 오각형 차트 */}
            <div className="bg-[#F8FBFF] rounded-lg p-3 border border-[#0047AB]/10 flex flex-col justify-center">
              <p className="text-sm font-semibold text-[#333333] mb-2 text-center">매뉴얼 준수 5개 항목</p>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E0E0E0" />
                  <PolarAngleAxis 
                    dataKey="category" 
                    tick={({ payload, x, y, textAnchor, index }: any) => {
                      const data = radarData[index];
                      return (
                        <g>
                          <text 
                            x={x} 
                            y={y - 5} 
                            textAnchor={textAnchor} 
                            fill="#666666" 
                            fontSize="12" 
                            fontWeight="500"
                          >
                            {payload.value}
                          </text>
                          <text 
                            x={x} 
                            y={y + 9} 
                            textAnchor={textAnchor} 
                            fill="#999999" 
                            fontSize="9"
                          >
                            ({data.score})
                          </text>
                        </g>
                      );
                    }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 10]} 
                    tick={false}
                  />
                  <Radar 
                    name="점수" 
                    dataKey="score" 
                    stroke="#0047AB" 
                    fill="#0047AB" 
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <p className="text-center text-xs text-[#666666] mt-2">
                각 항목 10점 만점
              </p>
            </div>

            {/* 우측: 주요 점수 */}
            <div className="space-y-3">
              {/* 1. 매뉴얼 준수 (공통) */}
              <div className="p-3 bg-[#F8FBFF] rounded-lg border border-[#0047AB]/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[#333333]">
                    1. 매뉴얼 준수 <span className="text-xs text-[#666666]">- {manualMessage}</span>
                  </span>
                  <span className="text-sm font-bold text-[#0047AB]">
                    {feedbackData.manualCompliance}/50
                  </span>
                </div>
                <div className="bg-[#E0E0E0] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0047AB] h-full rounded-full transition-all duration-500"
                    style={{ width: `${(feedbackData.manualCompliance / 50) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-[#666666] mt-1">
                  {Math.round((feedbackData.manualCompliance / 50) * 100)}%
                </p>
              </div>

              {isEducationMode ? (
                <>
                  {/* 2. 유사도 (교육 모드 전용 - 고객감사+감정전환 대체) */}
                  <div className="p-3 bg-[#F0FDF4] rounded-lg border border-[#10B981]/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-[#333333]">
                        2. 응대 유사도 <span className="text-xs text-[#666666]">- {getSimilarityMessage(educationScores?.similarityScore ?? 0)}</span>
                      </span>
                      <span className="text-sm font-bold text-[#10B981]">
                        {educationScores?.similarityScore ?? 0}/30
                      </span>
                    </div>
                    <div className="bg-[#E0E0E0] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#10B981] h-full rounded-full transition-all duration-500"
                        style={{ width: `${((educationScores?.similarityScore ?? 0) / 30) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#666666] mt-1">
                      {Math.round(((educationScores?.similarityScore ?? 0) / 30) * 100)}%
                      <span className="ml-2 text-[#999999]">
                        {isAdvancedMode ? '(원본 상담 대비)' : '(시나리오 기준)'}
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* 2. 고객 감사 표현 (실전 모드) */}
                  <div className="p-3 bg-[#F8FBFF] rounded-lg border border-[#34A853]/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-[#333333]">
                        2. 고객 감사 <span className="text-xs text-[#666666]">- {gratitudeMessage}</span>
                      </span>
                      <span className="text-sm font-bold text-[#34A853]">
                        {feedbackData.customerGratitude}/10
                      </span>
                    </div>
                    <div className="bg-[#E0E0E0] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#34A853] h-full rounded-full transition-all duration-500"
                        style={{ width: `${(feedbackData.customerGratitude / 10) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#666666] mt-1">
                      {Math.round((feedbackData.customerGratitude / 10) * 100)}%
                    </p>
                  </div>
                </>
              )}

              {/* 3. 후처리 시간 (공통) */}
              <div className="p-3 bg-[#F8FBFF] rounded-lg border border-[#34A853]/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[#333333]">
                    {isEducationMode ? '3' : '3'}. 후처리 <span className="text-xs text-[#666666]">- {acwTimeDisplay} {acwMessage}</span>
                  </span>
                  <span className="text-sm font-bold text-[#34A853]">
                    {acwScore}/20
                  </span>
                </div>
                <div className="bg-[#E0E0E0] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#34A853] h-full rounded-full transition-all duration-500"
                    style={{ width: `${(acwScore / 20) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-[#666666] mt-1">
                  {Math.round((acwScore / 20) * 100)}%
                </p>
              </div>

              {!isEducationMode && (
                /* 4. 감정 전환 (실전 모드 전용) */
                <div className="p-3 bg-[#F8FBFF] rounded-lg border border-[#FBBC04]/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#333333]">
                      4. 감정 전환 <span className="text-xs text-[#666666]">- {emotionMessage}</span>
                    </span>
                    <span className="text-sm font-bold text-[#FBBC04]">
                      {feedbackData.emotionTransition}/20
                    </span>
                  </div>
                  <div className="bg-[#E0E0E0] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#FBBC04] h-full rounded-full transition-all duration-500"
                      style={{ width: `${(feedbackData.emotionTransition / 20) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#666666] mt-1">
                    {Math.round((feedbackData.emotionTransition / 20) * 100)}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* AHT (Average Handle Time) */}
          <div className="mb-3 p-3 bg-gradient-to-r from-[#F8FBFF] to-[#FFF9F0] rounded-lg border border-[#0047AB]/20">
            <p className="text-sm font-semibold text-[#333333] mb-2 text-center">💼 총 처리 시간 (AHT)</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-[#666666] mb-1">📞 통화 시간</p>
                <p className="text-lg font-bold text-[#0047AB]">{callTimeDisplay}</p>
              </div>
              <div>
                <p className="text-xs text-[#666666] mb-1">⏱️ 후처리 시간</p>
                <p className="text-lg font-bold text-[#34A853]">{acwTimeDisplay}</p>
              </div>
              <div>
                <p className="text-xs text-[#666666] mb-1">💼 총 AHT</p>
                <p className="text-lg font-bold text-[#FBBC04]">{ahtDisplay}</p>
              </div>
            </div>
            <p className="text-center text-xs text-[#666666] mt-2">
              {ahtMessage}
            </p>
          </div>

          {/* 감정 변화 (실전 모드 전용 - 교육 모드에서는 AI이므로 감정 없음) */}
          {!isEducationMode && (
            <div className="mb-3 p-3 bg-[#F8FBFF] rounded-lg border border-[#0047AB]/20">
              <p className="text-sm font-semibold text-[#333333] mb-2">감정 변화</p>
              <div className="flex items-center justify-center gap-3">
                <div className="text-center">
                  <div className="text-3xl mb-1">{emotionEmoji[feedbackData.emotion.early]}</div>
                  <div className="text-xs font-semibold" style={{ color: emotionColor[feedbackData.emotion.early] }}>
                    초반: {emotionText[feedbackData.emotion.early]}
                  </div>
                </div>
                <div className="text-[#666666] text-xl">&rarr;</div>
                <div className="text-center">
                  <div className="text-3xl mb-1">{emotionEmoji[feedbackData.emotion.middle]}</div>
                  <div className="text-xs font-semibold" style={{ color: emotionColor[feedbackData.emotion.middle] }}>
                    중반: {emotionText[feedbackData.emotion.middle]}
                  </div>
                </div>
                <div className="text-[#666666] text-xl">&rarr;</div>
                <div className="text-center">
                  <div className="text-3xl mb-1">{emotionEmoji[feedbackData.emotion.late]}</div>
                  <div className="text-xs font-semibold" style={{ color: emotionColor[feedbackData.emotion.late] }}>
                    후반: {emotionText[feedbackData.emotion.late]}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 우수 사례 교육: 모방 유사도 카드 */}
          {isAdvancedMode && educationScores?.mimicryScore != null && (() => {
            const grade = getMimicryGrade(educationScores.mimicryScore);
            return (
              <div className="mb-3 p-4 bg-gradient-to-r from-[#F0FDF4] to-[#ECFDF5] rounded-lg border border-[#10B981]/30">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-[#333333]">모방 유사도</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm"
                      style={{ backgroundColor: grade.color }}
                    >
                      {grade.label}
                    </span>
                    <span className="text-xl font-black text-[#059669]">
                      {educationScores.mimicryScore}
                      <span className="text-sm font-normal text-[#666666]">/100</span>
                    </span>
                  </div>
                </div>
                <div className="bg-[#E0E0E0] h-3 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${educationScores.mimicryScore}%`,
                      background: `linear-gradient(90deg, #10B981, ${grade.color})`
                    }}
                  />
                </div>
                <p className="text-xs text-[#666666]">
                  {getMimicryMessage(educationScores.mimicryScore)}
                </p>
              </div>
            );
          })()}

          {/* 개선 필요 사항 - ⭐ [v24] LLM 피드백 텍스트 표시 */}
          {(feedbackData.feedback || feedbackData.manualDetails.customerCheck < 0) && (
            <div className="mb-5 p-3 bg-[#FFF9E6] border border-[#FBBC04] rounded-lg">
              <p className="text-sm text-[#666666]">
                ⚠️ <span className="font-semibold text-[#EA4335]">개선 필요:</span>{' '}
                {feedbackData.feedback || `고객확인 시 정보 누출 (${feedbackData.manualDetails.customerCheck}점)`}
              </p>
            </div>
          )}

          {/* 매뉴얼 상세 점수 보기 (접었다 폈다) */}
          <div className="mb-5">
            <button
              onClick={() => setShowDetailScores(!showDetailScores)}
              className="w-full p-3 bg-[#F5F5F5] hover:bg-[#E0E0E0] rounded-lg flex items-center justify-between transition-colors"
            >
              <span className="text-sm font-semibold text-[#666666]">
                {showDetailScores ? '▼' : '▶'} 매뉴얼 상세 점수 보기 (9개 항목)
              </span>
              {showDetailScores ? (
                <ChevronUp className="w-4 h-4 text-[#666666]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#666666]" />
              )}
            </button>

            {showDetailScores && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E0E0E0]">
                  <span className="text-xs text-[#666666]">첫/끝인사</span>
                  <span className={`text-xs font-semibold ${feedbackData.manualDetails.greeting === 0 ? 'text-[#34A853]' : 'text-[#EA4335]'}`}>
                    {feedbackData.manualDetails.greeting}점
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E0E0E0]">
                  <span className="text-xs text-[#666666]">고객확인</span>
                  <span className={`text-xs font-semibold ${feedbackData.manualDetails.customerCheck === 0 ? 'text-[#34A853]' : 'text-[#EA4335]'}`}>
                    {feedbackData.manualDetails.customerCheck}점
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E0E0E0]">
                  <span className="text-xs text-[#666666]">호응어</span>
                  <span className={`text-xs font-semibold ${feedbackData.manualDetails.empathy === 0 ? 'text-[#34A853]' : 'text-[#EA4335]'}`}>
                    {feedbackData.manualDetails.empathy}점
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E0E0E0]">
                  <span className="text-xs text-[#666666]">사과/대기표현</span>
                  <span className={`text-xs font-semibold ${feedbackData.manualDetails.apology === 0 ? 'text-[#34A853]' : 'text-[#EA4335]'}`}>
                    {feedbackData.manualDetails.apology}점
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E0E0E0]">
                  <span className="text-xs text-[#666666]">커뮤니케이션</span>
                  <span className={`text-xs font-semibold ${feedbackData.manualDetails.communication === 0 ? 'text-[#34A853]' : 'text-[#EA4335]'}`}>
                    {feedbackData.manualDetails.communication}점
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E0E0E0]">
                  <span className="text-xs text-[#666666]">알기 쉬운 설명</span>
                  <span className={`text-xs font-semibold ${feedbackData.manualDetails.explanation === 0 ? 'text-[#34A853]' : 'text-[#EA4335]'}`}>
                    {feedbackData.manualDetails.explanation}점
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E0E0E0]">
                  <span className="text-xs text-[#666666]">적극성</span>
                  <span className={`text-xs font-semibold ${feedbackData.manualDetails.proactiveness === 0 ? 'text-[#34A853]' : 'text-[#EA4335]'}`}>
                    {feedbackData.manualDetails.proactiveness}점
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E0E0E0]">
                  <span className="text-xs text-[#666666]">언어표현</span>
                  <span className={`text-xs font-semibold ${feedbackData.manualDetails.language === 0 ? 'text-[#34A853]' : 'text-[#EA4335]'}`}>
                    {feedbackData.manualDetails.language}점
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E0E0E0] col-span-2">
                  <span className="text-xs text-[#666666]">정확한 업무처리</span>
                  <span className={`text-xs font-semibold ${feedbackData.manualDetails.accuracy === 0 ? 'text-[#34A853]' : 'text-[#EA4335]'}`}>
                    {feedbackData.manualDetails.accuracy}점
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* "오늘 하루 보지 않기" 체크박스 */}
          <div className="bg-[#FFF9E6] border border-[#FBBC04] rounded-lg p-3 flex items-center gap-3">
            <input
              type="checkbox"
              id="dontShowToday"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="w-4 h-4 rounded border-[#FBBC04] text-[#FBBC04] focus:ring-[#FBBC04]"
            />
            <label htmlFor="dontShowToday" className="text-sm text-[#666666] cursor-pointer flex-1">
              오늘 하루 피드백 보지 않고 업무 집중하기
            </label>
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-3 border-t border-[#E0E0E0] flex gap-3 justify-end bg-[#FAFAFA] rounded-b-lg">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6"
          >
            닫기
          </Button>
          <Button
            onClick={handleConfirm}
            className="px-6 bg-[#0047AB] hover:bg-[#003580]"
          >
            확인
          </Button>
        </div>
      </div>
    </div>
  );
}