# VIVA · 검색 정보를 활용한 마케팅 기획 지원 서비스

제품과 타깃·시즌·현재 상황을 입력하면 **시장 정보를 검색하고, 대화를 통해 전략 후보와 상세 실행안을 만드는** 해커톤 팀 프로젝트입니다. React 화면, Express API, 검색·생성 API, PostgreSQL 저장 흐름을 연결합니다.

이 저장소는 **팀원의 [원본 저장소](https://github.com/gustj3104/hackathon-yoons-viva)를 fork한 팀 프로젝트 사본**입니다. 아래 내용은 팀 서비스의 구현 범위이며, 저장소 소유자가 전체 코드를 단독 작성했다는 의미가 아닙니다. 개인 기여는 실제 담당한 설계·파일·검증 범위와 해당 커밋을 기준으로 구분합니다.

## 핵심 구현과 코드

| 기능 | 구현 근거 |
|---|---|
| 제품·타깃 입력과 대화 화면 | [client/src](client/src) |
| 프로젝트 생성·대화·전략 API | [server/routes.ts](server/routes.ts) |
| 시장·트렌드 검색 | [server/tavily.ts](server/tavily.ts) |
| 검색 맥락을 반영한 텍스트 생성 | [server/openai.ts](server/openai.ts) · [server/prompts.ts](server/prompts.ts) |
| 프로젝트·메시지·전략·매출 스키마 | [shared/schema.ts](shared/schema.ts) |
| 조회·저장 및 매출 분석 | [server/storage.ts](server/storage.ts) |
| DB 연결과 스키마 적용 설정 | [server/db.ts](server/db.ts) · [drizzle.config.ts](drizzle.config.ts) |

## 사용자 흐름

1. 제품명, 타깃 연령, 마케팅 시즌, 현재 상황을 입력합니다.
2. Tavily로 관련 시장 정보를 검색하고 생성 요청의 맥락에 포함합니다.
3. 대화 단계에 따라 진단·전략 후보·상세 전략을 생성합니다.
4. 프로젝트, 메시지, 전략을 데이터베이스에 저장하고 다시 조회합니다.
5. 상품·연도별 매출 데이터가 있으면 매출 현황과 추세를 확인합니다.

검색 결과를 생성 프롬프트에 결합하는 구조입니다. 임베딩·벡터DB 검색을 구현한 것으로 확대해 설명하지 않습니다. 생성 결과는 전략 초안이며 시장 사실이나 매출 향상을 보장하지 않습니다.

## 기술 구성

| 영역 | 사용 기술 |
|---|---|
| 화면 | React, TypeScript, Vite, Tailwind CSS |
| 서버 | Node.js, Express, Zod |
| 데이터 | PostgreSQL, Neon serverless 연결, Drizzle ORM |
| 외부 API | OpenAI, Tavily |
| 실행·점검 | tsx, esbuild, TypeScript compiler |

## 실행 준비

필요한 환경은 Node.js 20 이상을 권장하며, 저장소에 포함된 [package.json](package.json)·[잠금 파일](package-lock.json)을 기준으로 의존성을 설치합니다. 완성된 독립 배포 패키지나 Docker 환경은 제공하지 않습니다.

| 환경변수 | 용도 |
|---|---|
| `DATABASE_URL` | Neon serverless 드라이버와 호환되는 PostgreSQL 연결 문자열 |
| `OPENAI_API_KEY` | 텍스트 생성 API |
| `TAVILY_API_KEY` | 시장 검색 API |
| `PORT` | 서버 포트, 기본값 5000 |

서버는 `process.env`를 읽습니다. `.env` 파일을 만들기만 해서는 현재 코드가 자동 로드하지 않으므로, 터미널·실행 환경에서 변수를 주입해야 합니다. 실제 키와 DB 비밀번호를 저장소에 올리지 않습니다.

### Linux / WSL / macOS

환경변수를 설정한 저장소 루트에서 실행합니다.

```bash
npm ci
npm run db:push
npm run dev
```

`db:push`는 연결한 DB의 스키마를 변경합니다. 개인 개발용 DB를 사용합니다. 기본 접속 주소는 `http://localhost:5000`입니다. 현재 DB 드라이버는 일반 로컬 PostgreSQL과 연결 조건이 다를 수 있으므로, Neon 연결을 우선 기준으로 합니다.

### Windows PowerShell

`package.json`의 `NODE_ENV=...` 문법을 피하려면 다음처럼 실행합니다. 그 전에 위 환경변수를 PowerShell 세션에 설정합니다.

```powershell
npm ci
npm run db:push
$env:NODE_ENV = "development"
npx tsx server/index.ts
```

서버의 `reusePort: true`가 실행 환경에서 지원되지 않으면 WSL/Linux에서 실행하거나 서버 listen 설정의 호환성을 조정해야 합니다.

### 타입 검사와 빌드

```bash
npm run check
npm run build
```

Linux 계열에서는 환경변수 설정 후 `npm start`로 빌드 결과를 실행합니다. 이 문서의 실행 절차는 코드·설정 기준이며, 별도 DB와 유료 API를 연결한 전체 동작 검증 기록은 아직 첨부하지 않았습니다.

## 결과를 확인할 지점

| 확인 항목 | API·자료 |
|---|---|
| 저장된 프로젝트 목록 | `GET /api/projects` |
| 특정 프로젝트 대화 | `GET /api/messages/:projectId` |
| 생성된 전략 목록 | `GET /api/strategies/:projectId` |
| 매출 조회·상위 상품·추세 | `GET /api/sales`, `/api/sales/top`, `/api/sales/trending` |
| 기업 분석 정보 | `GET /api/company/insights` |

엔드포인트의 파라미터와 처리 방식은 [routes.ts](server/routes.ts)를 확인합니다. 위 항목은 검증할 수 있는 기능 경로이며, 성공률·응답시간 측정값을 의미하지 않습니다.

---
문서 기준: 2026-11-22 · [검토한 코드 버전](https://github.com/yoon-jr/hackathon-yoons-viva/tree/5770d9153d276baacf17af6f091b5dd90dc0731e). 수치는 저장된 실험 결과이며, 새 실행에서는 환경과 설정에 따라 달라질 수 있습니다.
