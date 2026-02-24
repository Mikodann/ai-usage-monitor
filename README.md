# AI 사용량 모니터링 웹앱

독립 프로젝트로 만든 **Next.js 14 + Tailwind + Recharts** 기반 사용량 대시보드입니다.

## 기능
- 5개 제공자 모니터링: OpenAI / Anthropic / Google AI Studio / Groq / Kimi
- 제공자별 잔액, 월간 사용량, 일별 차트
- 모델(제공자) 검색 기능
- 30초 자동 갱신 (SWR)
- 한국어 UI
- 반응형 레이아웃 (모바일/태블릿/PC)

## 시작
```bash
npm install
npm run dev
```

## 환경 변수
`.env.local` 파일을 만들고 아래를 설정하세요.

```bash
cp .env.example .env.local
```

필수/선택 env:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_AI_STUDIO_API_KEY`
- `GROQ_API_KEY`
- `KIMI_API_KEY`
- (선택) `GOOGLE_USAGE_ENDPOINT`, `GOOGLE_BALANCE_ENDPOINT`
- (선택) `GROQ_USAGE_ENDPOINT`, `GROQ_BALANCE_ENDPOINT`
- (선택) `KIMI_USAGE_ENDPOINT`, `KIMI_BALANCE_ENDPOINT`

> 참고: 제공자별 billing/usage endpoint 접근 가능 여부는 계정/플랜에 따라 다를 수 있습니다.
> 실패 시 샘플 데이터로 안전하게 폴백하도록 구현되어 있습니다.

## Vercel 배포 (최종 정리)
1. GitHub에 push
2. Vercel에서 저장소 Import
3. Framework: Next.js (자동 감지)
4. Build Command: `npm run build` (기본값)
5. Environment Variables에 API 키/endpoint 등록
6. Deploy

## 구조
- `src/app/page.tsx` : 메인 대시보드 + 검색
- `src/app/api/usage/route.ts` : 서버 API 집계
- `src/lib/providers.ts` : 5개 제공자 조회 로직
- `src/components/ProviderCard.tsx` : 카드 + 차트 컴포넌트
