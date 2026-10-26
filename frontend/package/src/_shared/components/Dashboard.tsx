"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Period, PeriodDashboard } from "@/_models/period.model";
import type { UploadGaps } from "@/_models/upload.model";
import { periodService } from "@/_services/period.service";
import { uploadService } from "@/_services/upload.service";
import Money from "@/_shared/components/Money";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const PIE_COLORS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#0ea5e9", // sky
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#f97316", // orange
];

export function Dashboard() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [idx, setIdx] = useState(-1);
  const [metrics, setMetrics] = useState<PeriodDashboard | null>(null);
  const [uploadGaps, setUploadGaps] = useState<UploadGaps>([]);
  const [uploadsRefreshing, setUploadsRefreshing] = useState(true);

  const refreshUploads = () => {
    setUploadsRefreshing(true);
    uploadService
      .getGaps()
      .then(setUploadGaps)
      .finally(() => setUploadsRefreshing(false));
  };

  useEffect(refreshUploads, []);

  useEffect(() => {
    periodService.getAll().then((all) => {
      const sorted = [...all].sort((a, b) =>
        a.year !== b.year ? b.year - a.year : b.month - a.month,
      );
      setPeriods(sorted);
      const activeIdx = sorted.findIndex((p) => p.active);
      setIdx(Math.max(activeIdx, 0));
    });
  }, []);

  const period = periods[idx];

  useEffect(() => {
    if (!period) return;
    let cancelled = false;
    periodService.getDashboard(period.id).then((data) => {
      if (!cancelled) setMetrics(data);
    });
    return () => {
      cancelled = true;
    };
  }, [period]);

  if (!period || !metrics || metrics.period.id !== period.id) {
    return (
      <div className="p-8 max-w-7xl mx-auto animate-pulse space-y-6">
        <div className="h-10 w-48 bg-zinc-100 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-100 rounded-lg h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-zinc-100 rounded-lg h-56" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-100 rounded-lg h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {uploadGaps.length > 0 && (
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full hover:bg-amber-200 transition-colors"
                >
                  {uploadGaps.length} missing upload
                  {uploadGaps.length > 1 ? "s" : ""}
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="text-base font-semibold">
                      Missing Uploads — {new Date().getFullYear()}
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={refreshUploads}
                      disabled={uploadsRefreshing}
                      className="p-1.5 rounded hover:bg-zinc-100 disabled:opacity-40 transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw
                        className={`size-4 text-zinc-500 ${uploadsRefreshing ? "animate-spin" : ""}`}
                      />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {uploadGaps.map(({ identifier, gaps }) => (
                      <div key={identifier}>
                        <p className="text-sm font-medium text-zinc-800 mb-1.5">
                          {identifier}
                        </p>
                        <div className="space-y-1">
                          {gaps.map((gap, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-xs text-zinc-600"
                            >
                              <span className="font-mono">
                                {gap.from} → {gap.to}
                              </span>
                              <span className="text-zinc-400">
                                ({gap.days} days)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )}
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-2 py-1.5">
          <button
            type="button"
            onClick={() => setIdx((i) => Math.min(i + 1, periods.length - 1))}
            disabled={idx >= periods.length - 1}
            className="p-1.5 rounded hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-semibold w-40 text-center">
            {MONTH_NAMES[period.month - 1]} {period.year}
            {period.active && (
              <span className="ml-1.5 text-xs font-normal text-green-600">
                ● active
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setIdx((i) => Math.max(i - 1, 0))}
            disabled={idx === 0}
            className="p-1.5 rounded hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {!metrics.total_expenses && !metrics.total_income ? (
        <p className="text-zinc-500 text-sm">
          No data available for this period.
        </p>
      ) : (
        <div className="space-y-6">
          {/* Row 1: KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total Expenses"
              displayValue={-metrics.total_expenses}
              currency={metrics.currency}
              trend={metrics.mom_expenses}
              invertTrend
            />
            <KpiCard
              label="Total Income"
              displayValue={metrics.total_income}
              currency={metrics.currency}
              trend={metrics.mom_income}
            />
            <KpiCard
              label="Net Balance"
              displayValue={metrics.net_balance}
              currency={metrics.currency}
            />
            <SavingsCard rate={metrics.savings_rate} />
          </div>

          {/* Row 2: Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MonthComparisonCard
              current={{
                expenses: metrics.total_expenses,
                income: metrics.total_income,
              }}
              prev={{
                expenses: metrics.prev_expenses,
                income: metrics.prev_income,
              }}
              currentLabel={MONTH_NAMES[period.month - 1].slice(0, 3)}
              prevLabel={
                metrics.prev_period
                  ? MONTH_NAMES[metrics.prev_period.month - 1].slice(0, 3)
                  : "Prev"
              }
              currency={metrics.currency}
            />
            <TopCategoriesCard
              categories={metrics.top_categories}
              currency={metrics.currency}
            />
          </div>

          {/* Row 3: Detail cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DailyAverageCard
              amount={metrics.daily_average}
              currency={metrics.currency}
            />
            <LargestExpenseCard
              transaction={metrics.largest_expense}
              currency={metrics.currency}
            />
            <RecurringVsOneOffCard
              recurring={metrics.recurring_total}
              oneOff={metrics.one_off_total}
            />
            <AccountDistributionCard accounts={metrics.distribution} />
          </div>

          {/* Row 4: Daily activity chart */}
          <DailyActivityChart
            data={metrics.daily}
            currency={metrics.currency}
          />
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  displayValue,
  currency,
  trend,
  invertTrend = false,
}: {
  label: string;
  displayValue: number;
  currency: string;
  trend?: number | null;
  invertTrend?: boolean;
}) {
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
        {label}
      </p>
      <Money
        value={{ value: displayValue, currency }}
        className="text-2xl block mb-2"
      />
      {trend != null && <TrendBadge value={trend} invert={invertTrend} />}
    </div>
  );
}

function SavingsCard({ rate }: { rate: number }) {
  const color =
    rate >= 20
      ? "text-green-600"
      : rate >= 0
        ? "text-amber-600"
        : "text-red-600";
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
        Savings Rate
      </p>
      <p className={`text-2xl font-bold ${color} mb-2`}>{rate.toFixed(1)}%</p>
      <p className="text-xs text-zinc-400">(Income − Expenses) / Income</p>
    </div>
  );
}

function TrendBadge({
  value,
  invert = false,
}: {
  value: number;
  invert?: boolean;
}) {
  const isPositive = value > 0;
  const isGood = invert ? !isPositive : isPositive;
  const color = isGood ? "text-green-600" : "text-red-600";
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon className="size-3" />
      {Math.abs(value).toFixed(1)}% vs last month
    </span>
  );
}

function MonthComparisonCard({
  current,
  prev,
  currentLabel,
  prevLabel,
  currency,
}: {
  current: { expenses: number; income: number };
  prev: { expenses: number; income: number };
  currentLabel: string;
  prevLabel: string;
  currency: string;
}) {
  const chartData = [
    {
      name: "Expenses",
      [prevLabel]: prev.expenses,
      [currentLabel]: current.expenses,
    },
    {
      name: "Income",
      [prevLabel]: prev.income,
      [currentLabel]: current.income,
    },
  ];

  const fmt = (v: number) =>
    `${currency} ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-4">
        Month-over-Month Comparison
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            width={36}
          />
          <Tooltip formatter={(v: unknown) => [fmt(v as number), undefined]} />
          <Bar dataKey={prevLabel} fill="#a5b4fc" radius={[4, 4, 0, 0]} />
          <Bar dataKey={currentLabel} fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-indigo-300 inline-block" />
          {prevLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-indigo-500 inline-block" />
          {currentLabel}
        </span>
      </div>
    </div>
  );
}

function TopCategoriesCard({
  categories,
  currency,
}: {
  categories: { name: string; amount: number; percentage: number }[];
  currency: string;
}) {
  const fmt = (v: number) =>
    v.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-4">
        Top Expense Categories
      </p>
      {categories.length === 0 ? (
        <p className="text-sm text-zinc-400">No expense data.</p>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, i) => (
            <div key={cat.name}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium truncate max-w-[55%]">
                  {cat.name}
                </span>
                <span className="text-sm text-zinc-600">
                  {currency} {fmt(cat.amount)}
                  <span className="text-zinc-400 ml-1.5">
                    ({cat.percentage.toFixed(0)}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${cat.percentage}%`,
                    background: PIE_COLORS[i % PIE_COLORS.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyAverageCard({
  amount,
  currency,
}: {
  amount: number;
  currency: string;
}) {
  const fmt = (v: number) =>
    v.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
        Daily Average Spend
      </p>
      <p className="text-2xl font-bold text-red-600 mb-1">
        {currency} {fmt(amount)}
      </p>
      <p className="text-xs text-zinc-400">Per day this period</p>
    </div>
  );
}

function LargestExpenseCard({
  transaction,
  currency,
}: {
  transaction: PeriodDashboard["largest_expense"];
  currency: string;
}) {
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
        Largest Expense
      </p>
      {!transaction ? (
        <p className="text-sm text-zinc-400 mt-2">No transactions found.</p>
      ) : (
        <>
          <Money
            value={{
              value: -transaction.amount,
              currency,
            }}
            className="text-2xl block mb-1"
          />
          <p className="text-sm font-medium text-zinc-700 truncate">
            {transaction.description ?? transaction.account}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {transaction.account} · {transaction.payment_date}
          </p>
        </>
      )}
    </div>
  );
}

function RecurringVsOneOffCard({
  recurring,
  oneOff,
}: {
  recurring: number;
  oneOff: number;
}) {
  const total = recurring + oneOff;
  const data = [
    { name: "Recurring", value: recurring },
    { name: "One-off", value: oneOff },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
        Recurring vs One-Off
      </p>
      {total === 0 ? (
        <p className="text-sm text-zinc-400">No data.</p>
      ) : (
        <>
          <div className="flex justify-center">
            <PieChart width={120} height={110}>
              <Pie
                data={data}
                cx={55}
                cy={50}
                innerRadius={28}
                outerRadius={48}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-1.5 mt-1">
            {data.map((d, i) => (
              <div
                key={d.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {d.name}
                </span>
                <span className="text-zinc-600 font-medium">
                  {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DailyActivityChart({
  data,
  currency,
}: {
  data: { day: string; expenses: number; income: number }[];
  currency: string;
}) {
  const fmt = (v: number) =>
    `${currency} ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-4">
        Daily Expenses & Income
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={1}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip formatter={(v: unknown) => [fmt(v as number), undefined]} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            name="Expenses"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function AccountDistributionCard({
  accounts,
}: {
  accounts: { name: string; amount: number; percentage: number }[];
}) {
  const data = accounts.map((a) => ({ name: a.name, value: a.amount }));

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
        Expense Distribution
      </p>
      {data.length === 0 ? (
        <p className="text-sm text-zinc-400">No data.</p>
      ) : (
        <>
          <div className="flex justify-center">
            <PieChart width={120} height={110}>
              <Pie
                data={data}
                cx={55}
                cy={50}
                innerRadius={28}
                outerRadius={48}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-1.5 mt-1 max-h-24 overflow-y-auto pr-1">
            {accounts.map((a, i) => (
              <div
                key={a.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-1.5 truncate max-w-[70%]">
                  <span
                    className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="truncate">{a.name}</span>
                </span>
                <span className="text-zinc-600 font-medium ml-1">
                  {a.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
