"use client";

import Link from "next/link";
import type { UploadTemplate } from "@/_models/upload.model";
import { describeColumns } from "../UploadTemplates";

interface UploadStepTemplateProps {
  templates: UploadTemplate[];
  templateId: number | null;
  onChange: (id: number | null) => void;
}

export default function UploadStepTemplate({
  templates,
  templateId,
  onChange,
}: UploadStepTemplateProps) {
  const options = [
    {
      id: null,
      name: "No template",
      detail: "Set the start row and columns by hand in the next step.",
    },
    ...templates.map((t) => ({
      id: t.id,
      name: t.name,
      detail: `row ${t.row_start} · ${describeColumns(t.columns)}`,
    })),
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600">
        Choose how to read this file.{" "}
        <Link
          href="/templates"
          className="text-zinc-400 underline hover:text-zinc-700"
        >
          Manage templates
        </Link>
      </p>
      <div className="space-y-2">
        {options.map((o) => (
          <label
            key={o.id ?? "none"}
            className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
              templateId === o.id
                ? "border-zinc-900 bg-zinc-50"
                : "border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            <input
              type="radio"
              name="template"
              checked={templateId === o.id}
              onChange={() => onChange(o.id)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">
                {o.name}
              </span>
              <span className="block text-xs text-zinc-500 font-mono">
                {o.detail}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
