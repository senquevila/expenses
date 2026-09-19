"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateLoanRequestSchema, Loan } from "@/_models/loan.model";
import { Currency } from "@/_models/currency.model";
import { currencyService } from "@/_services/currency.service";
import { useLoanStore } from "@/_store/loan.store";

interface LoanFormProps {
  onCancel?: () => void;
  loan?: Loan;
}

type FormValues = import("@/_models/loan.model").CreateLoanRequest;

const today = new Date().toISOString().split("T")[0];

export default function LoanForm({ onCancel, loan }: LoanFormProps) {
  const add = useLoanStore((s) => s.add);
  const edit = useLoanStore((s) => s.edit);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(CreateLoanRequestSchema),
    defaultValues: loan
      ? {
          description: loan.description,
          bank: loan.bank,
          amount: loan.amount.value,
          monthly_payment: loan.monthly_payment.value,
          start_date: loan.start_date,
          months: loan.months,
          is_active: loan.is_active,
          currency: loan.currency,
        }
      : {
          description: "",
          bank: "",
          amount: 0,
          monthly_payment: 0,
          start_date: today,
          months: 12,
          is_active: true,
          currency: undefined,
        },
  });

  useEffect(() => {
    let isMounted = true;

    const loadCurrencies = async () => {
      setLoadingCurrencies(true);
      try {
        const data = await currencyService.getAll();
        if (!isMounted) return;
        setCurrencies(data);
        if (!loan && data[0]) {
          setValue("currency", data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch currencies:", error);
      } finally {
        if (isMounted) setLoadingCurrencies(false);
      }
    };

    loadCurrencies();
    return () => { isMounted = false; };
  }, [setValue, loan]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (loan) {
        await edit(loan.id, data);
      } else {
        await add(data);
      }
      onCancel?.();
    } catch (error) {
      console.error("Failed to save loan:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <input type="text" {...register("description")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Bank</label>
        <input type="text" {...register("bank")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        {errors.bank && <p className="text-red-500 text-sm mt-1">{errors.bank.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Currency</label>
        <select
          {...register("currency", { valueAsNumber: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
          disabled={loadingCurrencies}
        >
          <option value="">Select currency</option>
          {currencies.map((c) => (
            <option key={c.id} value={c.id}>{c.alpha3} — {c.name}</option>
          ))}
        </select>
        {errors.currency && <p className="text-red-500 text-sm mt-1">{errors.currency.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Amount</label>
        <input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} placeholder="0.00" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Monthly Payment</label>
        <input type="number" step="0.01" {...register("monthly_payment", { valueAsNumber: true })} placeholder="0.00" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        {errors.monthly_payment && <p className="text-red-500 text-sm mt-1">{errors.monthly_payment.message}</p>}
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input type="date" {...register("start_date")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date.message}</p>}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Term (months)</label>
          <input type="number" {...register("months", { valueAsNumber: true })} min={1} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          {errors.months && <p className="text-red-500 text-sm mt-1">{errors.months.message}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_active" {...register("is_active")} className="rounded" />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="size-4" />
          {loan ? "Save Changes" : "Add Loan"}
        </button>
        <button type="button" onClick={() => onCancel?.()} className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-300 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
