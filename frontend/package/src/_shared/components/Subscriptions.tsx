"use client";

import { Pencil, Plus } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { useSubscriptionStore } from "@/_store/subscription.store";
import { Subscription } from "@/_models/subscription.model";
import SubscriptionForm from "@/_shared/components/SubscriptionForm";
import Money from "@/_shared/components/Money";

export function Subscriptions() {
  const [filter, setFilter] = useState<"all" | "active">("active");
  const [open, setOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<Subscription | null>(null);
  const {
    items: subscriptions,
    summary,
    summaryLoading,
    loading,
    fetchAll,
    fetchSummary,
    toggle,
  } = useSubscriptionStore();

  useEffect(() => {
    fetchAll(true);
    fetchSummary();
  }, [fetchAll, fetchSummary]);

  const filtered =
    filter === "active"
      ? subscriptions.filter((s) => s.is_active)
      : subscriptions;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
              <Plus className="size-5" />
              Add Subscription
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
              <Dialog.Title className="text-xl font-semibold mb-4">
                New Subscription
              </Dialog.Title>
              <SubscriptionForm onCancel={() => setOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="flex gap-8 mb-6 p-4 bg-white rounded-lg shadow-sm">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">
            Monthly Total
          </p>
          {summaryLoading || !summary ? (
            <div className="h-7 w-24 bg-zinc-100 rounded animate-pulse mt-1" />
          ) : (
            <Money
              value={summary.total}
              className="text-xl font-bold text-zinc-900"
            />
          )}
        </div>
      </div>

      <Dialog.Root
        open={!!editingSubscription}
        onOpenChange={(o) => !o && setEditingSubscription(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Edit Subscription
            </Dialog.Title>
            {editingSubscription && (
              <SubscriptionForm
                subscription={editingSubscription}
                onCancel={() => setEditingSubscription(null)}
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
          All Subscriptions
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

      {loading && (
        <p className="text-zinc-500 text-sm">Loading subscriptions...</p>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-zinc-500 text-sm">No subscriptions found.</p>
      )}

      <div className="grid gap-4">
        {filtered.map((subscription) => (
          <div
            key={subscription.id}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-semibold">{subscription.name}</h2>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs ${
                      subscription.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {subscription.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-zinc-500 text-sm">
                  {subscription.subscription_type.charAt(0) +
                    subscription.subscription_type.slice(1).toLowerCase()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <Money
                    value={subscription.monthly_payment}
                    className="text-2xl"
                  />
                  <p className="text-sm text-zinc-500">/ month</p>
                </div>
                <button
                  onClick={() => setEditingSubscription(subscription)}
                  className="p-1.5 rounded hover:bg-zinc-100 transition-colors"
                  aria-label="Edit subscription"
                >
                  <Pencil className="size-4 text-zinc-500" />
                </button>
              </div>
            </div>
            <div className="pt-3 border-t border-zinc-100">
              {subscription.is_active ? (
                <button
                  onClick={() => toggle(subscription.id)}
                  className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-300 transition-colors text-sm"
                >
                  Mark as Inactive
                </button>
              ) : (
                <button
                  onClick={() => toggle(subscription.id)}
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
