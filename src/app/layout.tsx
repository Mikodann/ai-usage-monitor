import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 사용량 모니터링",
  description: "OpenAI / Anthropic / Google AI Studio 사용량 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
