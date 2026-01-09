# CALL:ACT API 요구 명세서

## 1. 개요

본 문서는 **CALL:ACT 프론트엔드**에서 필요로 하는 **백엔드 API**를 페이지별로 정리한 명세서입니다.

**작성일**: 2025-01-09  
**기준**: 페이지별 구현 현황 및 ERD 스키마 (23개 테이블, 16개 Enum)

---

## 2. 데이터베이스 구조 요약

| 데이터베이스 | 설명 | 테이블 수 | 주요 역할 |
|--------------|------|-----------|-----------|
| **카드 정보 DB** | 카드 상품, 혜택, 수수료 정보 | 6개 | 카드 정보 관리 및 RAG 검색 지원 |
| **카드사 이용 안내 DB** | 공지사항, 자주 찾는 문의, 가이드 문서 | 4개 | 서비스 안내 관리 및 RAG 검색 지원 |
| **상담 사례 DB** | 상담 내역, 교육 시나리오, 직원 정보 | 13개 | 상담 및 교육 관리, RAG 검색 지원 |

**총 23개 테이블, 16개 Enum 타입**

---

## 3. 전체 API 엔드포인트 목록

### 3.1 API 목록 (페이지별)

| 페이지 | API 엔드포인트 | 메서드 | 설명 | DB | RAG |
|--------|---------------|--------|------|----|----|
| **로그인** | `/api/auth/login` | POST | 로그인 인증 | employees | ❌ |
| **로그인** | `/api/auth/logout` | POST | 로그아웃 | - | ❌ |
| **대시보드** | `/api/dashboard/stats` | GET | 개인 통계 요약 | consultations | ❌ |
| **대시보드** | `/api/consultations/recent` | GET | 최근 상담 내역 | consultations | ❌ |
| **대시보드** | `/api/notices/pinned` | GET | 고정 공지사항 | announcements | ❌ |
| **대시보드** | `/api/consultations/best-practices` | GET | 우수 사례 목록 | consultations | ❌ |
| **실시간 상담** | `/api/customers/{customerId}` | GET | 고객 정보 조회 | customers | ❌ |
| **실시간 상담** | `/api/customers/{customerId}/consultations/recent` | GET | 고객 최근 상담 내역 | consultations | ❌ |
| **실시간 상담** | `/api/rag/search` | POST | RAG 검색 (칸반보드) | - | ✅ |
| **실시간 상담** | `/api/stt/keywords` | POST | STT 키워드 추출 | - | ❌ |
| **실시간 상담** | `/api/ai/assistant` | POST | AI 어시스턴트 질의응답 | - | ✅ |
| **실시간 상담** | `/api/consultations/start` | POST | 상담 시작 | consultations | ❌ |
| **실시간 상담** | `/api/consultations/{id}/update` | PATCH | 상담 중 임시 저장 | consultations | ❌ |
| **후처리** | `/api/consultations/{id}` | GET | 현재 상담 케이스 조회 | consultations | ❌ |
| **후처리** | `/api/consultations/similar` | POST | 유사 사례 검색 | - | ✅ |
| **후처리** | `/api/ai/summarize` | POST | AI 상담 요약 생성 | - | ❌ |
| **후처리** | `/api/consultations/{id}/transcript` | GET | 상담 전문 조회 | consultation_transcripts | ❌ |
| **후처리** | `/api/consultations/{id}/complete` | POST | 후처리 완료 | consultations, consultation_summaries | ❌ |
| **상담 내역** | `/api/consultations` | GET | 상담 내역 목록 (검색/필터) | consultations | ❌ |
| **상담 내역** | `/api/consultations/{id}/detail` | GET | 상담 상세 정보 | consultations, transcripts, summaries | ❌ |
| **프로필** | `/api/employees/{id}` | GET | 직원 정보 조회 | employees | ❌ |
| **프로필** | `/api/employees/{id}/stats` | GET | 직원 성과 통계 | consultations | ❌ |
| **프로필** | `/api/employees/{id}/badges` | GET | 직원 뱃지 목록 | employee_badges | ❌ |
| **사원 목록** | `/api/employees` | GET | 전체 사원 목록 | employees | ❌ |
| **공지사항** | `/api/notices` | GET | 공지사항 목록 | announcements | ❌ |
| **공지사항** | `/api/notices/{id}` | GET | 공지사항 상세 | announcements | ❌ |
| **시뮬레이션** | `/api/simulations/scenarios` | GET | 시나리오 목록 | training_scenarios | ❌ |
| **시뮬레이션** | `/api/simulations/history` | GET | 시뮬레이션 이력 | training_history | ❌ |
| **관리자-통계** | `/api/admin/stats/overall` | GET | 전체 통계 | consultations, employees | ❌ |
| **관리자-통계** | `/api/admin/stats/weekly` | GET | 주간 상담 추이 | consultations | ❌ |
| **관리자-상담** | `/api/admin/consultations` | GET | 전체 상담 관리 | consultations | ❌ |
| **관리자-사원** | `/api/admin/employees` | GET | 전체 사원 관리 | employees | ❌ |
| **관리자-사원** | `/api/admin/employees` | POST | 사원 추가 | employees | ❌ |
| **관리자-사원** | `/api/admin/employees/{id}` | PATCH | 사원 정보 수정 | employees | ❌ |
| **관리자-사원** | `/api/admin/employees/{id}` | DELETE | 사원 삭제 | employees | ❌ |
| **관리자-공지** | `/api/admin/notices` | POST | 공지사항 추가 | announcements | ❌ |
| **관리자-공지** | `/api/admin/notices/{id}` | PATCH | 공지사항 수정 | announcements | ❌ |
| **관리자-공지** | `/api/admin/notices/{id}` | DELETE | 공지사항 삭제 | announcements | ❌ |

**총 37개 API 엔드포인트**

---

## 4. 페이지별 API 요구 명세

### 4.1 LoginPage (로그인)

#### 화면 구성
- 사번 입력 필드
- 비밀번호 입력 필드
- 로그인 버튼

#### 필요 API

##### `POST /api/auth/login`

**요청:**
```json
{
  "username": "EMP-001",
  "password": "password123"
}
```

**응답 (성공):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "EMP-001",
    "name": "홍길동",
    "team": "상담1팀",
    "position": "대리",
    "role": "agent"  // 'admin' or 'agent'
  }
}
```

**응답 (실패):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**사용 테이블:**
- `employees` (직원 정보, 비밀번호 검증)

**RAG 검색:** ❌

---

### 4.2 DashboardPage (대시보드)

#### 화면 구성
1. **상단 KPI 카드** (4개)
   - 오늘의 상담 건수
   - FCR 달성률
   - 평균 처리 시간
   - 완료된 상담
2. **최근 상담 내역** (5건)
3. **공지사항** (고정 공지 우선, 5건)
4. **우수사원 사례집** (우수 사례 목록)

#### 필요 API

##### `GET /api/dashboard/stats?employeeId={employeeId}&date={date}`

**요청 예시:**
```
GET /api/dashboard/stats?employeeId=EMP-001&date=2025-01-09
```

**응답:**
```json
{
  "today": {
    "totalConsultations": 12,
    "completedConsultations": 9,
    "fcrRate": 94.5,
    "avgDuration": "4:32"
  },
  "thisMonth": {
    "totalConsultations": 127,
    "fcrRate": 94.0
  },
  "rank": {
    "current": 7,
    "total": 45,
    "trend": "up"  // 'up', 'down', 'same'
  }
}
```

**사용 테이블:**
- `consultations` (상담 내역, 집계)
- `employees` (직원 순위)

**RAG 검색:** ❌

---

##### `GET /api/consultations/recent?employeeId={employeeId}&limit={limit}`

**요청 예시:**
```
GET /api/consultations/recent?employeeId=EMP-001&limit=5
```

**응답:**
```json
{
  "consultations": [
    {
      "id": "CS-20250109-1432",
      "customer": {
        "name": "김민수",
        "phone": "010-1234-5678"
      },
      "category": "카드분실",
      "status": "완료",
      "datetime": "2025-01-09 14:32",
      "duration": "05:12",
      "fcr": true
    }
  ]
}
```

**사용 테이블:**
- `consultations`
- `customers`

**RAG 검색:** ❌

---

##### `GET /api/notices/pinned?limit={limit}`

**요청 예시:**
```
GET /api/notices/pinned?limit=5
```

**응답:**
```json
{
  "notices": [
    {
      "id": 1,
      "tag": "긴급",
      "title": "KT 화재로 인한 통신망 장애 대응",
      "date": "2025-01-09",
      "author": "관리자",
      "views": 245,
      "pinned": true
    }
  ]
}
```

**사용 테이블:**
- `announcements` (공지사항)

**RAG 검색:** ❌

---

##### `GET /api/consultations/best-practices?limit={limit}`

**요청 예시:**
```
GET /api/consultations/best-practices?limit=5
```

**응답:**
```json
{
  "bestPractices": [
    {
      "id": "CS-20250109-1432",
      "agentName": "홍길동",
      "category": "카드분실",
      "title": "진상 고객 대응 우수 사례",
      "score": 95,
      "date": "2025-01-09"
    }
  ]
}
```

**사용 테이블:**
- `consultations` (isBestPractice = true 필터)

**RAG 검색:** ❌

---

### 4.3 RealTimeConsultationPage (실시간 상담)

#### 화면 구성
1. **좌측: 고객 정보 + 최근 상담 내역**
2. **중앙: 칸반보드** (현재 상황 + 다음 단계)
3. **우측: AI 검색 어시스턴트**
4. **하단: 통화 제어 + STT 키워드**

#### 필요 API

##### `GET /api/customers/{customerId}`

**요청 예시:**
```
GET /api/customers/CUST-001
```

**응답:**
```json
{
  "customer": {
    "id": "CUST-001",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "birthDate": "1985-03-15",
    "address": "서울시 강남구 테헤란로 123",
    "email": "hong@customer.com",
    "customerSince": "2020-05-15"
  }
}
```

**사용 테이블:**
- `customers` (고객 정보)

**RAG 검색:** ❌

---

##### `GET /api/customers/{customerId}/consultations/recent?limit={limit}`

**요청 예시:**
```
GET /api/customers/CUST-001/consultations/recent?limit=5
```

**응답:**
```json
{
  "recentConsultations": [
    {
      "id": "CS-20250103-1030",
      "title": "카드 재발급 문의",
      "category": "카드분실",
      "status": "완료",
      "datetime": "2025-01-03 10:30",
      "agentName": "이영희"
    }
  ]
}
```

**사용 테이블:**
- `consultations`
- `employees`

**RAG 검색:** ❌

---

##### `POST /api/rag/search` ⭐ **핵심 API - 칸반보드**

**요청:**
```json
{
  "sttKeywords": ["카드분실", "해외결제", "수수료문의"],
  "customerId": "CUST-001",
  "consultationId": "CS-20250109-1432"
}
```

**응답:**
```json
{
  "currentSituation": [
    {
      "id": 1,
      "title": "카드 분실 신고 처리 절차",
      "keywords": ["#분실신고", "#즉시정지", "#재발급"],
      "content": "고객의 카드 분실 신고를 접수하고 즉시 카드 사용을 정지합니다.",
      "systemPath": "고객관리 > 카드관리 > 분실신고 > 즉시정지",
      "requiredChecks": [
        "✓ 본인 확인: 주민번호 뒷자리 4자리 필수",
        "✓ 분실 일시 및 장소 확인",
        "✓ 최근 3일 거래내역 이상여부 확인",
        "✓ 재발급 신청 의사 확인"
      ],
      "exceptions": [
        "⚠️ 법인카드: 담당자 승인 필요 (승인번호 기재)",
        "⚠️ 가족카드: 주카드 회원 동의 필수",
        "⚠️ 해외 분실: 긴급 카드 발급 가능 (수수료 $30)"
      ],
      "regulation": "카드업무 취급요령 제34조 (분실신고 및 재발급)",
      "detailContent": "제34조 (카드의 분실신고 및 재발급)\n\n① 회원은 카드를 분실한 경우...",
      "time": "처리 시간: 약 3-5분",
      "note": "분실 신고 후 72시간 내 부정 사용 보상 가능",
      "relevanceScore": 0.95
    },
    {
      "id": 2,
      "title": "긴급 카드 정지 안내",
      "keywords": ["#긴급처리", "#즉시정지"],
      "content": "카드 분실 시 즉시 사용 정지가 가능하며 부정 사용을 방지합니다.",
      "systemPath": "시스템 > 긴급처리 > 카드즉시정지 (단축키: Ctrl+Shift+S)",
      "requiredChecks": [
        "✓ 정지 사유 코드 선택 (분실/도난/기타)",
        "✓ 정지 시각 자동 기록 확인",
        "✓ 고객 휴대폰 번호 재확인",
        "✓ SMS 발송 완료 확인"
      ],
      "exceptions": [
        "⚠️ 정기결제: 72시간 유예 (자동이체 포함)",
        "⚠️ 교통카드: 별도 정지 필요 (교통카드 메뉴)",
        "⚠️ 해외 가맹점: 최대 24시간 지연 가능"
      ],
      "regulation": "카드 이용약관 제8조 (카드의 이용정지)",
      "detailContent": "제8조 (카드의 이용정지)\n\n① 회원이 카드의 이용정지를...",
      "time": "처리 시간: 즉시",
      "note": "정지 후에도 정기 결제는 72시간 유예",
      "relevanceScore": 0.88
    }
  ],
  "nextStep": [
    {
      "id": 1,
      "title": "재발급 카드 배송 안내",
      "keywords": ["#배송", "#3-5일", "#주소확인"],
      "content": "재발급 카드는 등록된 주소로 3-5일 내 배송되며 배송 추적이 가능합니다.",
      "systemPath": "카드관리 > 재발급관리 > 배송조회 (단축키: Ctrl+D)",
      "requiredChecks": [
        "✓ 배송 주소 재확인 (고객에게 읽어드리기)",
        "✓ 긴급 배송 필요 여부 확인",
        "✓ SMS 배송 추적 수신 동의 확인"
      ],
      "exceptions": [
        "⚠️ 긴급 배송: 익일 배송 가능 (수수료 5,000원)",
        "⚠️ 해외 주소: 배송 불가 (국내 주소만 가능)",
        "⚠️ 우편물 수령 불가 시: 가까운 지점 방문 수령 안내"
      ],
      "regulation": "카드업무 취급요령 제35조 (카드의 배송)",
      "detailContent": "제35조 (카드의 배송)\n\n① 카드는 회원이 등록한...",
      "time": "처리 시간: 약 2분",
      "note": "배송 추적 번호는 SMS로 자동 발송",
      "relevanceScore": 0.92
    }
  ],
  "guidanceScript": "고객님, 카드 분실 신고 접수되었습니다. 즉시 카드 사용이 정지되며, 3-5일 내 재발급 카드가 등록된 주소로 배송됩니다. 배송 추적 번호는 SMS로 발송될 예정이니 참고해주시기 바랍니다."
}
```

**사용 테이블:**
- **VectorDB** (RAG 검색) - `guide_documents`, `card_usage_guides`, `faqs`

**RAG 검색:** ✅ **핵심!**

**검색 로직:**
1. STT 키워드를 임베딩으로 변환
2. VectorDB에서 유사도 검색 (Top 10)
3. `document_type`으로 분류:
   - `current_situation` → currentSituation 배열
   - `next_step` → nextStep 배열
4. 각 배열에서 Top 2 선택
5. GPT-4로 권장 안내 멘트 생성

---

##### `POST /api/stt/keywords`

**요청:**
```json
{
  "audioChunk": "base64_encoded_audio_data",
  "consultationId": "CS-20250109-1432"
}
```

**응답:**
```json
{
  "keywords": ["카드분실", "해외결제", "수수료문의"],
  "confidence": 0.95,
  "timestamp": "2025-01-09T14:32:15Z"
}
```

**사용 테이블:**
- `stt_keywords` (키워드 저장)

**RAG 검색:** ❌

---

##### `POST /api/ai/assistant`

**요청:**
```json
{
  "question": "법인카드 분실 시 필요한 서류가 뭔가요?",
  "consultationId": "CS-20250109-1432",
  "context": {
    "category": "카드분실",
    "customerInfo": {
      "name": "홍길동"
    }
  }
}
```

**응답:**
```json
{
  "answer": "법인카드 분실 시에는 다음 서류가 필요합니다:\n\n1. 법인 담당자의 서면 승인 (승인번호 기재)\n2. 사업자등록증 사본\n3. 법인 인감 날인\n\n시스템에서 '법인카드 관리' 메뉴로 이동하셔서 처리하시면 됩니다.",
  "sources": [
    {
      "title": "법인카드 업무 처리 가이드",
      "snippet": "법인카드의 경우 법인 담당자의 서면 승인이 필요하며..."
    }
  ],
  "timestamp": "2025-01-09T14:32:20Z"
}
```

**사용 테이블:**
- **VectorDB** (RAG 검색)

**RAG 검색:** ✅

---

##### `POST /api/consultations/start`

**요청:**
```json
{
  "customerId": "CUST-001",
  "employeeId": "EMP-001",
  "category": "카드분실",
  "startTime": "2025-01-09T14:32:00Z"
}
```

**응답:**
```json
{
  "consultationId": "CS-20250109-1432",
  "status": "진행중",
  "startTime": "2025-01-09T14:32:00Z"
}
```

**사용 테이블:**
- `consultations` (INSERT)

**RAG 검색:** ❌

---

##### `PATCH /api/consultations/{id}/update`

**요청:**
```json
{
  "category": "카드분실",
  "memo": "임시 저장 메모...",
  "status": "진행중"
}
```

**응답:**
```json
{
  "success": true,
  "consultationId": "CS-20250109-1432"
}
```

**사용 테이블:**
- `consultations` (UPDATE)

**RAG 검색:** ❌

---

### 4.4 AfterCallWorkPage (후처리)

#### 화면 구성
1. **좌측: 현재 케이스 + 유사 사례**
2. **중앙: AI 상담 요약**
3. **우측: 상담 전문 + 감정 분석 + 피드백**
4. **하단: 후처리 양식**

#### 필요 API

##### `GET /api/consultations/{id}`

**요청 예시:**
```
GET /api/consultations/CS-20250109-1432
```

**응답:**
```json
{
  "consultation": {
    "id": "CS-20250109-1432",
    "customer": {
      "id": "CUST-001",
      "name": "홍길동",
      "phone": "010-1234-5678"
    },
    "agent": {
      "id": "EMP-001",
      "name": "이영희"
    },
    "category": "카드분실",
    "status": "진행중",
    "startTime": "2025-01-09T14:32:00Z",
    "endTime": "2025-01-09T14:37:12Z",
    "duration": "05:12"
  }
}
```

**사용 테이블:**
- `consultations`
- `customers`
- `employees`

**RAG 검색:** ❌

---

##### `POST /api/consultations/similar` ⭐ **유사 사례 검색**

**요청:**
```json
{
  "currentConsultationId": "CS-20250109-1432",
  "category": "카드분실",
  "keywords": ["분실신고", "재발급", "긴급"],
  "limit": 3
}
```

**응답:**
```json
{
  "similarCases": [
    {
      "consultationId": "CS-20241228-1015",
      "agentName": "김민수",
      "category": "카드분실",
      "summary": "2024-12-28 처리 사례. 고객 카드 분실 신고 후 재발급 처리. 해외 여행 전 긴급 배송 요청하여 익일 배송으로 변경 처리.",
      "aiRecommendation": "긴급 배송 옵션 제안 권장",
      "similarityScore": 0.94,
      "outcome": "성공",
      "fcrAchieved": true,
      "datetime": "2024-12-28 10:15"
    },
    {
      "consultationId": "CS-20241220-1430",
      "agentName": "박철수",
      "category": "카드분실",
      "summary": "2024-12-20 처리 사례. 법인카드 분실 신고. 법인 담당자 승인 확인 후 재발급 처리.",
      "aiRecommendation": "법인카드의 경우 담당자 승인 필수",
      "similarityScore": 0.87,
      "outcome": "성공",
      "fcrAchieved": true,
      "datetime": "2024-12-20 14:30"
    }
  ]
}
```

**사용 테이블:**
- **VectorDB** (RAG 검색) - `consultations` 임베딩

**RAG 검색:** ✅

---

##### `POST /api/ai/summarize`

**요청:**
```json
{
  "consultationId": "CS-20250109-1432",
  "transcript": [
    {
      "speaker": "customer",
      "message": "안녕하세요, 카드를 분실했어요.",
      "timestamp": "14:32:05"
    },
    {
      "speaker": "agent",
      "message": "안녕하세요. 즉시 카드 사용을 정지하겠습니다. 본인 확인을 위해 주민번호 뒷자리 4자리를 말씀해주시겠습니까?",
      "timestamp": "14:32:12"
    },
    {
      "speaker": "customer",
      "message": "1234입니다.",
      "timestamp": "14:32:18"
    }
  ]
}
```

**응답:**
```json
{
  "summary": "문의사항: 고객이 카드를 분실하여 즉시 사용 정지 및 재발급 요청\n\n처리 결과: 카드 사용 즉시 정지 처리 완료. 재발급 카드 신청 접수하였으며, 등록된 주소(서울시 강남구 테헤란로 123)로 3-5일 내 배송 예정. 고객에게 배송 추적 안내 완료.",
  "keywords": ["카드분실", "재발급", "긴급정지"],
  "recommendedCategory": "카드분실",
  "recommendedStatus": "완료",
  "sentiment": {
    "start": "부정적",
    "middle": "중립",
    "end": "긍정적"
  }
}
```

**사용 테이블:**
- (AI 생성, DB 저장 안 함)

**RAG 검색:** ❌

---

##### `GET /api/consultations/{id}/transcript`

**요청 예시:**
```
GET /api/consultations/CS-20250109-1432/transcript
```

**응답:**
```json
{
  "transcript": [
    {
      "speaker": "customer",
      "message": "안녕하세요, 카드를 분실했어요.",
      "timestamp": "14:32:05"
    },
    {
      "speaker": "agent",
      "message": "안녕하세요. 즉시 카드 사용을 정지하겠습니다.",
      "timestamp": "14:32:12"
    }
  ]
}
```

**사용 테이블:**
- `consultation_transcripts`

**RAG 검색:** ❌

---

##### `POST /api/consultations/{id}/complete`

**요청:**
```json
{
  "status": "완료",
  "category": "카드분실",
  "memo": "카드 분실 신고 및 재발급 처리 완료. 고객 만족도 높음",
  "summary": {
    "aiSummary": "문의사항: 고객이 카드를 분실하여...",
    "followUpTasks": "재발급 카드 배송 확인 (3일 후)",
    "handoffDepartment": null,
    "handoffNotes": null
  },
  "feedback": {
    "emotionStart": "부정적",
    "emotionMiddle": "중립",
    "emotionEnd": "긍정적",
    "qualityScore": "상",
    "processingTimeScore": 85,
    "gratitudeScore": 75,
    "emotionShiftScore": 88,
    "manualComplianceScore": 92
  },
  "fcr": true,
  "isBestPractice": false
}
```

**응답:**
```json
{
  "success": true,
  "consultationId": "CS-20250109-1432",
  "status": "완료",
  "savedAt": "2025-01-09T14:37:30Z"
}
```

**사용 테이블:**
- `consultations` (UPDATE)
- `consultation_summaries` (INSERT)
- `consultation_feedback` (INSERT)

**RAG 검색:** ❌

---

### 4.5 ConsultationHistoryPage (상담 내역)

#### 화면 구성
1. **상단: 검색/필터**
2. **테이블: 상담 내역 목록**
3. **상세보기 모달**

#### 필요 API

##### `GET /api/consultations?search={keyword}&status={status}&category={category}&startDate={startDate}&endDate={endDate}&page={page}&limit={limit}`

**요청 예시:**
```
GET /api/consultations?search=홍길동&status=완료&category=카드분실&startDate=2025-01-01&endDate=2025-01-09&page=1&limit=20
```

**응답:**
```json
{
  "total": 127,
  "page": 1,
  "limit": 20,
  "totalPages": 7,
  "consultations": [
    {
      "id": "CS-20250109-1432",
      "agent": "이영희",
      "customer": "홍길동",
      "category": "카드분실",
      "status": "완료",
      "datetime": "2025-01-09 14:32",
      "duration": "05:12",
      "fcr": true,
      "isBestPractice": false
    }
  ]
}
```

**사용 테이블:**
- `consultations`
- `customers`
- `employees`

**RAG 검색:** ❌

---

##### `GET /api/consultations/{id}/detail`

**요청 예시:**
```
GET /api/consultations/CS-20250109-1432/detail
```

**응답:**
```json
{
  "consultation": {
    "id": "CS-20250109-1432",
    "customer": {
      "name": "홍길동",
      "phone": "010-1234-5678"
    },
    "agent": {
      "name": "이영희",
      "team": "상담1팀"
    },
    "category": "카드분실",
    "status": "완료",
    "datetime": "2025-01-09 14:32",
    "duration": "05:12",
    "fcr": true,
    "isBestPractice": false
  },
  "summary": {
    "aiSummary": "문의사항: 고객이 카드를 분실하여...",
    "memo": "카드 분실 신고 및 재발급 처리 완료",
    "followUpTasks": null,
    "handoffDepartment": null
  },
  "transcript": [
    {
      "speaker": "customer",
      "message": "안녕하세요, 카드를 분실했어요.",
      "timestamp": "14:32:05"
    }
  ],
  "feedback": {
    "emotionStart": "부정적",
    "emotionEnd": "긍정적",
    "qualityScore": "상",
    "processingTimeScore": 85
  }
}
```

**사용 테이블:**
- `consultations`
- `customers`
- `employees`
- `consultation_summaries`
- `consultation_transcripts`
- `consultation_feedback`

**RAG 검색:** ❌

---

### 4.6 ProfilePage (프로필)

#### 화면 구성
1. **프로필 정보**
2. **개인 성과 통계**
3. **뱃지 목록**

#### 필요 API

##### `GET /api/employees/{id}`

**요청 예시:**
```
GET /api/employees/EMP-001
```

**응답:**
```json
{
  "employee": {
    "id": "EMP-001",
    "name": "홍길동",
    "team": "상담1팀",
    "position": "대리",
    "email": "hong@example.com",
    "phone": "010-1234-5678",
    "joinDate": "2024-01-15",
    "status": "active"
  }
}
```

**사용 테이블:**
- `employees`

**RAG 검색:** ❌

---

##### `GET /api/employees/{id}/stats`

**요청 예시:**
```
GET /api/employees/EMP-001/stats
```

**응답:**
```json
{
  "stats": {
    "totalConsultations": 127,
    "fcrRate": 94.0,
    "avgDuration": "4:32",
    "rank": 7,
    "rankTotal": 45,
    "trend": "up",
    "thisMonth": {
      "consultations": 127,
      "fcr": 94.0
    },
    "today": {
      "consultations": 12,
      "fcr": 95.0
    }
  }
}
```

**사용 테이블:**
- `consultations` (집계)
- `employees`

**RAG 검색:** ❌

---

##### `GET /api/employees/{id}/badges`

**요청 예시:**
```
GET /api/employees/EMP-001/badges
```

**응답:**
```json
{
  "badges": [
    {
      "id": 1,
      "name": "FCR 마스터",
      "description": "FCR 95% 이상 달성",
      "icon": "🏆",
      "color": "#FBBC04",
      "earnedAt": "2025-01-01"
    },
    {
      "id": 2,
      "name": "신속 처리왕",
      "description": "평균 처리 시간 4분 이하",
      "icon": "⚡",
      "color": "#34A853",
      "earnedAt": "2025-01-05"
    }
  ]
}
```

**사용 테이블:**
- `employee_badges`

**RAG 검색:** ❌

---

### 4.7 EmployeesPage (사원 목록)

#### 화면 구성
1. **상단: Top 3 카드 + 검색**
2. **필터: 팀, 직급**
3. **테이블: 사원 목록**
4. **페이지네이션**

#### 필요 API

##### `GET /api/employees?search={keyword}&team={team}&position={position}&page={page}&limit={limit}&sortBy={sortBy}`

**요청 예시:**
```
GET /api/employees?search=홍길동&team=상담1팀&position=대리&page=1&limit=20&sortBy=consultations
```

**응답:**
```json
{
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "employees": [
    {
      "id": "EMP-001",
      "name": "홍길동",
      "team": "상담1팀",
      "position": "대리",
      "consultations": 127,
      "fcr": 94,
      "avgTime": "4:32",
      "rank": 7,
      "trend": "up",
      "status": "active"
    }
  ]
}
```

**사용 테이블:**
- `employees`
- `consultations` (집계)

**RAG 검색:** ❌

---

### 4.8 NoticePage (공지사항)

#### 화면 구성
1. **공지사항 카드 목록**
2. **상세보기 모달**

#### 필요 API

##### `GET /api/notices?tag={tag}&page={page}&limit={limit}`

**요청 예시:**
```
GET /api/notices?tag=긴급&page=1&limit=10
```

**응답:**
```json
{
  "total": 15,
  "page": 1,
  "limit": 10,
  "notices": [
    {
      "id": 1,
      "tag": "긴급",
      "title": "KT 화재로 인한 통신망 장애 대응",
      "date": "2025-01-09",
      "author": "관리자",
      "views": 245,
      "pinned": true,
      "content": "KT 아현지사 화재로 인한 통신망 장애가 발생했습니다..."
    }
  ]
}
```

**사용 테이블:**
- `announcements`

**RAG 검색:** ❌

---

##### `GET /api/notices/{id}`

**요청 예시:**
```
GET /api/notices/1
```

**응답:**
```json
{
  "notice": {
    "id": 1,
    "tag": "긴급",
    "title": "KT 화재로 인한 통신망 장애 대응",
    "date": "2025-01-09",
    "author": "관리자",
    "views": 246,
    "pinned": true,
    "content": "KT 아현지사 화재로 인한 통신망 장애가 발생했습니다. 고객 문의 시 다음과 같이 안내해주세요:\n\n1. 현재 일부 지역에서 통신 장애가 발생하고 있습니다.\n2. 복구 작업이 진행 중이며, 예상 복구 시간은 오후 6시입니다.\n3. 긴급한 경우 와이파이를 통한 인터넷 전화를 이용하시기 바랍니다.\n\n고객 불편 최소화를 위해 신속히 대응해주시기 바랍니다."
  }
}
```

**사용 테이블:**
- `announcements` (조회수 +1)

**RAG 검색:** ❌

---

### 4.9 SimulationPage (시뮬레이션)

#### 화면 구성
1. **상단 배너: 완료 통계**
2. **시나리오 카테고리 필터**
3. **시나리오 카드 목록**
4. **최근 시도 내역**

#### 필요 API

##### `GET /api/simulations/scenarios?category={category}&difficulty={difficulty}`

**요청 예시:**
```
GET /api/simulations/scenarios?category=기본상담&difficulty=초급
```

**응답:**
```json
{
  "scenarios": [
    {
      "id": 1,
      "title": "카드 분실 신고 기본 절차",
      "category": "기본 상담",
      "difficulty": "초급",
      "estimatedTime": "10분",
      "tags": ["카드분실", "신규"],
      "completed": true,
      "locked": false,
      "bestScore": 92
    },
    {
      "id": 2,
      "title": "진상 고객 응대 마스터",
      "category": "민원 대응",
      "difficulty": "고급",
      "estimatedTime": "20분",
      "tags": ["민원", "고급"],
      "completed": false,
      "locked": true,
      "bestScore": null
    }
  ]
}
```

**사용 테이블:**
- `training_scenarios`
- `training_history` (완료 여부, 최고 점수)

**RAG 검색:** ❌

---

##### `GET /api/simulations/history?employeeId={employeeId}`

**요청 예시:**
```
GET /api/simulations/history?employeeId=EMP-001
```

**응답:**
```json
{
  "history": [
    {
      "scenarioId": 1,
      "scenarioTitle": "카드 분실 신고 기본 절차",
      "score": 92,
      "attemptDate": "2025-01-08",
      "duration": "08:45"
    }
  ],
  "stats": {
    "completedScenarios": 3,
    "averageScore": 92,
    "totalAttempts": 5
  }
}
```

**사용 테이블:**
- `training_history`
- `training_scenarios`

**RAG 검색:** ❌

---

### 4.10 AdminStatsPage (관리자 통계)

#### 화면 구성
1. **총괄 현황 (상단)**
2. **주간 상담 추이 (차트)**

#### 필요 API

##### `GET /api/admin/stats/overall?date={date}`

**요청 예시:**
```
GET /api/admin/stats/overall?date=2025-01-09
```

**응답:**
```json
{
  "overall": {
    "totalConsultationsToday": 342,
    "totalEmployees": 45,
    "activeEmployees": 42,
    "averageFCR": 93.2,
    "averageDuration": "4:45"
  }
}
```

**사용 테이블:**
- `consultations` (집계)
- `employees` (집계)

**RAG 검색:** ❌

---

##### `GET /api/admin/stats/weekly?startDate={startDate}&endDate={endDate}`

**요청 예시:**
```
GET /api/admin/stats/weekly?startDate=2025-01-03&endDate=2025-01-09
```

**응답:**
```json
{
  "weeklyStats": [
    {
      "date": "2025-01-03",
      "totalConsultations": 320,
      "fcrRate": 92.5
    },
    {
      "date": "2025-01-04",
      "totalConsultations": 335,
      "fcrRate": 93.1
    },
    {
      "date": "2025-01-09",
      "totalConsultations": 342,
      "fcrRate": 93.8
    }
  ]
}
```

**사용 테이블:**
- `consultations` (집계)

**RAG 검색:** ❌

---

### 4.11 AdminConsultationManagePage (상담 관리)

#### 필요 API
- **동일**: `/api/consultations` (필터 추가)

---

### 4.12 AdminManagePage (사원 관리)

#### 화면 구성
1. **사원 목록 테이블**
2. **사원 추가/수정/삭제**

#### 필요 API

##### `POST /api/admin/employees`

**요청:**
```json
{
  "name": "신규사원",
  "team": "상담1팀",
  "position": "사원",
  "email": "newemployee@example.com",
  "phone": "010-9999-9999",
  "joinDate": "2025-01-10",
  "password": "password123"
}
```

**응답:**
```json
{
  "success": true,
  "employee": {
    "id": "EMP-046",
    "name": "신규사원",
    "team": "상담1팀",
    "position": "사원",
    "status": "active"
  }
}
```

**사용 테이블:**
- `employees` (INSERT)

**RAG 검색:** ❌

---

##### `PATCH /api/admin/employees/{id}`

**요청:**
```json
{
  "team": "상담2팀",
  "position": "대리",
  "status": "active"
}
```

**응답:**
```json
{
  "success": true,
  "employee": {
    "id": "EMP-001",
    "name": "홍길동",
    "team": "상담2팀",
    "position": "대리",
    "status": "active"
  }
}
```

**사용 테이블:**
- `employees` (UPDATE)

**RAG 검색:** ❌

---

##### `DELETE /api/admin/employees/{id}`

**요청 예시:**
```
DELETE /api/admin/employees/EMP-046
```

**응답:**
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

**사용 테이블:**
- `employees` (DELETE 또는 status = 'inactive')

**RAG 검색:** ❌

---

### 4.13 AdminNoticePage (공지사항 관리)

#### 필요 API

##### `POST /api/admin/notices`

**요청:**
```json
{
  "tag": "시스템",
  "title": "시스템 점검 안내",
  "content": "2025년 1월 15일 오전 2시~4시까지 시스템 점검이 예정되어 있습니다.",
  "pinned": false
}
```

**응답:**
```json
{
  "success": true,
  "notice": {
    "id": 16,
    "tag": "시스템",
    "title": "시스템 점검 안내",
    "date": "2025-01-09",
    "author": "관리자",
    "views": 0,
    "pinned": false
  }
}
```

**사용 테이블:**
- `announcements` (INSERT)

**RAG 검색:** ❌

---

##### `PATCH /api/admin/notices/{id}`

**요청:**
```json
{
  "title": "시스템 점검 일정 변경 안내",
  "pinned": true
}
```

**응답:**
```json
{
  "success": true,
  "notice": {
    "id": 16,
    "title": "시스템 점검 일정 변경 안내",
    "pinned": true
  }
}
```

**사용 테이블:**
- `announcements` (UPDATE)

**RAG 검색:** ❌

---

##### `DELETE /api/admin/notices/{id}`

**요청 예시:**
```
DELETE /api/admin/notices/16
```

**응답:**
```json
{
  "success": true,
  "message": "Notice deleted successfully"
}
```

**사용 테이블:**
- `announcements` (DELETE)

**RAG 검색:** ❌

---

## 5. 공통 API

### 5.1 인증 관련

##### `POST /api/auth/login`
- 로그인 인증
- JWT 토큰 발급

##### `POST /api/auth/logout`
- 로그아웃
- 세션 종료

##### `GET /api/auth/verify`
- 토큰 검증
- 현재 사용자 정보 조회

---

### 5.2 파일 업로드

##### `POST /api/upload/audio`
- STT용 오디오 파일 업로드
- 지원 형식: wav, mp3, m4a

---

## 6. RAG/AI API

### 6.1 RAG 검색 API

##### `POST /api/rag/search`
- **용도**: 실시간 상담 칸반보드
- **VectorDB**: guide_documents, card_usage_guides, faqs
- **임베딩 모델**: text-embedding-ada-002
- **검색 알고리즘**: Cosine Similarity

**검색 로직:**
1. STT 키워드 → 임베딩 변환
2. VectorDB 유사도 검색 (Top 10)
3. document_type 분류:
   - `current_situation` → currentSituation
   - `next_step` → nextStep
4. 각 배열에서 Top 2 선택
5. relevanceScore 0.7 이하 제외

---

##### `POST /api/consultations/similar`
- **용도**: 후처리 페이지 유사 사례 검색
- **VectorDB**: consultations 임베딩
- **검색 기준**: 카테고리, 키워드, 처리 결과

---

##### `POST /api/ai/assistant`
- **용도**: 실시간 상담 AI 어시스턴트
- **모델**: GPT-4-turbo
- **RAG**: VectorDB 검색 + GPT-4 답변 생성

---

### 6.2 AI 생성 API

##### `POST /api/ai/summarize`
- **용도**: 상담 전문 요약
- **모델**: GPT-4-turbo
- **입력**: 상담 전문 (transcript)
- **출력**: 요약, 키워드, 감정 분석

---

##### `POST /api/stt/keywords`
- **용도**: 음성 → 텍스트 → 키워드 추출
- **STT 모델**: Whisper
- **키워드 추출**: NLP 분석

---

## 7. 데이터베이스 테이블 매핑

### 7.1 카드 정보 DB (6개 테이블)

| 테이블명 | 설명 | 사용 API |
|---------|------|---------|
| card_products | 카드 상품 정보 | (예정) |
| card_benefits | 카드 혜택 정보 | (예정) |
| fee_info | 수수료 정보 | (예정) |
| point_policy | 포인트 정책 | (예정) |
| promotions | 프로모션 정보 | (예정) |
| card_usage_guides | 카드 사용 가이드 | RAG 검색 |

---

### 7.2 카드사 이용 안내 DB (4개 테이블)

| 테이블명 | 설명 | 사용 API |
|---------|------|---------|
| announcements | 공지사항 | `/api/notices/*` |
| faqs | 자주 찾는 문의 | RAG 검색 |
| guide_documents | 가이드 문서 | RAG 검색 |
| consumer_alerts | 소비자 주의 경보 | (예정) |

---

### 7.3 상담 사례 DB (13개 테이블)

| 테이블명 | 설명 | 사용 API |
|---------|------|---------|
| consultations | 상담 마스터 | `/api/consultations/*` |
| customers | 고객 정보 | `/api/customers/*` |
| employees | 직원 정보 | `/api/employees/*` |
| consultation_transcripts | 상담 전문 | `/api/consultations/{id}/transcript` |
| consultation_summaries | 상담 요약 | `/api/consultations/{id}/complete` |
| consultation_feedback | 감정 분석/피드백 | `/api/consultations/{id}/complete` |
| stt_keywords | STT 키워드 | `/api/stt/keywords` |
| training_scenarios | 교육 시나리오 | `/api/simulations/scenarios` |
| training_history | 교육 이력 | `/api/simulations/history` |
| employee_badges | 직원 뱃지 | `/api/employees/{id}/badges` |
| best_practices | 우수 사례 | `/api/consultations/best-practices` |
| similar_cases | 유사 사례 임베딩 | `/api/consultations/similar` |
| ai_responses | AI 응답 로그 | `/api/ai/assistant` |

---

## 8. API 우선순위

### 8.1 Phase 1: 핵심 기능 (필수)

1. ✅ `POST /api/auth/login` - 로그인
2. ✅ `GET /api/customers/{customerId}` - 고객 정보 조회
3. ✅ **`POST /api/rag/search`** - 칸반보드 RAG 검색 ⭐⭐⭐
4. ✅ `POST /api/consultations/start` - 상담 시작
5. ✅ `POST /api/consultations/{id}/complete` - 후처리 완료
6. ✅ `POST /api/ai/summarize` - AI 요약 생성
7. ✅ `GET /api/consultations` - 상담 내역 조회

---

### 8.2 Phase 2: 확장 기능

8. `POST /api/stt/keywords` - STT 키워드 추출
9. `POST /api/ai/assistant` - AI 어시스턴트
10. `POST /api/consultations/similar` - 유사 사례 검색
11. `GET /api/employees` - 사원 목록
12. `GET /api/notices` - 공지사항

---

### 8.3 Phase 3: 관리 기능

13. `POST /api/admin/employees` - 사원 추가
14. `PATCH /api/admin/employees/{id}` - 사원 수정
15. `DELETE /api/admin/employees/{id}` - 사원 삭제
16. `POST /api/admin/notices` - 공지 추가
17. `PATCH /api/admin/notices/{id}` - 공지 수정
18. `DELETE /api/admin/notices/{id}` - 공지 삭제

---

## 9. 성능 요구사항

### 9.1 응답 시간

| API 유형 | 목표 응답 시간 | 비고 |
|---------|---------------|------|
| 일반 조회 (GET) | < 200ms | RDB 쿼리 |
| RAG 검색 | < 1.5s | VectorDB + 임베딩 |
| AI 생성 | < 3s | GPT-4 호출 |
| STT 처리 | < 2s | Whisper 호출 |

---

### 9.2 동시 접속

- **목표**: 100명 동시 접속
- **실시간 상담**: 50명 동시 진행

---

## 10. 보안 요구사항

### 10.1 인증
- JWT 토큰 기반 인증
- Access Token 유효기간: 1시간
- Refresh Token 유효기간: 7일

### 10.2 권한
- 역할 기반 접근 제어 (RBAC)
  - `admin`: 전체 접근
  - `agent`: 상담 기능만 접근

### 10.3 개인정보 보호
- 고객 정보 암호화 (AES-256)
- 상담 전문 암호화
- 로그 민감 정보 마스킹

---

## 11. 업데이트 이력

| 날짜 | 내용 |
|------|------|
| 2025-01-09 | API 요구 명세서 초안 작성 (37개 API, 14개 페이지) |
