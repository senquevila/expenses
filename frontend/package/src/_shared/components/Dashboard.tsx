"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Minus,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import * as Dialog from "@radix-ui/react-dialog";
import Money from "@/_shared/components/Money";
import { periodService } from "@/_services/period.service";
import { transactionService } from "@/_services/transaction.service";
import { accountService } from "@/_services/account.service";
import { uploadService } from "@/_services/upload.service";
import { Period, PeriodSummaryItem } from "@/_models/period.model";
import { Account } from "@/_models/account.model";
import { Transaction } from "@/_models/transaction.model";
import { Upload } from "@/_models/upload.model";

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
  "#18181b",
  "#52525b",
  "#a1a1aa",
  "#d4d4d8",
  "#e4e4e7",
  "#f4f4f5",
];

async function fetchAllTransactions(
  year: number,
  month: number,
): Promise<Transaction[]> {
  const all: Transaction[] = [];
  let page = 1;
  for (;;) {
    const res = await transactionService.getAll({ year, month, page });
    all.push(...res.results);
    if (!res.next) break;
    page++;
  }
  return all;
}

interface PeriodData {
  summary: PeriodSummaryItem[];
  prevSummary: PeriodSummaryItem[];
  accounts: Account[];
  transactions: Transaction[];
}

type UploadGap = { from: string; to: string; days: number };
type IdentifierGaps = { identifier: string; gaps: UploadGap[] };

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeMissingGaps(
  uploads: Upload[],
  year: number,
  periods: Period[],
): IdentifierGaps[] {
  const now = new Date();
  const byId = new Map<string, { start: Date; end: Date }[]>();
  const anonymous: { start: Date; end: Date }[] = [];

  for (const u of uploads) {
    if (!u.start_date || !u.end_date) continue;
    const start = parseLocalDate(u.start_date);
    const end = parseLocalDate(u.end_date);
    if (end.getFullYear() < year || start.getFullYear() > year) continue;
    if (u.identifier) {
      if (!byId.has(u.identifier)) byId.set(u.identifier, []);
      byId.get(u.identifier)!.push({ start, end });
    } else {
      anonymous.push({ start, end });
    }
  }

  const result: IdentifierGaps[] = [];

  for (const [id, ranges] of byId) {
    const allRanges = [...ranges, ...anonymous];
    allRanges.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Merge overlapping ranges
    const merged: { start: Date; end: Date }[] = [];
    for (const r of allRanges) {
      if (merged.length === 0 || r.start > merged.at(-1)!.end) {
        merged.push({ ...r });
      } else if (r.end > merged.at(-1)!.end) {
        merged.at(-1)!.end = r.end;
      }
    }

    const gaps: UploadGap[] = [];

    // Gaps between consecutive uploads
    for (let i = 1; i < merged.length; i++) {
      const gapStart = new Date(merged[i - 1].end);
      gapStart.setDate(gapStart.getDate() + 1);
      const days = Math.round(
        (merged[i].start.getTime() - gapStart.getTime()) / 86400000,
      );
      if (days >= 15) {
        gaps.push({
          from: formatLocalDate(gapStart),
          to: formatLocalDate(merged[i].start),
          days,
        });
      }
    }

    // Gap from last upload to today
    const lastEnd = merged.at(-1)!.end;
    const daysSinceLast = Math.round(
      (now.getTime() - lastEnd.getTime()) / 86400000,
    );
    if (daysSinceLast >= 15) {
      const gapStart = new Date(lastEnd);
      gapStart.setDate(gapStart.getDate() + 1);
      gaps.push({
        from: formatLocalDate(gapStart),
        to: formatLocalDate(now),
        days: daysSinceLast,
      });
    }

    const activePeriodGaps = gaps.filter((gap) =>
      periods.some((p) => {
        if (!p.active || p.closed) return false;
        const pStart = new Date(p.year, p.month - 1, 1);
        const pEnd = new Date(p.year, p.month, 0);
        return (
          parseLocalDate(gap.from) <= pEnd && parseLocalDate(gap.to) >= pStart
        );
      }),
    );
    if (activePeriodGaps.length > 0)
      result.push({ identifier: id, gaps: activePeriodGaps });
  }

  return result;
}

export function Dashboard() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [idx, setIdx] = useState(-1);
  const [periodData, setPeriodData] = useState<PeriodData>({
    summary: [],
    prevSummary: [],
    accounts: [],
    transactions: [],
  });
  const [loadedIdx, setLoadedIdx] = useState(-1);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [uploadsRefreshing, setUploadsRefreshing] = useState(true);

  const refreshUploads = () => {
    setUploadsRefreshing(true);
    uploadService
      .getAll()
      .then(setUploads)
      .finally(() => setUploadsRefreshing(false));
  };

  useEffect(() => {
    uploadService
      .getAll()
      .then(setUploads)
      .finally(() => setUploadsRefreshing(false));
  }, []);

  const uploadGaps = useMemo(
    () => computeMissingGaps(uploads, new Date().getFullYear(), periods),
    [uploads, periods],
  );

  useEffect(() => {
    periodService.getAll().then((all) => {
      const sorted = [...all].sort((a, b) =>
        a.year !== b.year ? b.year - a.year : b.month - a.month,
      );
      setPeriods(sorted);
      const activeIdx = sorted.findIndex((p) => p.active);
      setIdx(activeIdx >= 0 ? activeIdx : 0);
    });
  }, []);

  useEffect(() => {
    if (periods.length === 0 || idx < 0) return;
    const capturedIdx = idx;
    const current = periods[capturedIdx];
    const prev = periods[capturedIdx + 1] ?? null;

    let cancelled = false;
    Promise.all([
      periodService.getSummary(current.id),
      prev
        ? periodService.getSummary(prev.id)
        : Promise.resolve<PeriodSummaryItem[]>([]),
      accountService.getAll(),
      fetchAllTransactions(current.year, current.month),
    ]).then(([summary, prevSummary, accounts, transactions]) => {
      if (cancelled) return;
      setPeriodData({ summary, prevSummary, accounts, transactions });
      setLoadedIdx(capturedIdx);
    });

    return () => {
      cancelled = true;
    };
  }, [periods, idx]);

  const loading = periods.length === 0 || idx < 0 || loadedIdx !== idx;

  const metrics = useMemo(() => {
    const { summary, prevSummary, accounts, transactions } = periodData;
    if (summary.length === 0 && accounts.length === 0) return null;

    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    const expenseItems = summary.filter(
      (item) => (accountMap.get(item.account_id)?.sign ?? 0) < 0,
    );
    const incomeItems = summary.filter(
      (item) => (accountMap.get(item.account_id)?.sign ?? 0) > 0,
    );

    const totalExpenses = expenseItems.reduce(
      (s, i) => s + Math.abs(i.total.value),
      0,
    );
    const totalIncome = incomeItems.reduce(
      (s, i) => s + Math.abs(i.total.value),
      0,
    );
    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

    const prevExpenseTotal = prevSummary
      .filter((item) => (accountMap.get(item.account_id)?.sign ?? 0) < 0)
      .reduce((s, i) => s + Math.abs(i.total.value), 0);
    const prevIncomeTotal = prevSummary
      .filter((item) => (accountMap.get(item.account_id)?.sign ?? 0) > 0)
      .reduce((s, i) => s + Math.abs(i.total.value), 0);

    const momExpenses =
      prevExpenseTotal > 0
        ? ((totalExpenses - prevExpenseTotal) / prevExpenseTotal) * 100
        : null;
    const momIncome =
      prevIncomeTotal > 0
        ? ((totalIncome - prevIncomeTotal) / prevIncomeTotal) * 100
        : null;

    const period = periods[idx];
    const today = new Date();
    const isCurrentMonth =
      period &&
      today.getFullYear() === period.year &&
      today.getMonth() + 1 === period.month;
    const daysElapsed = isCurrentMonth
      ? today.getDate()
      : period
        ? new Date(period.year, period.month, 0).getDate()
        : 30;
    const dailyAverage = daysElapsed > 0 ? totalExpenses / daysElapsed : 0;

    const topCategories = expenseItems
      .map((item) => ({
        name: item.account_name,
        amount: Math.abs(item.total.value),
        percentage:
          totalExpenses > 0
            ? (Math.abs(item.total.value) / totalExpenses) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    const largestTx =
      transactions
        .filter((t) => t.account.sign < 0)
        .sort(
          (a, b) => Math.abs(b.amount.value) - Math.abs(a.amount.value),
        )[0] ?? null;

    let recurringTotal = 0;
    let oneOffTotal = 0;
    expenseItems.forEach((item) => {
      const acc = accountMap.get(item.account_id);
      if (acc?.account_type === "FIX")
        recurringTotal += Math.abs(item.total.value);
      else oneOffTotal += Math.abs(item.total.value);
    });

    const accountDistribution = expenseItems
      .map((item) => ({
        name: item.account_name,
        amount: Math.abs(item.total.value),
        percentage:
          totalExpenses > 0
            ? (Math.abs(item.total.value) / totalExpenses) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    const currency = summary[0]?.total.currency ?? "";

    // Daily activity: one entry per day in the month
    const daysInMonth = period
      ? new Date(period.year, period.month, 0).getDate()
      : 30;
    const dailyMap = new Map<number, { expenses: number; income: number }>();
    for (let d = 1; d <= daysInMonth; d++)
      dailyMap.set(d, { expenses: 0, income: 0 });
    transactions.forEach((t) => {
      const day = new Date(t.payment_date).getDate();
      const entry = dailyMap.get(day);
      if (!entry) return;
      if (t.account.sign < 0) entry.expenses += Math.abs(t.amount.value);
      else if (t.account.sign > 0) entry.income += Math.abs(t.amount.value);
    });
    const dailyChartData = Array.from(dailyMap.entries()).map(
      ([day, vals]) => ({
        day: String(day),
        expenses: parseFloat(vals.expenses.toFixed(2)),
        income: parseFloat(vals.income.toFixed(2)),
      }),
    );

    return {
      totalExpenses,
      totalIncome,
      netBalance,
      savingsRate,
      momExpenses,
      momIncome,
      dailyAverage,
      topCategories,
      largestTx,
      recurringTotal,
      oneOffTotal,
      accountDistribution,
      prevExpenseTotal,
      prevIncomeTotal,
      dailyChartData,
      currency,
    };
  }, [periodData, periods, idx]);

  const period = periods[idx];
  const prevPeriod = periods[idx + 1] ?? null;

  if (loading) {
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
                <button className="text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full hover:bg-amber-200 transition-colors">
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
        {period && (
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-2 py-1.5">
            <button
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
              onClick={() => setIdx((i) => Math.max(i - 1, 0))}
              disabled={idx === 0}
              className="p-1.5 rounded hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {!metrics ? (
        <p className="text-zinc-500 text-sm">
          No data available for this period.
        </p>
      ) : (
        <div className="space-y-6">
          {/* Row 1: KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total Expenses"
              displayValue={-metrics.totalExpenses}
              currency={metrics.currency}
              trend={metrics.momExpenses}
              invertTrend
            />
            <KpiCard
              label="Total Income"
              displayValue={metrics.totalIncome}
              currency={metrics.currency}
              trend={metrics.momIncome}
            />
            <KpiCard
              label="Net Balance"
              displayValue={metrics.netBalance}
              currency={metrics.currency}
            />
            <SavingsCard rate={metrics.savingsRate} />
          </div>

          {/* Row 2: Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MonthComparisonCard
              current={{
                expenses: metrics.totalExpenses,
                income: metrics.totalIncome,
              }}
              prev={{
                expenses: metrics.prevExpenseTotal,
                income: metrics.prevIncomeTotal,
              }}
              currentLabel={
                period ? MONTH_NAMES[period.month - 1].slice(0, 3) : "This"
              }
              prevLabel={
                prevPeriod
                  ? MONTH_NAMES[prevPeriod.month - 1].slice(0, 3)
                  : "Prev"
              }
              currency={metrics.currency}
            />
            <TopCategoriesCard
              categories={metrics.topCategories}
              currency={metrics.currency}
            />
          </div>

          {/* Row 3: Detail cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DailyAverageCard
              amount={metrics.dailyAverage}
              currency={metrics.currency}
            />
            <LargestExpenseCard transaction={metrics.largestTx} />
            <RecurringVsOneOffCard
              recurring={metrics.recurringTotal}
              oneOff={metrics.oneOffTotal}
            />
            <AccountDistributionCard accounts={metrics.accountDistribution} />
          </div>

          {/* Row 4: Daily activity chart */}
          <DailyActivityChart
            data={metrics.dailyChartData}
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
          <Bar dataKey={prevLabel} fill="#d4d4d8" radius={[4, 4, 0, 0]} />
          <Bar dataKey={currentLabel} fill="#18181b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-zinc-300 inline-block" />
          {prevLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-zinc-900 inline-block" />
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
          {categories.map((cat) => (
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
                  className="bg-zinc-900 h-1.5 rounded-full transition-all"
                  style={{ width: `${cat.percentage}%` }}
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
}: {
  transaction: Transaction | null;
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
              value: -Math.abs(transaction.amount.value),
              currency: transaction.amount.currency,
            }}
            className="text-2xl block mb-1"
          />
          <p className="text-sm font-medium text-zinc-700 truncate">
            {transaction.description ?? transaction.account.name}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {transaction.account.name} · {transaction.payment_date}
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
