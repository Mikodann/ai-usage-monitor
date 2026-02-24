import { endOfMonth, format, startOfMonth, subDays } from "date-fns";
import { ProviderUsage, ProviderKey, UsagePoint } from "./types";

const today = new Date();

function makeFallbackDaily(seed = 3): UsagePoint[] {
  return Array.from({ length: 30 }, (_, i) => {
    const day = subDays(today, 29 - i);
    return {
      date: format(day, "MM-dd"),
      value: Number((Math.max(0.1, Math.sin((i + seed) / 3) * 4 + 6)).toFixed(2)),
    };
  });
}

function warningProvider(provider: ProviderKey, label: string, message: string, seed: number): ProviderUsage {
  return {
    provider,
    label,
    currency: "USD",
    balance: 0,
    monthlyTotal: 0,
    daily: makeFallbackDaily(seed),
    usageWindows: {},
    status: "warning",
    message,
  };
}

function extractUsageWindows(data: any) {
  return {
    last5Hours:
      typeof data?.usageWindows?.last5Hours === "number" ? Number(data.usageWindows.last5Hours) : undefined,
    last7Days:
      typeof data?.usageWindows?.last7Days === "number" ? Number(data.usageWindows.last7Days) : undefined,
    last30Days:
      typeof data?.usageWindows?.last30Days === "number" ? Number(data.usageWindows.last30Days) : undefined,
  };
}

async function fetchOpenAI(): Promise<ProviderUsage> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return warningProvider("openai", "OpenAI", "OPENAI_API_KEY가 설정되지 않았어요.", 1);

  const startDate = format(startOfMonth(today), "yyyy-MM-dd");
  const endDate = format(endOfMonth(today), "yyyy-MM-dd");

  try {
    const [subscriptionRes, usageRes] = await Promise.all([
      fetch("https://api.openai.com/v1/dashboard/billing/subscription", {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      }),
      fetch(`https://api.openai.com/v1/dashboard/billing/usage?start_date=${startDate}&end_date=${endDate}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      }),
    ]);

    const subscription = subscriptionRes.ok ? await subscriptionRes.json() : {};
    const usage = usageRes.ok ? await usageRes.json() : {};

    const monthlyTotal = Number(((usage.total_usage ?? 0) / 100).toFixed(2));
    const hardLimit = Number(subscription.hard_limit_usd ?? 0);
    const balance = Number((hardLimit - monthlyTotal).toFixed(2));

    return {
      provider: "openai",
      label: "OpenAI",
      currency: "USD",
      balance,
      monthlyTotal,
      daily: makeFallbackDaily(1),
      usageWindows: {
        last30Days: monthlyTotal,
      },
      status: "ok",
      message: "OpenAI API 데이터를 불러왔어요. (5시간/7일은 계정별 endpoint 지원 시 확장 가능)",
    };
  } catch {
    return {
      provider: "openai",
      label: "OpenAI",
      currency: "USD",
      balance: 0,
      monthlyTotal: 0,
      daily: makeFallbackDaily(1),
      usageWindows: {},
      status: "error",
      message: "OpenAI API 조회에 실패했어요.",
    };
  }
}

async function fetchAnthropic(): Promise<ProviderUsage> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return warningProvider("anthropic", "Anthropic", "ANTHROPIC_API_KEY가 설정되지 않았어요.", 2);

  try {
    const res = await fetch("https://api.anthropic.com/v1/organizations/usage", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      cache: "no-store",
    });

    if (!res.ok) throw new Error("usage endpoint unavailable");
    const data = await res.json();
    const usageWindows = extractUsageWindows(data);

    return {
      provider: "anthropic",
      label: "Anthropic",
      currency: "USD",
      balance: Number(data?.remaining_balance_usd ?? 0),
      monthlyTotal: Number(data?.month_total_usd ?? 0),
      daily: data?.daily ?? makeFallbackDaily(2),
      usageWindows,
      status: "ok",
      message: "Anthropic 사용량 API를 조회했어요.",
    };
  } catch {
    return warningProvider("anthropic", "Anthropic", "Anthropic 데이터 조회 실패(또는 미지원)예요.", 2);
  }
}

async function fetchCustomProvider(opts: {
  provider: ProviderKey;
  label: string;
  keyEnv: string;
  usageEnv: string;
  balanceEnv: string;
  seed: number;
}): Promise<ProviderUsage> {
  const apiKey = process.env[opts.keyEnv];
  if (!apiKey) return warningProvider(opts.provider, opts.label, `${opts.keyEnv}가 설정되지 않았어요.`, opts.seed);

  const usageEndpoint = process.env[opts.usageEnv];
  const balanceEndpoint = process.env[opts.balanceEnv];

  try {
    const [usageRes, balanceRes] = await Promise.all([
      usageEndpoint
        ? fetch(usageEndpoint, {
            headers: { Authorization: `Bearer ${apiKey}` },
            cache: "no-store",
          })
        : Promise.resolve(null),
      balanceEndpoint
        ? fetch(balanceEndpoint, {
            headers: { Authorization: `Bearer ${apiKey}` },
            cache: "no-store",
          })
        : Promise.resolve(null),
    ]);

    const usageData = usageRes?.ok ? await usageRes.json() : null;
    const balanceData = balanceRes?.ok ? await balanceRes.json() : null;

    return {
      provider: opts.provider,
      label: opts.label,
      currency: "USD",
      balance: Number(balanceData?.balance ?? 0),
      monthlyTotal: Number(usageData?.monthlyTotal ?? 0),
      daily: usageData?.daily ?? makeFallbackDaily(opts.seed),
      usageWindows: extractUsageWindows(usageData),
      status: usageData || balanceData ? "ok" : "warning",
      message: usageData || balanceData
        ? `${opts.label} endpoint에서 데이터를 불러왔어요.`
        : `${opts.label} endpoint env를 연결하면 실데이터로 표시돼요.`,
    };
  } catch {
    return warningProvider(opts.provider, opts.label, `${opts.label} 데이터 조회 실패(또는 미지원)예요.`, opts.seed);
  }
}

async function fetchGoogle() {
  return fetchCustomProvider({
    provider: "google",
    label: "Google AI Studio",
    keyEnv: "GOOGLE_AI_STUDIO_API_KEY",
    usageEnv: "GOOGLE_USAGE_ENDPOINT",
    balanceEnv: "GOOGLE_BALANCE_ENDPOINT",
    seed: 3,
  });
}

async function fetchGroq() {
  return fetchCustomProvider({
    provider: "groq",
    label: "Groq",
    keyEnv: "GROQ_API_KEY",
    usageEnv: "GROQ_USAGE_ENDPOINT",
    balanceEnv: "GROQ_BALANCE_ENDPOINT",
    seed: 4,
  });
}

async function fetchKimi() {
  return fetchCustomProvider({
    provider: "kimi",
    label: "Kimi",
    keyEnv: "KIMI_API_KEY",
    usageEnv: "KIMI_USAGE_ENDPOINT",
    balanceEnv: "KIMI_BALANCE_ENDPOINT",
    seed: 5,
  });
}

export async function fetchAllProviders(): Promise<ProviderUsage[]> {
  return Promise.all([fetchOpenAI(), fetchAnthropic(), fetchGoogle(), fetchGroq(), fetchKimi()]);
}
