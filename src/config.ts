/**
 * 환경별 API URL 설정
 *
 * - 로컬 개발: http://127.0.0.1:8000
 * - ngrok/배포: 현재 브라우저 origin 사용 (상대 경로)
 *
 * .env.development → VITE_API_BASE_URL=http://127.0.0.1:8000
 * .env.production  → VITE_API_BASE_URL= (비워두면 상대경로)
 */

function resolveBaseUrl(): string {
  // 환경변수가 설정되어 있으면 사용
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;

  // 로컬 개발 환경 감지
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      return 'http://127.0.0.1:8000';
    }
    // ngrok/배포 환경: 현재 origin 사용
    return window.location.origin;
  }

  return 'http://127.0.0.1:8000';
}

function resolveWsBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const { hostname, protocol, host } = window.location;
    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      return 'ws://127.0.0.1:8000';
    }
    // ngrok은 HTTPS → wss 필요
    const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${host}`;
  }
  return 'ws://127.0.0.1:8000';
}

export const BASE_URL = resolveBaseUrl();
export const API_BASE_URL = `${BASE_URL}/api/v1`;
export const WS_BASE_URL = `${resolveWsBaseUrl()}/api/v1`;
