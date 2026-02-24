"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ProviderUsage } from "@/lib/types";

const statusColor = {
  ok: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-rose-100 text-rose-700",
};

export function ProviderCard({ provider }: { provider: ProviderUsage }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{provider.label}</h2>
          <p className="text-xs text-slate-500">{provider.message ?? "-"}</p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${statusColor[provider.status]}`}
        >
          {provider.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-slate-500">현재 잔액</div>
          <div className="text-xl font-bold">
            {provider.balance.toLocaleString()} {provider.currency}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-slate-500">이번 달 사용량</div>
          <div className="text-xl font-bold">
            {provider.monthlyTotal.toLocaleString()} {provider.currency}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-indigo-50 p-2">
          <div className="text-slate-500">최근 5시간 사용량</div>
          <div className="font-semibold text-indigo-700">
            {provider.usageWindows.last5Hours !== undefined
              ? `${provider.usageWindows.last5Hours.toLocaleString()} ${provider.currency}`
              : "미지원"}
          </div>
        </div>
        <div className="rounded-lg bg-indigo-50 p-2">
          <div className="text-slate-500">최근 1주 사용량</div>
          <div className="font-semibold text-indigo-700">
            {provider.usageWindows.last7Days !== undefined
              ? `${provider.usageWindows.last7Days.toLocaleString()} ${provider.currency}`
              : "미지원"}
          </div>
        </div>
        <div className="rounded-lg bg-indigo-50 p-2">
          <div className="text-slate-500">최근 1달 사용량</div>
          <div className="font-semibold text-indigo-700">
            {provider.usageWindows.last30Days !== undefined
              ? `${provider.usageWindows.last30Days.toLocaleString()} ${provider.currency}`
              : "미지원"}
          </div>
        </div>
      </div>

      <div className="mt-4 h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={provider.daily}>
            <defs>
              <linearGradient id={`color-${provider.provider}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={36} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              fillOpacity={1}
              fill={`url(#color-${provider.provider})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
