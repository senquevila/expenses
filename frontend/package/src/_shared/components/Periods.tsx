"use client";

import { Plus, List, ArrowRight } from "lucide-react";
import * as Switch from "@radix-ui/react-switch";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePeriodStore } from "@/_store/period.store";
import { periodService } from "@/_services/period.service";
import { Period, PeriodSummaryItem } from "@/_models/period.model";
import PeriodForm from "@/_shared/components/PeriodForm";
import Money from "@/_shared/components/Money";

export default function Periods() {
  const { periods, fetchAll, loading, toggle } = usePeriodStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [summaryPeriod, setSummaryPeriod] = useState<Period | null>(null);
  const [summary, setSummary] = useState<PeriodSummaryItem[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  function openSummary(period: Period) {
    setSummaryPeriod(period);
    setSummary([]);
    setSummaryLoading(true);
    periodService
      .getSummary(period.id)
      .then(setSummary)
      .finally(() => setSummaryLoading(false));
  }

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Periods</h1>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
              <Plus className="size-5" />
              Create Period
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
              <Dialog.Title className="text-xl font-semibold mb-4">
                New Period
              </Dialog.Title>
              <PeriodForm onCancel={() => setOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-100 border-b">
            <tr>
              <th className="text-left px-6 py-3 font-semibold">Period</th>
              <th className="text-right px-6 py-3 font-semibold">Total</th>
              <th className="px-6 py-3" />
              <th className="text-center px-6 py-3 font-semibold">Closed</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period.id} className="border-b hover:bg-zinc-50">
                <td className="px-6 py-4">
                  {period.year}-{String(period.month).padStart(2, "0")}
                </td>
                <td className="px-6 py-4 text-right">
                  <Money value={period.total} />
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => openSummary(period)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
                    title="View transactions summary"
                  >
                    <List className="size-4" />
                    Transactions
                  </button>
                </td>
                <td className="px-6 py-4 text-center">
                  <Switch.Root
                    className="w-11 h-6 bg-zinc-300 rounded-full relative data-[state=checked]:bg-green-600 outline-none cursor-pointer transition-colors"
                    checked={period.closed}
                    onCheckedChange={() => toggle(period.id)}
                  >
                    <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
                  </Switch.Root>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog.Root
        open={summaryPeriod !== null}
        onOpenChange={(o) => !o && setSummaryPeriod(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <Dialog.Title className="text-xl font-semibold mb-4">
              {summaryPeriod
                ? `${summaryPeriod.year}-${String(summaryPeriod.month).padStart(2, "0")} Summary`
                : "Summary"}
            </Dialog.Title>
            {summaryLoading ? (
              <div className="py-6 text-center text-zinc-500">Loading...</div>
            ) : (
              <div className="overflow-y-auto max-h-80">
                <table className="w-full">
                  <thead className="bg-zinc-100 border-b sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold">
                        Account
                      </th>
                      <th className="text-right px-4 py-2 font-semibold">
                        Total
                      </th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((item) => (
                      <tr key={item.account_id} className="border-b">
                        <td className="px-4 py-3">{item.account_name}</td>
                        <td className="px-4 py-3 text-right">
                          <Money value={item.total} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              router.push(
                                `/transactions?period=${summaryPeriod?.id}&account=${item.account_id}`,
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-zinc-600 border border-zinc-200 rounded hover:bg-zinc-50 transition-colors"
                            title="Go to transactions"
                          >
                            <ArrowRight className="size-3" />
                            Go
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
