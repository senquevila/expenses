"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { parseApiError } from "@/_libs/api/error";
import type {
  UploadTemplate,
  UploadTemplateRequest,
} from "@/_models/upload.model";
import { uploadService } from "@/_services/upload.service";
import ColumnMapEditor, {
  type ColumnMap,
  type ColumnMapType,
  DEFAULT_COLUMN_MAPS,
} from "./ColumnMapEditor";

const TYPE_LABELS: Record<UploadTemplate["upload_type"], string> = {
  CREDIT_CARD: "Credit card",
  SAVINGS_ACCOUNT: "Savings account",
};

const EMPTY: UploadTemplateRequest = {
  name: "",
  upload_type: "SAVINGS_ACCOUNT",
  row_start: 1,
  active: true,
  columns: DEFAULT_COLUMN_MAPS.savings_account,
};

export function describeColumns(columns: UploadTemplate["columns"]): string {
  const parts = [`date ${columns.date}`, `desc ${columns.description}`];
  for (const a of columns.amounts) {
    parts.push(`${a.kind} ${a.col}${a.currency ? ` ${a.currency}` : ""}`);
  }
  if ((columns.currencyCol ?? 0) > 0)
    parts.push(`currency ${columns.currencyCol}`);
  return parts.join(" · ");
}

export default function UploadTemplates() {
  const [templates, setTemplates] = useState<UploadTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  // null = dialog closed, "new" = creating, a template = editing it
  const [editing, setEditing] = useState<UploadTemplate | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await uploadService.getTemplates());
    } catch {
      toast.error("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">Upload templates</h1>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <Plus className="size-5" />
          New Template
        </button>
      </div>
      <p className="text-sm text-zinc-500 mb-6">
        How to read each bank&apos;s CSV. Pick one in the upload form; when a
        bank changes its format, add a new template and deactivate the old one.
      </p>

      <Dialog.Root
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <Dialog.Title className="text-xl font-semibold mb-4">
              {editing === "new" ? "New Template" : "Edit Template"}
            </Dialog.Title>
            {editing && (
              <TemplateForm
                template={editing === "new" ? undefined : editing}
                onDone={() => {
                  setEditing(null);
                  load();
                }}
                onCancel={() => setEditing(null)}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {loading ? (
        <p className="text-zinc-500">Loading templates...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-100 border-b">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Name</th>
                <th className="text-left px-6 py-3 font-semibold">Type</th>
                <th className="text-left px-6 py-3 font-semibold">Columns</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-zinc-400"
                  >
                    No templates yet.
                  </td>
                </tr>
              ) : (
                templates.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-zinc-50">
                    <td className="px-6 py-4">{t.name}</td>
                    <td className="px-6 py-4">{TYPE_LABELS[t.upload_type]}</td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-600">
                      row {t.row_start} · {describeColumns(t.columns)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${t.active ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-500"}`}
                      >
                        {t.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setEditing(t)}
                        className="p-1.5 rounded hover:bg-zinc-100 transition-colors"
                        aria-label="Edit template"
                      >
                        <Pencil className="size-4 text-zinc-500" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface TemplateFormProps {
  template?: UploadTemplate;
  onDone: () => void;
  onCancel: () => void;
}

function TemplateForm({ template, onDone, onCancel }: TemplateFormProps) {
  const [data, setData] = useState<UploadTemplateRequest>(template ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const uploadType = data.upload_type.toLowerCase() as ColumnMapType;
  const columnMap: ColumnMap = { ...data.columns, uploadType };

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await uploadService.saveTemplate(data, template?.id);
      toast.success(template ? "Template updated" : "Template created");
      onDone();
    } catch (e) {
      setError(parseApiError(e) ?? "Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!template) return;
    try {
      await uploadService.deleteTemplate(template.id);
      toast.success("Template deleted");
      onDone();
    } catch {
      toast.error("Failed to delete template");
    }
  }

  const input = "mt-1 block w-full border border-gray-300 rounded-md p-2";
  const label = "block text-sm font-medium text-gray-700";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="tpl-name" className={label}>
          Name
        </label>
        <input
          id="tpl-name"
          required
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          className={input}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="tpl-type" className={label}>
            Type
          </label>
          <select
            id="tpl-type"
            value={data.upload_type}
            onChange={(e) =>
              setData({
                ...data,
                upload_type: e.target.value as UploadTemplate["upload_type"],
              })
            }
            className={`${input} bg-white`}
          >
            {Object.entries(TYPE_LABELS).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tpl-row-start" className={label}>
            Start row
          </label>
          <input
            id="tpl-row-start"
            type="number"
            min={0}
            value={data.row_start}
            onChange={(e) =>
              setData({ ...data, row_start: Number(e.target.value) })
            }
            className={input}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 pt-6">
          <input
            type="checkbox"
            checked={data.active}
            onChange={(e) => setData({ ...data, active: e.target.checked })}
          />
          Active
        </label>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-zinc-800 mb-3">Columns</h3>
        <ColumnMapEditor
          value={columnMap}
          onChange={({ uploadType: _, ...columns }) =>
            setData({ ...data, columns })
          }
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {template ? (
            <Check className="size-4" />
          ) : (
            <Plus className="size-4" />
          )}
          {template ? "Save Changes" : "Create Template"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-300 transition-colors"
        >
          Cancel
        </button>
        {template && (
          <button
            type="button"
            onClick={remove}
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
