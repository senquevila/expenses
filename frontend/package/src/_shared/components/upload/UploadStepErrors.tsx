"use client";

import { useEffect, useState } from "react";
import { uploadService } from "@/_services/upload.service";

interface UploadStepErrorsProps {
  uploadId: number;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const LABELS: Record<string, string> = {
  row_number: "Row",
  description: "Description",
  reason: "Reason",
  date: "Date",
  amount: "Amount",
  currency: "Currency",
  error: "Error",
  message: "Message",
  field: "Field",
};

function humanLabel(key: string): string {
  return (
    LABELS[key] ??
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function cellText(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function FailsTable({ items }: { items: unknown[] }) {
  const keys = Array.from(
    new Set(items.flatMap((item) => (isRecord(item) ? Object.keys(item) : []))),
  );

  if (keys.length === 0) {
    return (
      <ul className="space-y-1 text-xs text-red-800">
        {items.map((item, i) => (
          <li key={i} className="font-mono">
            {cellText(item)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[420px] border border-red-200 rounded">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 z-10 bg-red-100">
          <tr>
            {keys.map((k) => (
              <th
                key={k}
                className="px-3 py-2 text-left font-semibold text-red-700 border-b border-red-200 whitespace-nowrap"
              >
                {humanLabel(k)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-red-100 hover:bg-red-50">
              {keys.map((k) => (
                <td
                  key={k}
                  className="px-3 py-2 text-red-800 font-mono whitespace-nowrap max-w-xs truncate"
                  title={isRecord(item) ? cellText(item[k]) : ""}
                >
                  {isRecord(item) ? cellText(item[k]) : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UploadStepErrors({ uploadId }: UploadStepErrorsProps) {
  const [fails, setFails] = useState<unknown>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    uploadService
      .getById(uploadId)
      .then((upload) => setFails(upload.fails))
      .catch((e) => console.error("Failed to load upload:", e))
      .finally(() => setLoading(false));
  }, [uploadId]);

  if (loading) {
    return (
      <div className="py-12 text-center text-zinc-400 text-sm">Loading…</div>
    );
  }

  const isEmpty =
    fails === null ||
    fails === undefined ||
    (Array.isArray(fails) && fails.length === 0);

  if (isEmpty) {
    return (
      <div className="py-12 text-center text-green-600 text-sm font-medium">
        No errors — upload processed successfully.
      </div>
    );
  }

  if (Array.isArray(fails)) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600 font-medium">
          {fails.length} error{fails.length !== 1 ? "s" : ""} found
        </p>
        <FailsTable items={fails} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-red-600 font-medium">Errors found</p>
      <div className="overflow-x-auto overflow-y-auto max-h-[420px] border border-red-200 rounded bg-red-50">
        <pre className="p-4 text-xs text-red-800 whitespace-pre-wrap break-all">
          {JSON.stringify(fails, null, 2)}
        </pre>
      </div>
    </div>
  );
}
