"use client";

import { Check, ChevronsUpDown, List, Plus, Trash2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import React, { useEffect, useState } from "react";
import { useUploadStore } from "@/_store/upload.store";
import { Upload, UPLOAD_TYPES } from "@/_models/upload.model";
import UploadForm from "@/_shared/components/UploadForm";
import UploadStepProcess from "@/_shared/components/upload/UploadStepProcess";
import Pagination from "@/_shared/components/Pagination";
import { uploadService } from "@/_services/upload.service";
import { Popover, PopoverContent, PopoverTrigger } from "@/_libs/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/_libs/ui/command";

function fileName(url: string | null): string {
  if (!url) return "—";
  return url.split("/").pop() ?? url;
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return date.slice(0, 10);
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

const UPLOAD_TYPE_METADATA = Object.fromEntries(
  UPLOAD_TYPES.map((t) => [t.value, { label: t.label, color: t.color }]),
);

function humanizeUploadType(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderUploadType(
  uploadType: string | null,
): React.ReactElement | string {
  if (!uploadType) return "—";

  const key = uploadType.toLowerCase();
  const uploadTypeMetadata = UPLOAD_TYPE_METADATA[key];
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${uploadTypeMetadata?.color ?? "bg-zinc-100 text-zinc-600"}`}
    >
      {uploadTypeMetadata?.label ?? humanizeUploadType(uploadType)}
    </span>
  );
}

export default function Uploads() {
  const {
    uploads,
    count,
    page,
    totalPages,
    fetchPage,
    loading,
    remove,
    filters,
    setFilters,
  } = useUploadStore();
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
  const [identifiers, setIdentifiers] = useState<string[]>([]);
  const [identifierOpen, setIdentifierOpen] = useState(false);

  useEffect(() => {
    fetchPage(1);
    uploadService
      .getIdentifiers()
      .then(setIdentifiers)
      .catch(() => {});
  }, [fetchPage]);

  const handleDelete = async (upload: Upload) => {
    if (confirmId === upload.id) {
      await remove(upload.id);
      setConfirmId(null);
    } else {
      setConfirmId(upload.id);
    }
  };

  if (loading && uploads.length === 0)
    return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Uploads</h1>
        <Dialog.Root
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) fetchPage(page);
          }}
        >
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
              <Plus className="size-5" />
              New Upload
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-6xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
              <Dialog.Title className="text-xl font-semibold mb-4">
                New Upload
              </Dialog.Title>
              <UploadForm onCancel={() => setOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Popover open={identifierOpen} onOpenChange={setIdentifierOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm bg-white hover:bg-zinc-50 min-w-[180px] justify-between">
              <span
                className={
                  filters.identifier ? "text-zinc-900" : "text-zinc-400"
                }
              >
                {filters.identifier ?? "Identifier…"}
              </span>
              <ChevronsUpDown className="size-4 text-zinc-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search identifier…" />
              <CommandList>
                <CommandEmpty>No identifiers found.</CommandEmpty>
                <CommandGroup>
                  {filters.identifier && (
                    <CommandItem
                      value=""
                      onSelect={() => {
                        setFilters({ ...filters, identifier: undefined });
                        setIdentifierOpen(false);
                      }}
                    >
                      <span className="text-zinc-400">Clear filter</span>
                    </CommandItem>
                  )}
                  {identifiers.map((id) => (
                    <CommandItem
                      key={id}
                      value={id}
                      onSelect={() => {
                        setFilters({ ...filters, identifier: id });
                        setIdentifierOpen(false);
                      }}
                    >
                      <Check
                        className={`size-4 ${filters.identifier === id ? "opacity-100" : "opacity-0"}`}
                      />
                      {id}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <select
          value={filters.upload_type ?? ""}
          onChange={(e) =>
            setFilters({ ...filters, upload_type: e.target.value || undefined })
          }
          className="px-3 py-2 border rounded-lg text-sm bg-white hover:bg-zinc-50 text-zinc-700"
        >
          <option value="">All types</option>
          {UPLOAD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {(filters.identifier || filters.upload_type) && (
          <button
            onClick={() => setFilters({})}
            className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-100 border-b">
            <tr>
              <th className="text-left px-6 py-3 font-semibold">File</th>
              <th className="text-left px-6 py-3 font-semibold">Identifier</th>
              <th className="text-left px-6 py-3 font-semibold">Type</th>
              <th className="text-left px-6 py-3 font-semibold">Status</th>
              <th className="text-left px-6 py-3 font-semibold">Start Date</th>
              <th className="text-left px-6 py-3 font-semibold">End Date</th>
              <th className="text-left px-6 py-3 font-semibold">Created</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {uploads.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-zinc-400">
                  No uploads yet.
                </td>
              </tr>
            )}
            {uploads.map((upload) => (
              <tr key={upload.id} className="border-b hover:bg-zinc-50">
                <td
                  className="px-6 py-4 text-sm font-mono truncate max-w-xs"
                  title={upload.file ?? ""}
                >
                  {fileName(upload.file)}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-700">
                  {upload.identifier ?? "—"}
                </td>
                <td className="px-6 py-4">
                  {renderUploadType(upload.upload_type)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[upload.upload_status] ?? "bg-zinc-100 text-zinc-600"}`}
                  >
                    {upload.upload_status}
                  </span>
                </td>
                <td className="px-6 py-4">{formatDate(upload.start_date)}</td>
                <td className="px-6 py-4">{formatDate(upload.end_date)}</td>
                <td className="px-6 py-4 text-sm text-zinc-500">
                  {formatDate(upload.created)}
                </td>
                <td className="px-6 py-4 text-right">
                  {confirmId === upload.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-zinc-500">Delete?</span>
                      <button
                        onClick={() => handleDelete(upload)}
                        className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="px-2 py-1 text-sm bg-zinc-200 text-zinc-700 rounded hover:bg-zinc-300 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      {upload.upload_status === "DONE" && (
                        <button
                          onClick={() => setSelectedUpload(upload)}
                          className="p-2 text-zinc-400 hover:text-zinc-700 transition-colors rounded"
                          title="View transactions"
                        >
                          <List className="size-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmId(upload.id)}
                        className="p-2 text-zinc-400 hover:text-red-600 transition-colors rounded"
                        title="Delete upload"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        loading={loading}
        onPageChange={fetchPage}
        count={count}
        itemLabel="upload"
      />

      <Dialog.Root
        open={!!selectedUpload}
        onOpenChange={(o) => !o && setSelectedUpload(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Transactions — {fileName(selectedUpload?.file ?? null)}
            </Dialog.Title>
            {selectedUpload && (
              <UploadStepProcess uploadId={selectedUpload.id} />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
