"use client";

import { useState, useMemo } from "react";

// --- Types ---

export type ColumnMapType = "credit_card" | "savings_account";

export type ColumnMap =
  | {
      uploadType: "credit_card";
      date: number;
      description: number;
      local: number;
      usd: number;
    }
  | {
      uploadType: "savings_account";
      date: number;
      description: number;
      debit: number;
      credit: number;
      currency: string;
    };

interface UploadStepTransformProps {
  rows: string[][];
  fileName: string | null;
  rowStart: number;
  rowEnd: number;
  columnMap: ColumnMap;
  savedColumnMaps?: Partial<Record<ColumnMapType, ColumnMap>>;
  onRowStartChange: (v: number) => void;
  onRowEndChange: (v: number) => void;
  onColumnMapChange: (map: ColumnMap) => void;
}

// --- Constants ---

const UPLOAD_TYPES: { value: ColumnMapType; label: string }[] = [
  { value: "credit_card", label: "Credit card" },
  { value: "savings_account", label: "Savings account" },
];

const DEFAULTS: Record<ColumnMapType, ColumnMap> = {
  credit_card: {
    uploadType: "credit_card",
    date: 1,
    description: 2,
    local: 3,
    usd: 4,
  },
  savings_account: {
    uploadType: "savings_account",
    date: 1,
    description: 2,
    debit: 3,
    credit: 4,
    currency: "",
  },
};

const COL_COLORS = {
  date: {
    bg: "bg-blue-600",
    cell: "bg-blue-600 text-white",
    header: "bg-blue-700 text-white",
  },
  description: {
    bg: "bg-orange-500",
    cell: "bg-orange-500 text-white",
    header: "bg-orange-600 text-white",
  },
  third: {
    bg: "bg-emerald-600",
    cell: "bg-emerald-600 text-white",
    header: "bg-emerald-700 text-white",
  },
  fourth: {
    bg: "bg-purple-600",
    cell: "bg-purple-600 text-white",
    header: "bg-purple-700 text-white",
  },
};

const PAGE_SIZES = [10, 25, 50, 100];

// --- Helpers ---

function getThirdCol(map: ColumnMap) {
  return map.uploadType === "credit_card" ? map.local : map.debit;
}
function getFourthCol(map: ColumnMap) {
  return map.uploadType === "credit_card" ? map.usd : map.credit;
}

function cellBg(displayCol: number, map: ColumnMap): string {
  if (displayCol === map.date) return COL_COLORS.date.cell;
  if (displayCol === map.description) return COL_COLORS.description.cell;
  if (displayCol === getThirdCol(map)) return COL_COLORS.third.cell;
  if (displayCol === getFourthCol(map)) return COL_COLORS.fourth.cell;
  return "";
}

function headerBg(displayCol: number, map: ColumnMap): string {
  if (displayCol === map.date) return COL_COLORS.date.header;
  if (displayCol === map.description) return COL_COLORS.description.header;
  if (displayCol === getThirdCol(map)) return COL_COLORS.third.header;
  if (displayCol === getFourthCol(map)) return COL_COLORS.fourth.header;
  return "bg-zinc-100 text-zinc-600";
}

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  )
    pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

// --- Component ---

export default function UploadStepTransform({
  rows,
  fileName,
  rowStart,
  rowEnd,
  columnMap,
  savedColumnMaps,
  onRowStartChange,
  onRowEndChange,
  onColumnMapChange,
}: UploadStepTransformProps) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const maxCols = useMemo(
    () => Math.max(0, ...rows.map((r) => r.length)),
    [rows],
  );
  const indexed = useMemo(() => rows.map((row, idx) => ({ row, idx })), [rows]);

  const filtered = useMemo(() => {
    if (!search.trim()) return indexed;
    const q = search.toLowerCase();
    return indexed.filter(({ row }) =>
      row.some((cell) => cell.toLowerCase().includes(q)),
    );
  }, [indexed, search]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(totalPages, p)));

  function handleTypeChange(newType: ColumnMapType) {
    onColumnMapChange(savedColumnMaps?.[newType] ?? DEFAULTS[newType]);
  }

  function setNum(key: string, value: number) {
    onColumnMapChange({ ...columnMap, [key]: value } as ColumnMap);
  }

  return (
    <div className="flex gap-6 min-h-0">
      {/* Sidebar */}
      <div className="w-52 shrink-0 space-y-5">
        {fileName && (
          <p className="text-xs text-zinc-500 break-all">
            <span className="font-semibold text-zinc-700">File upload:</span>{" "}
            <span className="text-pink-600">{fileName}</span>
          </p>
        )}

        {/* Row dimension */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 mb-3">
            CSV row dimension
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Start row
              </label>
              <input
                type="number"
                min={0}
                value={rowStart}
                onChange={(e) => onRowStartChange(Number(e.target.value))}
                className="block w-full border border-gray-300 rounded-md p-2 text-sm"
              />
              <p className="text-xs text-zinc-400 mt-1">
                Row number where the data starts
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                End row
              </label>
              <input
                type="number"
                min={0}
                value={rowEnd}
                onChange={(e) => onRowEndChange(Number(e.target.value))}
                className="block w-full border border-gray-300 rounded-md p-2 text-sm"
              />
              <p className="text-xs text-zinc-400 mt-1">
                Row number where the data ends
              </p>
            </div>
          </div>
        </div>

        <hr className="border-zinc-200" />

        {/* Column mapping */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 mb-3">
            Column mapping
          </h3>

          {/* Type selector */}
          <div className="flex rounded-md border border-zinc-300 overflow-hidden mb-4 text-xs">
            {UPLOAD_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleTypeChange(value)}
                className={`flex-1 py-1.5 transition-colors ${
                  columnMap.uploadType === value
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Savings account: currency */}
          {columnMap.uploadType === "savings_account" && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Currency
              </label>
              <select
                value={columnMap.currency}
                onChange={(e) =>
                  onColumnMapChange({ ...columnMap, currency: e.target.value })
                }
                className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white"
              >
                <option value="">---------</option>
                <option value="HNL">HNL</option>
                <option value="USD">USD</option>
              </select>
            </div>
          )}

          {/* Numeric column inputs */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
            {/* Date */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 mb-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-blue-600" />
                Date
              </label>
              <input
                type="number"
                min={1}
                value={columnMap.date}
                onChange={(e) => setNum("date", Number(e.target.value))}
                className="block w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 mb-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-orange-500" />
                Description
              </label>
              <input
                type="number"
                min={1}
                value={columnMap.description}
                onChange={(e) => setNum("description", Number(e.target.value))}
                className="block w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>

            {/* Third field: Local / Debit */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 mb-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-emerald-600" />
                {columnMap.uploadType === "credit_card" ? "Local" : "Debit"}
              </label>
              <input
                type="number"
                min={1}
                value={
                  columnMap.uploadType === "credit_card"
                    ? columnMap.local
                    : columnMap.debit
                }
                onChange={(e) =>
                  setNum(
                    columnMap.uploadType === "credit_card" ? "local" : "debit",
                    Number(e.target.value),
                  )
                }
                className="block w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>

            {/* Fourth field: USD / Credit */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 mb-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-purple-600" />
                {columnMap.uploadType === "credit_card" ? "USD" : "Credit"}
              </label>
              <input
                type="number"
                min={1}
                value={
                  columnMap.uploadType === "credit_card"
                    ? columnMap.usd
                    : columnMap.credit
                }
                onChange={(e) =>
                  setNum(
                    columnMap.uploadType === "credit_card" ? "usd" : "credit",
                    Number(e.target.value),
                  )
                }
                className="block w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table panel */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            Show
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="border border-zinc-300 rounded px-2 py-1 text-sm"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            entries
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            Search:
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="border border-zinc-300 rounded px-2 py-1 text-sm w-40"
            />
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[460px] border border-zinc-200 rounded">
          <table className="text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="border border-zinc-200 px-2 py-1 bg-zinc-100 text-zinc-600 text-right w-10 sticky left-0 z-20">
                  0
                </th>
                {Array.from({ length: maxCols }, (_, i) => (
                  <th
                    key={i}
                    className={`border border-zinc-200 px-3 py-1 text-center font-semibold ${headerBg(i + 1, columnMap)}`}
                  >
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(({ row, idx }) => (
                <tr
                  key={idx}
                  className={`hover:brightness-95 ${idx >= rowStart && idx <= rowEnd ? "font-semibold" : "font-normal text-zinc-400 line-through"}`}
                >
                  <td className="border border-zinc-200 px-2 py-1 text-right text-zinc-400 font-mono bg-zinc-50 sticky left-0 z-10">
                    {idx}
                  </td>
                  {Array.from({ length: maxCols }, (_, i) => (
                    <td
                      key={i}
                      className={`border border-zinc-200 px-3 py-1 whitespace-nowrap ${cellBg(i + 1, columnMap)}`}
                    >
                      {row[i] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>
            {filtered.length === 0
              ? "No entries"
              : `Showing ${(safePage - 1) * pageSize + 1} to ${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length} entries`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              className="px-2 py-1 border border-zinc-300 rounded text-xs disabled:opacity-40 hover:bg-zinc-50"
            >
              Previous
            </button>
            {buildPageNumbers(safePage, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`e${i}`} className="px-1 text-xs">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p as number)}
                  className={`px-2 py-1 border rounded text-xs ${p === safePage ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-300 hover:bg-zinc-50"}`}
                >
                  {p}
                </button>
              ),
            )}
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="px-2 py-1 border border-zinc-300 rounded text-xs disabled:opacity-40 hover:bg-zinc-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
