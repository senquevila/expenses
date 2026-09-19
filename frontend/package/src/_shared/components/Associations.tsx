"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Search } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAssociationStore } from "@/_store/association.store";
import { useAccountStore } from "@/_store/account.store";
import { Association } from "@/_models/association.model";
import AssociationForm from "@/_shared/components/AssociationForm";

const DEBOUNCE_DELAY_MS = 400;

export default function Associations() {
  const { associations, loading, fetchAll } = useAssociationStore();
  const { accounts, fetchAll: fetchAccounts } = useAccountStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAssociation, setEditingAssociation] =
    useState<Association | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<number | "">("");
  const [tokenSearch, setTokenSearch] = useState("");
  const [debouncedToken, setDebouncedToken] = useState("");
  const [showDuplicates, setShowDuplicates] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedToken(tokenSearch),
      DEBOUNCE_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [tokenSearch]);

  useEffect(() => {
    fetchAll({
      account: selectedAccount || undefined,
      token: debouncedToken || undefined,
    });
  }, [fetchAll, selectedAccount, debouncedToken]);

  const norm = (s: string) => s.toLowerCase().trim();
  const tokens = associations.map((a) => a.token);
  const duplicateTokens = new Set(
    tokens.filter((t, i) =>
      tokens.some(
        (other, j) =>
          i !== j &&
          (norm(t).startsWith(norm(other)) || norm(other).startsWith(norm(t))),
      ),
    ),
  );
  const displayed = showDuplicates
    ? associations.filter((a) => duplicateTokens.has(a.token))
    : associations;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Associations</h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedAccount}
            onChange={(e) =>
              setSelectedAccount(
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            className="border border-gray-300 rounded-md shadow-sm px-3 py-2 bg-white text-sm"
          >
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search token..."
              value={tokenSearch}
              onChange={(e) => setTokenSearch(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm w-44"
            />
          </div>
          <button
            onClick={() => setShowDuplicates((v) => !v)}
            className={`px-3 py-2 rounded-md text-sm border transition-colors ${showDuplicates ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-700 border-gray-300 hover:bg-zinc-50"}`}
          >
            Duplicates
          </button>
          <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
            <Dialog.Trigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
                <Plus className="size-5" />
                New Association
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
                <Dialog.Title className="text-xl font-semibold mb-4">
                  New Association
                </Dialog.Title>
                <AssociationForm onCancel={() => setCreateOpen(false)} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      <Dialog.Root
        open={!!editingAssociation}
        onOpenChange={(o) => !o && setEditingAssociation(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Edit Association
            </Dialog.Title>
            {editingAssociation && (
              <AssociationForm
                association={editingAssociation}
                onCancel={() => setEditingAssociation(null)}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {loading ? (
        <p className="text-zinc-500">Loading associations...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-100 border-b">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Account</th>
                <th className="text-left px-6 py-3 font-semibold">Token</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-zinc-400"
                  >
                    No associations yet.
                  </td>
                </tr>
              ) : (
                displayed.map((association) => (
                  <tr
                    key={association.id}
                    className="border-b hover:bg-zinc-50"
                  >
                    <td className="px-6 py-4">{association.account.name}</td>
                    <td className="px-6 py-4 font-mono text-sm text-zinc-600">
                      {association.token}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingAssociation(association)}
                        className="p-1.5 rounded hover:bg-zinc-100 transition-colors"
                        aria-label="Edit association"
                      >
                        <Pencil className="size-4 text-zinc-500" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
