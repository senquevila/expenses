"use client";

import { Pencil, Plus } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { useLoanStore } from "@/_store/loan.store";
import { Loan } from "@/_models/loan.model";
import LoanForm from "@/_shared/components/LoanForm";
import Money from "@/_shared/components/Money";

function loanProgress(startDate: string, months: number): number {
  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    return 0;
  }

  const now = new Date();
  const end = new Date(start.getTime());
  end.setMonth(end.getMonth() + months);

  const totalDurationMs = end.getTime() - start.getTime();
  if (totalDurationMs <= 0) {
    return 0;
  }

  const elapsedMs = now.getTime() - start.getTime();
  const clampedElapsedMs = Math.min(Math.max(elapsedMs, 0), totalDurationMs);
  const progressFraction = clampedElapsedMs / totalDurationMs;

  return Math.min(100, Math.max(0, Math.round(progressFraction * 100)));
}

export function Loans() {
  const [filter, setFilter] = useState<"all" | "active">("active");
  const [open, setOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const {
    items: loans,
    summary,
    summaryLoading,
    loading,
    fetchAll,
    fetchSummary,
    toggle,
  } = useLoanStore();

  useEffect(() => {
    fetchAll(true);
    fetchSummary();
  }, [fetchAll, fetchSummary]);

  const filteredLoans =
    filter === "active" ? loans.filter((loan) => loan.is_active) : loans;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Loans</h1>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
              <Plus className="size-5" />
              Add Loan
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
              <Dialog.Title className="text-xl font-semibold mb-4">
                New Loan
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Fill in the details to add a new loan.
              </Dialog.Description>
              <LoanForm onCancel={() => setOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="flex gap-8 mb-6 p-4 bg-white rounded-lg shadow-sm">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">
            Remaining Debt
          </p>
          {summaryLoading || !summary ? (
            <div className="h-7 w-24 bg-zinc-100 rounded animate-pulse mt-1" />
          ) : (
            <Money
              value={summary.remaining}
              className="text-xl font-bold text-zinc-900"
            />
          )}
        </div>
        <div className="w-px bg-zinc-100" />
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">
            Monthly Payment
          </p>
          {summaryLoading || !summary ? (
            <div className="h-7 w-24 bg-zinc-100 rounded animate-pulse mt-1" />
          ) : (
            <Money
              value={summary.monthly}
              className="text-xl font-bold text-zinc-900"
            />
          )}
        </div>
      </div>

      <Dialog.Root
        open={!!editingLoan}
        onOpenChange={(o) => !o && setEditingLoan(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Edit Loan
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Update the details of this loan.
            </Dialog.Description>
            {editingLoan && (
              <LoanForm
                loan={editingLoan}
                onCancel={() => setEditingLoan(null)}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => {
            setFilter("all");
            fetchAll();
          }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === "all"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }`}
        >
          All Loans
        </button>
        <button
          onClick={() => {
            setFilter("active");
            fetchAll(true);
          }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === "active"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }`}
        >
          Active Only
        </button>
      </div>

      {loading && <p className="text-zinc-500 text-sm">Loading loans...</p>}

      {!loading && filteredLoans.length === 0 && (
        <p className="text-zinc-500 text-sm">No loans found.</p>
      )}

      <div className="grid gap-4">
        {filteredLoans.map((loan) => (
          <div
            key={loan.id}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-semibold">{loan.description}</h2>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs ${
                      loan.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {loan.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-zinc-500 text-sm">{loan.bank}</p>
              </div>
              <div className="flex items-center gap-3">
                <Money
                  value={{
                    ...loan.amount,
                    value: -Math.abs(loan.amount.value),
                  }}
                  className="text-2xl"
                />
                <button
                  onClick={() => setEditingLoan(loan)}
                  className="p-1.5 rounded hover:bg-zinc-100 transition-colors"
                  aria-label="Edit loan"
                >
                  <Pencil className="size-4 text-zinc-500" />
                </button>
              </div>
            </div>
            <div className="flex gap-6 text-sm mb-4">
              <div>
                <p className="text-zinc-500">Start Date</p>
                <p className="font-semibold">{loan.start_date}</p>
              </div>
              <div>
                <p className="text-zinc-500">End Date</p>
                <p className="font-semibold">{loan.end_date}</p>
              </div>
              <div>
                <p className="text-zinc-500">Term</p>
                <p className="font-semibold">{loan.months} months</p>
              </div>
              <div>
                <p className="text-zinc-500">Monthly Payment</p>
                <Money value={loan.monthly_payment} />
              </div>
              <div>
                <p className="text-zinc-500">Progress</p>
                <p className="font-semibold">
                  {loanProgress(loan.start_date, loan.months)}%
                </p>
              </div>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2 mb-4">
              <div
                className="bg-zinc-900 h-2 rounded-full transition-all"
                style={{
                  width: `${loanProgress(loan.start_date, loan.months)}%`,
                }}
              />
            </div>
            <div className="pt-4 border-t border-zinc-100">
              {loan.is_active ? (
                <button
                  onClick={() => toggle(loan.id)}
                  className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-300 transition-colors text-sm"
                >
                  Mark as Inactive
                </button>
              ) : (
                <button
                  onClick={() => toggle(loan.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Mark as Active
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
