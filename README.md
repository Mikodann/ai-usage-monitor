# AI 사용량 모니터링 웹앱

독립 프로젝트로 만든 **Next.js 14 + Tailwind + Recharts** 기반 사용량 대시보드입니다.

## 기능
- OpenAI / Anthropic / Google AI Studio 제공자 카드
- 제공자별 잔액, 월간 사용량, 일별 차트
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

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_AI_STUDIO_API_KEY`
- (선택) `GOOGLE_USAGE_ENDPOINT`, `GOOGLE_BALANCE_ENDPOINT`

> 참고: OpenAI의 기존 billing endpoint(`/v1/dashboard/billing/...`)는 계정/플랜별 접근 제한이 있을 수 있습니다.
> Anthropic/Google도 계정별로 사용량 API가 다를 수 있어, 실패 시 샘플 데이터로 안전하게 폴백하도록 구현했습니다.

## Vercel 배포
1. GitHub에 push
2. Vercel에서 프로젝트 Import
3. Build Command: `npm run build` (기본값)
4. 환경 변수 등록 후 Deploy

## 구조
- `src/app/page.tsx` : 메인 대시보드
- `src/app/api/usage/route.ts` : 서버 API 집계
- `src/lib/providers.ts` : 제공자별 조회 로직
- `src/components/ProviderCard.tsx` : 카드 + 차트 컴포넌트
