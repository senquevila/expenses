"use client";

import { Plus } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateTransactionRequestSchema,
  Transaction,
} from "@/_models/transaction.model";
import { Currency } from "@/_models/currency.model";
import { currencyService } from "@/_services/currency.service";
import { useTransactionStore } from "@/_store/transaction.store";
import { usePeriodStore } from "@/_store/period.store";
import { useAccountStore } from "@/_store/account.store";
import { parseApiError } from "@/_libs/api/error";

interface TransactionFormProps {
  onCancel?: () => void;
  transaction?: Transaction;
}

type FormValues = {
  period: number;
  account: number;
  payment_date: string;
  description: string | null;
  amount: number;
  currency: number;
};

const today = new Date().toISOString().split("T")[0];

function getDefaultValues(transaction?: Transaction): Partial<FormValues> {
  if (transaction) {
    return {
      payment_date: transaction.payment_date,
      amount: transaction.amount.value,
      currency: 0, // resolved after currencies load
      description: transaction.description ?? "",
      period: transaction.period.id,
      account: transaction.account.id,
    };
  }

  return {
    payment_date: today,
    amount: 0,
    currency: 0, // resolved after currencies load
    description: "",
  };
}

function buildTransactionPayload(data: FormValues): FormValues {
  if (typeof data.period !== "number" || Number.isNaN(data.period)) {
    throw new Error("Please select a valid period.");
  }
  if (typeof data.account !== "number" || Number.isNaN(data.account)) {
    throw new Error("Please select a valid account.");
  }

  return {
    period: data.period,
    account: data.account,
    payment_date: data.payment_date,
    description: data.description,
    amount: data.amount,
    currency: data.currency,
  };
}

export default function TransactionForm({
  onCancel,
  transaction,
}: TransactionFormProps) {
  const add = useTransactionStore((s) => s.add);
  const edit = useTransactionStore((s) => s.edit);
  const periods = usePeriodStore((s) => s.periods);
  const fetchPeriods = usePeriodStore((s) => s.fetchAll);
  const accounts = useAccountStore((s) => s.accounts);
  const fetchAccounts = useAccountStore((s) => s.fetchAll);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateTransactionRequestSchema),
    defaultValues: getDefaultValues(transaction),
  });

  useEffect(() => {
    reset(getDefaultValues(transaction));
  }, [transaction, reset]);

  useEffect(() => {
    fetchPeriods();
    fetchAccounts();
  }, [fetchPeriods, fetchAccounts]);

  useEffect(() => {
    if (transaction) return;
    if (periods.length === 0) return;
    const lastPeriod = periods.reduce((a, b) =>
      a.year * 12 + a.month >= b.year * 12 + b.month ? a : b,
    );
    if (!getValues("period")) {
      setValue("period", lastPeriod.id);
    }
  }, [transaction, periods, getValues, setValue]);

  useEffect(() => {
    let isMounted = true;

    const loadCurrencies = async () => {
      setLoadingCurrencies(true);
      try {
        const data = await currencyService.getAll();
        if (!isMounted) return;
        setCurrencies(data);
      } catch (error) {
        console.error("Failed to fetch currencies:", error);
      } finally {
        if (isMounted) setLoadingCurrencies(false);
      }
    };

    loadCurrencies();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (currencies.length === 0) return;
    if (getValues("currency")) return;
    const match = transaction
      ? currencies.find((c) => c.alpha3 === transaction.amount.currency)
      : null;
    setValue("currency", match?.id ?? currencies[0].id);
  }, [currencies, transaction, getValues, setValue]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = buildTransactionPayload(data);
      if (transaction) {
        await edit(transaction.id, payload);
      } else {
        await add(payload);
      }
      onCancel?.();
    } catch (error: unknown) {
      console.error("Failed to save transaction:", error);
      const details = parseApiError(error);
      const prefix = transaction
        ? "Failed to update transaction."
        : "Failed to create transaction.";
      setSubmitError(
        `${prefix}${details ? ` ${details}` : " Please try again."}`,
      );
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Period
          </label>
          <select
            {...register("period", { valueAsNumber: true })}
            value={watch("period") || ""}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
            disabled={periods.length === 0 || !!transaction}
          >
            <option value="">Select period</option>
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.year}-{String(period.month).padStart(2, "0")}
              </option>
            ))}
          </select>
          {errors.period && (
            <p className="text-red-500 text-sm mt-1">{errors.period.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Account
          </label>
          <select
            {...register("account", { valueAsNumber: true })}
            value={watch("account") || ""}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
            disabled={accounts.length === 0}
          >
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          {errors.account && (
            <p className="text-red-500 text-sm mt-1">
              {errors.account.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            {...register("payment_date")}
            disabled={!!transaction}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {errors.payment_date && (
            <p className="text-red-500 text-sm mt-1">
              {errors.payment_date.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            type="text"
            {...register("description")}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">
              {errors.description.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              {...register("amount", { valueAsNumber: true })}
              placeholder="Value"
              disabled={!!transaction}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <select
              {...register("currency", { valueAsNumber: true })}
              value={watch("currency") ?? ""}
              className="mt-1 block w-48 border border-gray-300 rounded-md shadow-sm p-2 bg-white"
              disabled={
                loadingCurrencies || currencies.length === 0 || !!transaction
              }
            >
              <option value="">Currency</option>
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.alpha3}
                </option>
              ))}
            </select>
          </div>
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
          )}
          {errors.currency && (
            <p className="text-red-500 text-sm mt-1">
              {errors.currency.message}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="size-5 inline-block mr-2" />
            {transaction ? "Save Changes" : "Add Transaction"}
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

      <AlertDialog.Root
        open={!!submitError}
        onOpenChange={(open) => {
          if (!open) setSubmitError(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[70] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <AlertDialog.Title className="text-lg font-semibold mb-2 text-red-700">
              {transaction
                ? "Could not save changes"
                : "Could not create transaction"}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-zinc-700 whitespace-pre-wrap">
              {submitError}
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end">
              <AlertDialog.Action asChild>
                <button className="px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors">
                  Close
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
