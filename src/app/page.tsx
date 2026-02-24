"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { ProviderCard } from "@/components/ProviderCard";
import { UsageResponse } from "@/lib/types";

const fetcher = async (url: string): Promise<UsageResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("데이터 조회 실패");
  return res.json();
};

export default function Home() {
  const [query, setQuery] = useState("");
  const { data, error, isLoading } = useSWR<UsageResponse>("/api/usage", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });

  const filteredProviders = useMemo(() => {
    if (!data?.providers) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.providers;
    return data.providers.filter((provider) =>
      [provider.label, provider.provider].some((text) => text.toLowerCase().includes(q))
    );
  }, [data?.providers, query]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">AI 사용량 모니터링</h1>
            <p className="text-sm text-slate-500">
              OpenAI · Anthropic · Google AI Studio · Groq · Kimi (30초 자동 갱신)
            </p>
          </div>
          <div className="text-xs text-slate-500">
            마지막 업데이트: {data ? new Date(data.updatedAt).toLocaleString("ko-KR") : "-"}
          </div>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="모델 검색 (예: OpenAI, Groq, kimi)"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 transition focus:ring-2"
        />
      </header>

      {isLoading && <p className="text-sm text-slate-500">로딩 중...</p>}
      {error && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          데이터를 불러오는 중 오류가 발생했어요.
        </p>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProviders.map((provider) => (
          <ProviderCard key={provider.provider} provider={provider} />
        ))}
      </section>
    </main>
  );
}
