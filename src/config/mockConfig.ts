/**
 * ⭐ Phase A: Mock/Real 데이터 전환 설정
 * 
 * USE_MOCK_DATA를 true/false로 변경하여 Mock 데이터와 실제 DB 연결을 전환합니다.
 * 
 * - true: Mock 데이터 사용 (현재 Figma Make 개발 환경)
 * - false: 실제 DB 연결 (코드 다운로드 후 로컬/배포 환경)
 */

export const USE_MOCK_DATA = true;

/**
 * ⭐ Phase 10-5: 고객 정보 마스킹 on/off 스위치
 * 
 * USE_CUSTOMER_MASKING을 true/false로 변경하여 고객 정보 마스킹을 제어합니다.
 * 
 * - false: 실명 표시 (현재 기본값, 권한 있는 사용자만 접근)
 * - true: 마스킹 표시 (클릭 시 3초 노출)
 */
export const USE_CUSTOMER_MASKING = false;

/**
 * 개발 가이드:
 * 
 * 1. Figma Make 개발 중: USE_MOCK_DATA = true
 *    - 화면에 Mock 데이터 표시
 *    - API 호출 시뮬레이션
 *    - localStorage 데이터는 생성되지만 사용하지 않음
 * 
 * 2. 로컬/배포 환경: USE_MOCK_DATA = false
 *    - localStorage에서 실제 데이터 로드
 *    - FastAPI 백엔드 호출
 *    - PostgreSQL + pgvector 연동
 * 
 * ⚠️ 주의:
 * - DB 스키마 확정 후 types/consultation.ts 업데이트 필요
 * - API 엔드포인트는 api/consultationApi.ts에서 설정
 */