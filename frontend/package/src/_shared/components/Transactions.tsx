"use client";

import { Pencil, Plus, Search } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { useTransactionStore } from "@/_store/transaction.store";
import { Transaction } from "@/_models/transaction.model";
import TransactionForm from "@/_shared/components/TransactionForm";
import Money from "@/_shared/components/Money";
import Pagination from "@/_shared/components/Pagination";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const CURRENT_YEAR = new Date().getFullYear();
const _parsedStartYear = Number(process.env.NEXT_PUBLIC_START_YEAR);
const START_YEAR =
  Number.isInteger(_parsedStartYear) &&
  _parsedStartYear >= 1900 &&
  _parsedStartYear <= CURRENT_YEAR
    ? _parsedStartYear
    : CURRENT_YEAR;
const ALL_YEARS = Array.from(
  { length: CURRENT_YEAR - START_YEAR + 1 },
  (_, i) => CURRENT_YEAR - i,
);
const DEBOUNCE_DELAY_MS = 400;

interface TransactionsProps {
  initialYear?: number;
  initialMonth?: number;
  initialPeriod?: number;
  initialAccount?: number;
}

export default function Transactions({
  initialYear,
  initialMonth,
  initialPeriod,
  initialAccount,
}: TransactionsProps) {
  const transactions = useTransactionStore((s) => s.transactions);
  const loading = useTransactionStore((s) => s.loading);
  const fetchAll = useTransactionStore((s) => s.fetchAll);
  const page = useTransactionStore((s) => s.page);
  const totalCount = useTransactionStore((s) => s.totalCount);
  const totalPages = useTransactionStore((s) => s.totalPages);
  const [open, setOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [activePeriod, setActivePeriod] = useState<number | undefined>(
    initialPeriod,
  );
  const [selectedYear, setSelectedYear] = useState<number | "">(
    initialYear ?? "",
  );
  const [selectedMonth, setSelectedMonth] = useState<number | "">(
    initialMonth ?? "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchQuery),
      DEBOUNCE_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function handleYearChange(value: number | "") {
    setActivePeriod(undefined);
    setSelectedYear(value);
  }

  function handleMonthChange(value: number | "") {
    setActivePeriod(undefined);
    setSelectedMonth(value);
  }

  const filterParams = {
    period: activePeriod,
    account: initialAccount,
    year: activePeriod ? undefined : selectedYear || undefined,
    month: activePeriod ? undefined : selectedMonth || undefined,
    description: debouncedSearch || undefined,
  };

  useEffect(() => {
    fetchAll(filterParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fetchAll,
    activePeriod,
    initialAccount,
    selectedYear,
    selectedMonth,
    debouncedSearch,
  ]);

  function goToPage(p: number) {
    fetchAll({ ...filterParams, page: p });
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm w-52"
            />
          </div>
          {!activePeriod && (
            <>
              <select
                value={selectedYear}
                onChange={(e) =>
                  handleYearChange(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="border border-gray-300 rounded-md shadow-sm px-3 py-2 bg-white text-sm"
              >
                <option value="">All years</option>
                {ALL_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) =>
                  handleMonthChange(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="border border-gray-300 rounded-md shadow-sm px-3 py-2 bg-white text-sm"
              >
                <option value="">All months</option>
                {ALL_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {MONTH_NAMES[m - 1]}
                  </option>
                ))}
              </select>
            </>
          )}
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
                <Plus className="size-5" />
                Add Transaction
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
                <Dialog.Title className="text-xl font-semibold mb-4">
                  New Transaction
                </Dialog.Title>
                <TransactionForm onCancel={() => setOpen(false)} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      <Dialog.Root
        open={!!editingTransaction}
        onOpenChange={(o) => !o && setEditingTransaction(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Edit Transaction
            </Dialog.Title>
            {editingTransaction && (
              <TransactionForm
                transaction={editingTransaction}
                onCancel={() => setEditingTransaction(null)}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-100 border-b">
            <tr>
              <th className="text-left px-6 py-3 font-semibold">Date</th>
              <th className="text-left px-6 py-3 font-semibold">Description</th>
              <th className="text-left px-6 py-3 font-semibold">Account</th>
              <th className="text-right px-6 py-3 font-semibold">Amount</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-b hover:bg-zinc-50">
                <td className="px-6 py-4">{transaction.payment_date}</td>
                <td className="px-6 py-4">{transaction.description}</td>
                <td className="px-6 py-4">{transaction.account.name}</td>
                <td className="px-6 py-4 text-right">
                  <Money value={transaction.amount} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setEditingTransaction(transaction)}
                    className="p-1.5 rounded hover:bg-zinc-100 transition-colors"
                    aria-label="Edit transaction"
                  >
                    <Pencil className="size-4 text-zinc-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        loading={loading}
        onPageChange={goToPage}
        count={totalCount}
        itemLabel="transaction"
      />
    </div>
  );
}
