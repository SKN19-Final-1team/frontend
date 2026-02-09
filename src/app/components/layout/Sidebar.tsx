import {
  Home,
  Phone,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  Megaphone,
  Database,
  FlaskConical,
  Mic,
  Volume2,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { DEV_MODE, USE_MOCK_DATA, toggleMockMode } from '@/config/mockConfig';
import {
  STT_OPTIONS,
  TTS_OPTIONS,
  getCurrentSTT,
  getCurrentTTS,
  getCurrentSpeaker,
  switchSTTEngine,
  switchTTSEngine,
  syncEngineSettings,
} from '@/config/engineConfig';

interface SidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function Sidebar({ isExpanded, onMouseEnter, onMouseLeave }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  // STT/TTS 엔진 상태
  const [sttEngine, setSttEngine] = useState(getCurrentSTT());
  const [ttsEngine, setTtsEngine] = useState(getCurrentTTS());
  const [ttsSpeaker, setTtsSpeaker] = useState(getCurrentSpeaker());
  const [sttOpen, setSttOpen] = useState(false);
  const [ttsOpen, setTtsOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null); // 전환 중인 엔진 ID

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    console.log('Sidebar - userRole:', role, 'isAdmin:', adminStatus);
    setIsAdmin(adminStatus);
  }, [location.pathname]);

  // 페이지 로드 시 백엔드와 동기화
  useEffect(() => {
    syncEngineSettings();
  }, []);

  const handleSTTSwitch = useCallback(async (engineId: string) => {
    if (switching || engineId === sttEngine) return;
    setSwitching(engineId);
    const ok = await switchSTTEngine(engineId);
    if (ok) {
      setSttEngine(engineId);
    }
    setSwitching(null);
    setSttOpen(false);
  }, [switching, sttEngine]);

  const handleTTSSwitch = useCallback(async (engineId: string, speaker: string) => {
    if (switching) return;
    const key = `${engineId}-${speaker}`;
    setSwitching(key);
    const ok = await switchTTSEngine(engineId, speaker);
    if (ok) {
      setTtsEngine(engineId);
      setTtsSpeaker(speaker);
    }
    setSwitching(null);
    setTtsOpen(false);
  }, [switching]);

  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: Home, path: '/dashboard', highlight: false },
    { id: 'consultation', label: '상담 시작', icon: Phone, path: '/consultation/live', highlight: true },
    { id: 'simulation', label: '교육 시뮬레이션', icon: BookOpen, path: '/simulation', highlight: false },
    { id: 'employees', label: '사원 목록', icon: Users, path: '/employees', highlight: false },
  ];

  const adminMenuItems = [
    { id: 'admin-stats', label: '총괄 현황', icon: BarChart3, path: '/admin/stats', highlight: false },
    { id: 'admin-manage', label: '사원 관리', icon: Settings, path: '/admin/manage', highlight: false },
    { id: 'admin-consultations', label: '상담 관리', icon: Phone, path: '/admin/consultations', highlight: false },
    { id: 'admin-notice', label: '공지사항 관리', icon: Megaphone, path: '/admin/notice', highlight: false },
  ];

  // 현재 선택된 STT/TTS 라벨
  const currentSTTLabel = STT_OPTIONS.find(o => o.id === sttEngine)?.shortLabel || 'Whisper';
  const currentTTSOption = TTS_OPTIONS.find(o => o.id === ttsEngine);
  const currentTTSLabel = currentTTSOption?.shortLabel || 'Qwen3';
  const currentVoice = currentTTSOption?.voices.find(v => v.id === ttsSpeaker);
  const currentVoiceLabel = currentVoice ? (currentVoice.gender === 'F' ? '여' : '남') : '';

  return (
    <aside
      className={`h-[var(--content-height)] bg-white border-r border-[#E0E0E0] fixed left-0 top-[var(--header-height,60px)] overflow-hidden transition-all duration-300 z-50 shadow-lg hidden lg:block ${
        isExpanded ? 'w-[200px]' : 'w-[56px]'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <nav className="p-2 space-y-1 overflow-y-auto h-full">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`
                w-full h-11 px-3 rounded-md flex items-center gap-3 transition-all overflow-hidden whitespace-nowrap
                ${isActive
                  ? 'bg-[#0047AB] text-white font-semibold'
                  : 'text-[#333333] hover:bg-[#F5F5F5]'
                }
              `}
              title={!isExpanded ? item.label : ''}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className={`text-sm transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="h-px bg-[#E0E0E0] my-3"></div>
            {isExpanded && (
              <div className="px-3 py-1">
                <span className="text-[10px] text-[#999999] uppercase whitespace-nowrap">관리자</span>
              </div>
            )}
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`
                    w-full h-11 px-3 rounded-md flex items-center gap-3 transition-all overflow-hidden whitespace-nowrap
                    ${isActive
                      ? 'bg-[#0047AB] text-white font-semibold'
                      : 'text-[#333333] hover:bg-[#F5F5F5]'
                    }
                  `}
                  title={!isExpanded ? item.label : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`text-sm transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </>
        )}

        {/* ⭐ Mock/Real 토글 버튼 (개발자 모드에서만 표시) */}
        {DEV_MODE && (
          <>
            <div className="h-px bg-[#E0E0E0] my-3"></div>
            <button
              onClick={toggleMockMode}
              className={`
                w-full h-11 px-3 rounded-md flex items-center gap-3 transition-all overflow-hidden whitespace-nowrap
                ${USE_MOCK_DATA
                  ? 'bg-[#FFF3E0] text-[#E65100] hover:bg-[#FFE0B2]'
                  : 'bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9]'
                }
              `}
              title={!isExpanded ? (USE_MOCK_DATA ? 'Mock 모드' : 'Real DB') : ''}
            >
              {USE_MOCK_DATA ? (
                <FlaskConical className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Database className="w-5 h-5 flex-shrink-0" />
              )}
              <span className={`text-sm font-medium transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                {USE_MOCK_DATA ? 'Mock 모드' : 'Real DB'}
              </span>
            </button>

            {/* ⭐ STT 엔진 선택 */}
            <div className="relative">
              <button
                onClick={() => { setSttOpen(!sttOpen); setTtsOpen(false); }}
                className="w-full h-11 px-3 rounded-md flex items-center gap-3 transition-all overflow-hidden whitespace-nowrap bg-[#E3F2FD] text-[#1565C0] hover:bg-[#BBDEFB]"
                title={!isExpanded ? `STT: ${currentSTTLabel}` : ''}
              >
                <Mic className="w-5 h-5 flex-shrink-0" />
                <span className={`text-sm font-medium transition-opacity duration-300 flex-1 text-left ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                  STT: {currentSTTLabel}
                </span>
                {isExpanded && (
                  sttOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />
                )}
              </button>

              {/* STT 드롭다운 */}
              {sttOpen && isExpanded && (
                <div className="mt-1 bg-white border border-[#E0E0E0] rounded-md shadow-md overflow-hidden">
                  {STT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSTTSwitch(opt.id)}
                      disabled={!!switching}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors
                        ${opt.id === sttEngine
                          ? 'bg-[#E3F2FD] text-[#1565C0] font-medium'
                          : 'text-[#333] hover:bg-[#F5F5F5]'
                        }
                        ${switching ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {switching === opt.id ? (
                        <span className="w-3 h-3 flex-shrink-0 border-2 border-[#1565C0] border-t-transparent rounded-full animate-spin" />
                      ) : opt.id === sttEngine ? (
                        <Check className="w-3 h-3 flex-shrink-0" />
                      ) : null}
                      <span className={opt.id === sttEngine || switching === opt.id ? '' : 'ml-5'}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ⭐ TTS 엔진 + 보이스 선택 */}
            <div className="relative">
              <button
                onClick={() => { setTtsOpen(!ttsOpen); setSttOpen(false); }}
                className="w-full h-11 px-3 rounded-md flex items-center gap-3 transition-all overflow-hidden whitespace-nowrap bg-[#F3E5F5] text-[#7B1FA2] hover:bg-[#E1BEE7]"
                title={!isExpanded ? `TTS: ${currentTTSLabel} ${currentVoiceLabel}` : ''}
              >
                <Volume2 className="w-5 h-5 flex-shrink-0" />
                <span className={`text-sm font-medium transition-opacity duration-300 flex-1 text-left ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                  TTS: {currentTTSLabel} {currentVoiceLabel}
                </span>
                {isExpanded && (
                  ttsOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />
                )}
              </button>

              {/* TTS 드롭다운 */}
              {ttsOpen && isExpanded && (
                <div className="mt-1 bg-white border border-[#E0E0E0] rounded-md shadow-md overflow-hidden">
                  {TTS_OPTIONS.map((opt) => (
                    <div key={opt.id}>
                      <div className="px-3 pt-2 pb-1">
                        <span className="text-[10px] text-[#999] font-medium uppercase">{opt.label}</span>
                      </div>
                      {opt.voices.map((voice) => {
                        const isSelected = opt.id === ttsEngine && voice.id === ttsSpeaker;
                        const switchKey = `${opt.id}-${voice.id}`;
                        const isLoading = switching === switchKey;
                        return (
                          <button
                            key={switchKey}
                            onClick={() => handleTTSSwitch(opt.id, voice.id)}
                            disabled={!!switching}
                            className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 transition-colors
                              ${isSelected
                                ? 'bg-[#F3E5F5] text-[#7B1FA2] font-medium'
                                : 'text-[#333] hover:bg-[#F5F5F5]'
                              }
                              ${switching ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                          >
                            {isLoading ? (
                              <span className="w-3 h-3 flex-shrink-0 border-2 border-[#7B1FA2] border-t-transparent rounded-full animate-spin" />
                            ) : isSelected ? (
                              <Check className="w-3 h-3 flex-shrink-0" />
                            ) : null}
                            <span className={isSelected || isLoading ? '' : 'ml-5'}>{voice.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}
