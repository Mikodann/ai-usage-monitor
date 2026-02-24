export type ProviderKey = "openai" | "anthropic" | "google" | "groq" | "kimi";

export type UsagePoint = {
  date: string;
  value: number;
};

export type ProviderUsage = {
  provider: ProviderKey;
  label: string;
  currency: string;
  balance: number;
  monthlyTotal: number;
  daily: UsagePoint[];
  status: "ok" | "warning" | "error";
  message?: string;
};

export type UsageResponse = {
  updatedAt: string;
  providers: ProviderUsage[];
};
