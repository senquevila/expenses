"use client";

// --- Types ---

export type ColumnMapType = "credit_card" | "savings_account";

// debit: positive = expense, credit: positive = income (backend flips negatives when only one kind is used)
export type AmountKind = "debit" | "credit";

export interface AmountColumn {
  col: number;
  kind: AmountKind;
  // Fixed currency for this column; empty = currency column, then code in the amount, then default
  currency?: string;
}

export interface ColumnMap {
  uploadType: ColumnMapType;
  date: number;
  description: number;
  // 1-based column holding the row's currency code; 0/undefined = not in the file
  currencyCol?: number;
  amounts: AmountColumn[];
}

export const DEFAULT_COLUMN_MAPS: Record<ColumnMapType, ColumnMap> = {
  credit_card: {
    uploadType: "credit_card",
    date: 1,
    description: 2,
    currencyCol: 0,
    amounts: [
      { col: 3, kind: "debit", currency: "HNL" },
      { col: 4, kind: "debit", currency: "USD" },
    ],
  },
  savings_account: {
    uploadType: "savings_account",
    date: 1,
    description: 2,
    currencyCol: 0,
    amounts: [
      { col: 3, kind: "debit" },
      { col: 4, kind: "credit" },
    ],
  },
};

interface ColumnMapEditorProps {
  value: ColumnMap;
  onChange: (map: ColumnMap) => void;
}

// Date, description, currency column and the amount list. Shared by the upload Transform step and the template form.
export default function ColumnMapEditor({
  value: columnMap,
  onChange: onColumnMapChange,
}: ColumnMapEditorProps) {
  function setNum(key: "date" | "description" | "currencyCol", value: number) {
    onColumnMapChange({ ...columnMap, [key]: value });
  }

  function setAmount(i: number, patch: Partial<AmountColumn>) {
    onColumnMapChange({
      ...columnMap,
      amounts: columnMap.amounts.map((a, j) =>
        j === i ? { ...a, ...patch } : a,
      ),
    });
  }

  return (
    <div>
      <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded px-2 py-1.5 mb-3">
        Columns start at 1, as in the preview header. Use 0 when the file
        doesn&apos;t have that column.
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3">
        <div>
          <label
            htmlFor="date"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 mb-1"
          >
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-600" />
            Date
          </label>
          <input
            id="date"
            type="number"
            min={1}
            value={columnMap.date}
            onChange={(e) => setNum("date", Number(e.target.value))}
            className="block w-full border border-gray-300 rounded-md p-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 mb-1"
          >
            <span className="inline-block w-3 h-3 rounded-sm bg-orange-500" />
            Description
          </label>
          <input
            id="description"
            type="number"
            min={1}
            value={columnMap.description}
            onChange={(e) => setNum("description", Number(e.target.value))}
            className="block w-full border border-gray-300 rounded-md p-2 text-sm"
          />
        </div>
        <div className="col-span-2">
          <label
            htmlFor="currency-col"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 mb-1"
          >
            <span className="inline-block w-3 h-3 rounded-sm bg-zinc-500" />
            Currency column
          </label>
          <input
            id="currency-col"
            type="number"
            min={0}
            value={columnMap.currencyCol ?? 0}
            onChange={(e) => setNum("currencyCol", Number(e.target.value))}
            className="block w-full border border-gray-300 rounded-md p-2 text-sm"
          />
          <p className="text-xs text-zinc-400 mt-1">
            0 = not in the file (use the amount&apos;s currency)
          </p>
        </div>
      </div>

      {/* Amount columns */}
      <h4 className="text-xs font-semibold text-zinc-700 mt-4 mb-2">Amounts</h4>
      <div className="space-y-2">
        {columnMap.amounts.map((a, i) => (
          <div key={i} className="flex items-center gap-1">
            <span
              className={`inline-block w-3 h-3 shrink-0 rounded-sm ${a.kind === "debit" ? "bg-emerald-600" : "bg-purple-600"}`}
            />
            <input
              aria-label={`Amount ${i + 1} column`}
              type="number"
              min={1}
              value={a.col}
              onChange={(e) => setAmount(i, { col: Number(e.target.value) })}
              className="w-12 border border-gray-300 rounded-md p-1 text-xs"
            />
            <select
              aria-label={`Amount ${i + 1} kind`}
              value={a.kind}
              onChange={(e) =>
                setAmount(i, { kind: e.target.value as AmountKind })
              }
              className="border border-gray-300 rounded-md p-1 text-xs bg-white"
            >
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
            <select
              aria-label={`Amount ${i + 1} currency`}
              value={a.currency ?? ""}
              onChange={(e) => setAmount(i, { currency: e.target.value })}
              className="border border-gray-300 rounded-md p-1 text-xs bg-white"
            >
              <option value="">Auto</option>
              <option value="HNL">HNL</option>
              <option value="USD">USD</option>
            </select>
            <button
              type="button"
              aria-label={`Remove amount ${i + 1}`}
              onClick={() =>
                onColumnMapChange({
                  ...columnMap,
                  amounts: columnMap.amounts.filter((_, j) => j !== i),
                })
              }
              className="px-1 text-zinc-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onColumnMapChange({
            ...columnMap,
            amounts: [...columnMap.amounts, { col: 1, kind: "debit" }],
          })
        }
        className="mt-2 text-xs text-zinc-600 underline hover:text-zinc-900"
      >
        + Add amount
      </button>
      <p className="text-xs text-zinc-400 mt-1">
        First non-empty amount wins. Debit = expense, credit = income; a
        negative value flips it unless both kinds are used.
      </p>
    </div>
  );
}
