"use client";

import { ArrowLeftRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAccountStore } from "@/_store/account.store";

const TransferFormSchema = z
  .object({
    source_account_id: z
      .number({ invalid_type_error: "Please select a source account" })
      .int()
      .positive("Please select a source account"),
    target_account_id: z
      .number({ invalid_type_error: "Please select a target account" })
      .int()
      .positive("Please select a target account"),
  })
  .refine((d) => d.source_account_id !== d.target_account_id, {
    message: "Source and target accounts must be different",
    path: ["target_account_id"],
  });

export type TransferFormValues = z.infer<typeof TransferFormSchema>;

interface TransferFormProps {
  onCancel?: () => void;
  onSubmit: (data: TransferFormValues) => void;
}

export default function TransferForm({
  onCancel,
  onSubmit,
}: TransferFormProps) {
  const accounts = useAccountStore((s) => s.accounts);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(TransferFormSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Source Account
        </label>
        <select
          {...register("source_account_id", { valueAsNumber: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
        >
          <option value="">Select source account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        {errors.source_account_id && (
          <p className="text-red-500 text-sm mt-1">
            {errors.source_account_id.message}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Target Account
        </label>
        <select
          {...register("target_account_id", { valueAsNumber: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
        >
          <option value="">Select target account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        {errors.target_account_id && (
          <p className="text-red-500 text-sm mt-1">
            {errors.target_account_id.message}
          </p>
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeftRight className="size-4" />
          Transfer
        </button>
        <button
          type="button"
          onClick={() => onCancel?.()}
          className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
