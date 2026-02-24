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

function warningProvider(
  provider: ProviderKey,
  label: string,
  message: string,
  seed: number
): ProviderUsage {
  return {
    provider,
    label,
    currency: "USD",
    balance: 0,
    monthlyTotal: 0,
    daily: makeFallbackDaily(seed),
    status: "warning",
    message,
  };
}

async function fetchOpenAI(): Promise<ProviderUsage> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return warningProvider("openai", "OpenAI", "OPENAI_API_KEY가 설정되지 않았어요.", 1);
  }

  const startDate = format(startOfMonth(today), "yyyy-MM-dd");
  const endDate = format(endOfMonth(today), "yyyy-MM-dd");

  try {
    const [subscriptionRes, usageRes] = await Promise.all([
      fetch("https://api.openai.com/v1/dashboard/billing/subscription", {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      }),
      fetch(
        `https://api.openai.com/v1/dashboard/billing/usage?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          cache: "no-store",
        }
      ),
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
      status: "ok",
      message: usageRes.ok
        ? "실시간 API 사용량을 불러왔어요."
        : "일별 상세는 샘플 데이터로 표시 중이에요.",
    };
  } catch {
    return {
      provider: "openai",
      label: "OpenAI",
      currency: "USD",
      balance: 0,
      monthlyTotal: 0,
      daily: makeFallbackDaily(1),
      status: "error",
      message: "OpenAI API 조회에 실패했어요.",
    };
  }
}

async function fetchAnthropic(): Promise<ProviderUsage> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return warningProvider(
      "anthropic",
      "Anthropic",
      "ANTHROPIC_API_KEY가 설정되지 않았어요.",
      2
    );
  }

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

    return {
      provider: "anthropic",
      label: "Anthropic",
      currency: "USD",
      balance: Number(data?.remaining_balance_usd ?? 0),
      monthlyTotal: Number(data?.month_total_usd ?? 0),
      daily: data?.daily ?? makeFallbackDaily(2),
      status: "ok",
      message: "Anthropic 사용량 API를 조회했어요.",
    };
  } catch {
    return warningProvider(
      "anthropic",
      "Anthropic",
      "Anthropic 일별/월별은 샘플 데이터로 표시 중이에요.",
      2
    );
  }
}

async function fetchGoogle(): Promise<ProviderUsage> {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) {
    return warningProvider(
      "google",
      "Google AI Studio",
      "GOOGLE_AI_STUDIO_API_KEY가 설정되지 않았어요.",
      3
    );
  }

  const usageEndpoint = process.env.GOOGLE_USAGE_ENDPOINT;
  const balanceEndpoint = process.env.GOOGLE_BALANCE_ENDPOINT;

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
      provider: "google",
      label: "Google AI Studio",
      currency: "USD",
      balance: Number(balanceData?.balance ?? 0),
      monthlyTotal: Number(usageData?.monthlyTotal ?? 0),
      daily: usageData?.daily ?? makeFallbackDaily(3),
      status: usageData || balanceData ? "ok" : "warning",
      message: usageData || balanceData
        ? "Google endpoint에서 데이터를 불러왔어요."
        : "Google endpoint env를 연결하면 실데이터로 표시돼요.",
    };
  } catch {
    return warningProvider("google", "Google AI Studio", "Google 데이터는 샘플로 표시 중이에요.", 3);
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
  if (!apiKey) {
    return warningProvider(opts.provider, opts.label, `${opts.keyEnv}가 설정되지 않았어요.`, opts.seed);
  }

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
      status: usageData || balanceData ? "ok" : "warning",
      message: usageData || balanceData
        ? `${opts.label} endpoint에서 데이터를 불러왔어요.`
        : `${opts.label} endpoint env를 연결하면 실데이터로 표시돼요.`,
    };
  } catch {
    return warningProvider(opts.provider, opts.label, `${opts.label} 데이터는 샘플로 표시 중이에요.`, opts.seed);
  }
}

async function fetchGroq(): Promise<ProviderUsage> {
  return fetchCustomProvider({
    provider: "groq",
    label: "Groq",
    keyEnv: "GROQ_API_KEY",
    usageEnv: "GROQ_USAGE_ENDPOINT",
    balanceEnv: "GROQ_BALANCE_ENDPOINT",
    seed: 4,
  });
}

async function fetchKimi(): Promise<ProviderUsage> {
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
