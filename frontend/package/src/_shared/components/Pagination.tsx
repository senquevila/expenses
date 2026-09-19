import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  count?: number;
  itemLabel?: string;
}

function buildPageWindows(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const delta = 2;
  const range = new Set<number>([1, total]);
  for (let i = current - delta; i <= current + delta; i++) {
    if (i > 1 && i < total) range.add(i);
  }
  const sorted = Array.from(range).sort((a, b) => a - b);
  const result: (number | "...")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("...");
    result.push(sorted[i]);
  }
  return result;
}

export default function Pagination({
  page,
  totalPages,
  loading = false,
  onPageChange,
  count,
  itemLabel,
}: PaginationProps) {
  const label = itemLabel ?? "item";
  return (
    <div className="flex items-center justify-between mt-4">
      {count !== undefined ? (
        <span className="text-sm text-zinc-500">
          {count} {label}
          {count !== 1 ? "s" : ""}
        </span>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="p-2 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        {buildPageWindows(page, totalPages).map((item, i) =>
          item === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="min-w-[2rem] h-8 flex items-center justify-center text-sm text-zinc-400"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              disabled={loading}
              className={`min-w-[2rem] h-8 px-2 rounded border text-sm transition-colors disabled:cursor-not-allowed ${
                item === page
                  ? "bg-zinc-900 border-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
          className="p-2 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
