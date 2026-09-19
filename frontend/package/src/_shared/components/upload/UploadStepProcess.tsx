"use client";

import { useEffect, useState } from "react";
import { useAccountStore } from "@/_store/account.store";
import { transactionService } from "@/_services/transaction.service";
import { Transaction } from "@/_models/transaction.model";

interface UploadStepProcessProps {
  uploadId: number;
}

export default function UploadStepProcess({
  uploadId,
}: UploadStepProcessProps) {
  const { accounts, fetchAll } = useAccountStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  useEffect(() => {
    fetchAll();
    transactionService
      .getByUpload(uploadId)
      .then((r) => setTransactions(r.results))
      .catch((e) => console.error("Failed to load transactions:", e))
      .finally(() => setLoading(false));
  }, [uploadId, fetchAll]);

  const handleAccountChange = async (txId: number, accountId: number) => {
    const current = transactions.find((t) => t.id === txId);
    if (!current || current.account?.id === accountId) return;

    const newAccount = accounts.find((a) => a.id === accountId);
    if (!newAccount) return;

    setSaving(txId);
    try {
      await transactionService.patch(txId, { account: accountId });
      setTransactions((prev) =>
        prev.map((t) => (t.id === txId ? { ...t, account: newAccount } : t)),
      );
      setSaved(txId);
      setTimeout(() => setSaved((s) => (s === txId ? null : s)), 1500);
    } catch (e) {
      console.error("Failed to update account:", e);
    } finally {
      setSaving(null);
    }
  };

  if (loading)
    return (
      <div className="py-12 text-center text-zinc-400 text-sm">
        Loading transactions…
      </div>
    );

  if (transactions.length === 0)
    return (
      <div className="py-12 text-center text-zinc-400 text-sm">
        No transactions found for this upload.
      </div>
    );

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500">
        {transactions.length} transactions — assign an account to each one.
      </p>

      <div className="overflow-x-auto overflow-y-auto max-h-[460px] border border-zinc-200 rounded">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-zinc-100">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-zinc-600 border-b border-zinc-200">
                Date
              </th>
              <th className="px-3 py-2 text-left font-semibold text-zinc-600 border-b border-zinc-200">
                Description
              </th>
              <th className="px-3 py-2 text-right font-semibold text-zinc-600 border-b border-zinc-200">
                Amount
              </th>
              <th className="px-3 py-2 text-right font-semibold text-zinc-600 border-b border-zinc-200">
                Local
              </th>
              <th className="px-3 py-2 text-left font-semibold text-zinc-600 border-b border-zinc-200 w-56">
                Account
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className={`border-b border-zinc-100 transition-colors duration-500 ${saved === tx.id ? "bg-green-50" : "hover:bg-zinc-50"}`}
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  {tx.payment_date}
                </td>
                <td
                  className="px-3 py-2 max-w-xs truncate"
                  title={tx.description ?? ""}
                >
                  {tx.description ?? "—"}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap font-mono">
                  {tx.amount.value}{" "}
                  <span className="text-zinc-400">{tx.amount.currency}</span>
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap font-mono">
                  {tx.local_amount.value}{" "}
                  <span className="text-zinc-400">
                    {tx.local_amount.currency}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={tx.account?.id ?? ""}
                      onChange={(e) =>
                        handleAccountChange(tx.id, Number(e.target.value))
                      }
                      disabled={saving === tx.id}
                      className="w-full border border-zinc-300 rounded px-2 py-1 text-xs bg-white disabled:opacity-50"
                    >
                      <option value="">— select —</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    {saving === tx.id && (
                      <span className="text-zinc-400 shrink-0">…</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
