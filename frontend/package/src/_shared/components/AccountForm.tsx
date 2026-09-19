"use client";

import { Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Account, ACCOUNT_TYPES, CreateAccountRequest, CreateAccountRequestSchema } from "@/_models/account.model";
import { useAccountStore } from "@/_store/account.store";

interface AccountFormProps {
  onCancel?: () => void;
  account?: Account;
}

export default function AccountForm({ onCancel, account }: AccountFormProps) {
  const { accounts, add, edit, remove } = useAccountStore();
  const parentOptions = accounts.filter((a) => a.id !== account?.id);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateAccountRequest>({
    resolver: zodResolver(CreateAccountRequestSchema),
    defaultValues: account
      ? {
          name: account.name,
          sign: account.sign,
          account_type: account.account_type as typeof ACCOUNT_TYPES[number],
          parent: account.parent?.id ?? null,
        }
      : {
          name: "",
          sign: 1,
          account_type: "FIX",
          parent: null,
        },
  });

  const onSubmit = (data: CreateAccountRequest) => {
    if (account) {
      edit(account.id, data).then(() => onCancel?.());
    } else {
      add(data).then(() => onCancel?.());
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          {...register("name")}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Account Type</label>
        <select
          {...register("account_type")}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
        >
          {ACCOUNT_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        {errors.account_type && <p className="text-red-500 text-sm mt-1">{errors.account_type.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Sign</label>
        <select
          {...register("sign", { valueAsNumber: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
        >
          <option value={1}>Positive (+)</option>
          <option value={-1}>Negative (−)</option>
        </select>
        {errors.sign && <p className="text-red-500 text-sm mt-1">{errors.sign.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Parent Account</label>
        <select
          {...register("parent", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
        >
          <option value="">None</option>
          {parentOptions.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          <Plus className="size-4" />
          {account ? "Save Changes" : "Create Account"}
        </button>
        <button
          type="button"
          onClick={() => onCancel?.()}
          className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-300 transition-colors"
        >
          Cancel
        </button>
        {account && (
          <button
            type="button"
            onClick={() => remove(account.id).then(() => onCancel?.())}
            className="ml-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
