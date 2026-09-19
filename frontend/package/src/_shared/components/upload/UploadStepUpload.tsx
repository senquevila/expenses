"use client";

import { useRef } from "react";

interface UploadStepUploadProps {
  file: File | null;
  fileError: string;
  onFileChange: (file: File | null) => void;
  identifier: string;
  identifierOptions: string[];
  onIdentifierChange: (value: string) => void;
}

export default function UploadStepUpload({
  file,
  fileError,
  onFileChange,
  identifier,
  identifierOptions,
  onIdentifierChange,
}: UploadStepUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[6rem_1fr] items-center gap-3">
        <label className="text-sm font-medium text-zinc-700">Identifier:</label>
        <div>
          <input
            list="identifier-options"
            value={identifier}
            onChange={(e) => onIdentifierChange(e.target.value)}
            maxLength={50}
            placeholder="Select or type an identifier"
            className="w-full rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
          <datalist id="identifier-options">
            {identifierOptions.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-[6rem_1fr] items-center gap-3">
        <label className="text-sm font-medium text-zinc-700">File:</label>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-1 file:px-3 file:rounded file:border file:border-zinc-300 file:text-sm file:bg-white file:text-zinc-700 hover:file:bg-zinc-50"
          />
          {fileError && (
            <p className="text-red-500 text-sm mt-1">{fileError}</p>
          )}
        </div>
      </div>

      {file && <p className="text-sm text-zinc-500 pl-[6.5rem]">{file.name}</p>}
    </div>
  );
}
