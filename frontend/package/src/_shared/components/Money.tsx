"use client";

import { Money as MoneyValue } from "@/_models/money.model";

interface MoneyProps {
  value: MoneyValue | number;
  className?: string;
}

export default function Money({ value, className = "" }: MoneyProps) {
  const numValue = typeof value === "number" ? value : value.value;
  const currency = typeof value === "number" ? "" : value.currency;

  return (
    <span
      className={`font-semibold ${numValue >= 0 ? "text-green-600" : "text-red-600"} ${className}`}
    >
      {currency ? `${currency} ` : ""}
      {numValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
}
