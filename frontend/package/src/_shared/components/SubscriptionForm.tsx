"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateSubscriptionRequestSchema, Subscription, SUBSCRIPTION_TYPES } from "@/_models/subscription.model";
import { Currency } from "@/_models/currency.model";
import { currencyService } from "@/_services/currency.service";
import { useSubscriptionStore } from "@/_store/subscription.store";

interface SubscriptionFormProps {
  onCancel?: () => void;
  subscription?: Subscription;
}

type FormValues = import("@/_models/subscription.model").CreateSubscriptionRequest;

export default function SubscriptionForm({ onCancel, subscription }: SubscriptionFormProps) {
  const add = useSubscriptionStore((s) => s.add);
  const edit = useSubscriptionStore((s) => s.edit);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(CreateSubscriptionRequestSchema),
    defaultValues: subscription
      ? {
          name: subscription.name,
          monthly_payment: subscription.monthly_payment.value,
          subscription_type: subscription.subscription_type,
          is_active: subscription.is_active,
          currency: subscription.currency,
        }
      : {
          name: "",
          monthly_payment: 0,
          subscription_type: "OTHER",
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
        if (!subscription && data[0]) {
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
  }, [setValue, subscription]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (subscription) {
        await edit(subscription.id, data);
      } else {
        await add(data);
      }
      onCancel?.();
    } catch (error) {
      console.error("Failed to save subscription:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input type="text" {...register("name")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <select
          {...register("subscription_type")}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
        >
          {SUBSCRIPTION_TYPES.map((type) => (
            <option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</option>
          ))}
        </select>
        {errors.subscription_type && <p className="text-red-500 text-sm mt-1">{errors.subscription_type.message}</p>}
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
        <label htmlFor="monthly_payment" className="block text-sm font-medium text-gray-700">Monthly Payment</label>
        <input id="monthly_payment" type="number" step="0.01" {...register("monthly_payment", { valueAsNumber: true })} placeholder="0.00" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        {errors.monthly_payment && <p className="text-red-500 text-sm mt-1">{errors.monthly_payment.message}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_active" {...register("is_active")} className="rounded" />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="size-4" />
          {subscription ? "Save Changes" : "Add Subscription"}
        </button>
        <button type="button" onClick={() => onCancel?.()} className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-300 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
