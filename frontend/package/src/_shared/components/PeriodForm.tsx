"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreatePeriodRequestSchema, CreatePeriodRequest } from "@/_models/period.model";
import { Currency } from "@/_models/currency.model";
import { currencyService } from "@/_services/currency.service";
import { usePeriodStore } from "@/_store/period.store";

interface PeriodFormProps {
    onCancel?: () => void;
}

const now = new Date();

export default function PeriodForm({ onCancel }: PeriodFormProps) {
  const { add } = usePeriodStore();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);

    const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<CreatePeriodRequest>({
        resolver: zodResolver(CreatePeriodRequestSchema),
        defaultValues: {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            total: { value: 0, currency: "" },
            closed: false,
            active: true,
        },
    });

    useEffect(() => {
        let isMounted = true;

        const loadCurrencies = async () => {
            setLoadingCurrencies(true);
            try {
                const data = await currencyService.getAll();
                if (!isMounted) {
                    return;
                }

                setCurrencies(data);
                const fallbackCurrencyAlpha3 = data[0]?.alpha3;
                if (fallbackCurrencyAlpha3 && !getValues("total.currency")) {
                    setValue("total.currency", fallbackCurrencyAlpha3);
                }
            } catch (error) {
                console.error("Failed to fetch currencies:", error);
            } finally {
                if (isMounted) {
                    setLoadingCurrencies(false);
                }
            }
        };

        loadCurrencies();

        return () => {
            isMounted = false;
        };
    }, [getValues, setValue]);

    const onSubmit = async (data: CreatePeriodRequest) => {
        try {
            await add(data);
            onCancel?.();
        } catch (error) {
            console.error("Failed to create period:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input type="number" {...register("year", { valueAsNumber: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Month</label>
                <input type="number" {...register("month", { valueAsNumber: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                {errors.month && <p className="text-red-500 text-sm mt-1">{errors.month.message}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Total</label>
                <div className="flex gap-2">
                    <input type="number" step="0.01" {...register("total.value", { valueAsNumber: true })} placeholder="Value" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    <select
                        {...register("total.currency")}
                        className="mt-1 block w-48 border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                        disabled={loadingCurrencies || currencies.length === 0}
                    >
                        <option value="">Currency</option>
                        {currencies.map((currency) => (
                            <option key={currency.id} value={currency.alpha3}>
                                {currency.alpha3}
                            </option>
                        ))}
                    </select>
                </div>
                {(errors.total?.value || errors.total?.currency) && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.total?.value?.message || errors.total?.currency?.message}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                    <input type="checkbox" {...register("closed")} className="form-checkbox" />
                    Closed
                </label>
            </div>
            <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    <Plus className="size-5 inline-block mr-2" />
                    Create Period
                </button>
                <button type="button" onClick={() => onCancel?.()} className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-300 transition-colors">
                    Cancel
                </button>
            </div>
        </form>
    );
}