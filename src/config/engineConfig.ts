/**
 * STT/TTS 엔진 설정 모듈
 *
 * 사이드바 버튼으로 런타임 엔진 전환을 관리합니다.
 * - localStorage에 현재 선택 저장
 * - 백엔드 /api/v1/settings/* API 호출
 */

import { API_BASE_URL } from '@/config';

// ── STT 엔진 옵션 ──────────────────────────────────────────────

export interface STTOption {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
}

export const STT_OPTIONS: STTOption[] = [
  { id: 'openai-whisper', label: 'Whisper (OpenAI)', shortLabel: 'Whisper', description: '팀 프로덕션 기본' },
  { id: 'qwen3-asr', label: 'Qwen3-ASR 1.7B', shortLabel: 'Qwen3', description: '로컬 GPU STT' },
];

// ── TTS 엔진 + 보이스 옵션 ─────────────────────────────────────

export interface TTSVoice {
  id: string;
  label: string;
  gender: 'F' | 'M';
}

export interface TTSOption {
  id: string;
  label: string;
  shortLabel: string;
  voices: TTSVoice[];
}

export const TTS_OPTIONS: TTSOption[] = [
  {
    id: 'qwen3-tts',
    label: 'Qwen3-TTS',
    shortLabel: 'Qwen3',
    voices: [
      { id: 'Sohee', label: 'Sohee (여)', gender: 'F' },
      { id: 'Aiden', label: 'Aiden (남)', gender: 'M' },
    ],
  },
  {
    id: 'supertonic',
    label: 'Supertonic',
    shortLabel: 'Super',
    voices: [
      { id: 'Sohee', label: '여성 (F1)', gender: 'F' },
      { id: 'InJoon', label: '남성 (M1)', gender: 'M' },
    ],
  },
  {
    id: 'vibevoice',
    label: 'VibeVoice',
    shortLabel: 'Vibe',
    voices: [
      { id: 'Sohee', label: '여성 (kr-spk0)', gender: 'F' },
      { id: 'InJoon', label: '남성 (kr-spk1)', gender: 'M' },
    ],
  },
  {
    id: 'edge-tts',
    label: 'Edge-TTS',
    shortLabel: 'Edge',
    voices: [
      { id: 'SunHi', label: 'SunHi (여)', gender: 'F' },
      { id: 'InJoon', label: 'InJoon (남)', gender: 'M' },
    ],
  },
];

// ── localStorage 키 ─────────────────────────────────────────────

const STT_ENGINE_KEY = 'sttEngine';
const TTS_ENGINE_KEY = 'ttsEngine';
const TTS_SPEAKER_KEY = 'ttsSpeaker';

// ── 현재 상태 읽기 ──────────────────────────────────────────────

export function getCurrentSTT(): string {
  return localStorage.getItem(STT_ENGINE_KEY) || 'openai-whisper';
}

export function getCurrentTTS(): string {
  return localStorage.getItem(TTS_ENGINE_KEY) || 'qwen3-tts';
}

export function getCurrentSpeaker(): string {
  return localStorage.getItem(TTS_SPEAKER_KEY) || 'Sohee';
}

// ── 엔진 전환 API 호출 ─────────────────────────────────────────

export async function switchSTTEngine(engineId: string): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE_URL}/settings/stt-engine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engine: engineId }),
    });
    const data = await resp.json();
    if (data.success) {
      localStorage.setItem(STT_ENGINE_KEY, engineId);
      return true;
    }
    console.error('[Engine] STT switch failed:', data.error);
    return false;
  } catch (e) {
    console.error('[Engine] STT switch error:', e);
    return false;
  }
}

export async function switchTTSEngine(
  engineId: string,
  speaker?: string
): Promise<boolean> {
  try {
    // 스피커 미지정 시 해당 엔진 첫번째 보이스 사용
    const resolvedSpeaker =
      speaker || TTS_OPTIONS.find((o) => o.id === engineId)?.voices[0]?.id || 'Sohee';

    const resp = await fetch(`${API_BASE_URL}/settings/tts-engine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engine: engineId, speaker: resolvedSpeaker }),
    });
    const data = await resp.json();
    if (data.success) {
      localStorage.setItem(TTS_ENGINE_KEY, engineId);
      localStorage.setItem(TTS_SPEAKER_KEY, resolvedSpeaker);
      return true;
    }
    console.error('[Engine] TTS switch failed:', data.error);
    return false;
  } catch (e) {
    console.error('[Engine] TTS switch error:', e);
    return false;
  }
}

// ── 초기 동기화 (페이지 로드 시 백엔드와 맞춤) ──────────────────

export async function syncEngineSettings(): Promise<void> {
  const stt = getCurrentSTT();
  const tts = getCurrentTTS();
  const speaker = getCurrentSpeaker();

  try {
    // 백엔드에 현재 localStorage 설정 전송
    await Promise.all([
      switchSTTEngine(stt),
      switchTTSEngine(tts, speaker),
    ]);
  } catch {
    // 실패해도 무시 (기본값으로 동작)
  }
}
