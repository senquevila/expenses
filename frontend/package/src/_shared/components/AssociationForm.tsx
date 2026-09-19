"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Association,
  CreateAssociationRequest,
  CreateAssociationRequestSchema,
} from "@/_models/association.model";
import { useAssociationStore } from "@/_store/association.store";
import { useAccountStore } from "@/_store/account.store";

interface AssociationFormProps {
  onCancel?: () => void;
  association?: Association;
}

export default function AssociationForm({
  onCancel,
  association,
}: AssociationFormProps) {
  const { add, edit, remove } = useAssociationStore();
  const accounts = useAccountStore((s) => s.accounts);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAssociationRequest>({
    resolver: zodResolver(CreateAssociationRequestSchema),
    defaultValues: association
      ? { account: association.account.id, token: association.token }
      : { token: "" },
  });

  const onSubmit = async (data: CreateAssociationRequest) => {
    if (association) {
      await edit(association.id, data);
    } else {
      await add(data);
    }
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Account
        </label>
        <select
          {...register("account", { valueAsNumber: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
          disabled={accounts.length === 0}
        >
          <option value="">Select account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {errors.account && (
          <p className="text-red-500 text-sm mt-1">{errors.account.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Token</label>
        <input
          type="text"
          {...register("token")}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
        {errors.token && (
          <p className="text-red-500 text-sm mt-1">{errors.token.message}</p>
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          {association ? (
            <Check className="size-4" />
          ) : (
            <Plus className="size-4" />
          )}
          {association ? "Save Changes" : "Create Association"}
        </button>
        <button
          type="button"
          onClick={() => onCancel?.()}
          className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-300 transition-colors"
        >
          Cancel
        </button>
        {association && (
          <button
            type="button"
            onClick={() => remove(association.id).then(() => onCancel?.())}
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
