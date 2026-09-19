"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import { Step1Upload } from "@/_models/upload.model";
import { uploadService } from "@/_services/upload.service";
import UploadStepUpload from "./upload/UploadStepUpload";
import UploadStepTransform, {
  ColumnMap,
  ColumnMapType,
} from "./upload/UploadStepTransform";
import UploadStepErrors from "./upload/UploadStepErrors";
import UploadStepProcess from "./upload/UploadStepProcess";

const PREFS_KEY = "upload_form_prefs";

interface UploadFormPrefs {
  rowStart: number;
  rowEnd: number | null;
  columnMaps: Partial<Record<ColumnMapType, ColumnMap>>;
}

function loadPrefs(): UploadFormPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw)
      return { rowStart: 0, rowEnd: null, columnMaps: {}, ...JSON.parse(raw) };
  } catch {}
  return { rowStart: 0, rowEnd: null, columnMaps: {} };
}

function savePrefs(prefs: UploadFormPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

function resolveInitialRowEnd(
  savedRowEnd: number | null,
  lastRow: number,
): number {
  if (savedRowEnd === null) return lastRow;
  // A saved single-row selection at index 0 is often stale when a new file has more rows.
  if (savedRowEnd === 0 && lastRow > 0) return lastRow;
  return Math.min(savedRowEnd, lastRow);
}

const STEPS = ["Upload", "Transform", "Errors", "Transactions"] as const;
type Step = 0 | 1 | 2 | 3;

interface UploadFormProps {
  onCancel?: () => void;
}

function parseCSV(file: File, encoding = "windows-1252"): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      encoding,
      complete: (result) => resolve(result.data),
      error: (error) => reject(error),
    });
  });
}

export default function UploadForm({ onCancel }: UploadFormProps) {
  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [identifierOptions, setIdentifierOptions] = useState<string[]>([]);

  useEffect(() => {
    uploadService
      .getIdentifiers()
      .then(setIdentifierOptions)
      .catch(() => {});
  }, []);

  const [uploadResult, setUploadResult] = useState<Step1Upload | null>(null);
  const [parsedRows, setParsedRows] = useState<string[][]>([]);

  const [prefs] = useState<UploadFormPrefs>(loadPrefs);
  const [rowStart, setRowStart] = useState(() => prefs.rowStart);
  const [rowEnd, setRowEnd] = useState(0);
  const [columnMap, setColumnMap] = useState<ColumnMap>(() => {
    const saved = prefs.columnMaps["credit_card"];
    return (
      saved ?? {
        uploadType: "credit_card",
        date: 1,
        description: 2,
        local: 3,
        usd: 4,
      }
    );
  });

  const handleStepOneNext = async () => {
    if (!identifier.trim()) {
      setFileError("Please enter an identifier.");
      return;
    }
    if (!file) {
      setFileError("Please select a file.");
      return;
    }
    setFileError("");
    setLoading(true);
    try {
      const [upload, rows] = await Promise.all([
        uploadService.step1(file, identifier || undefined),
        parseCSV(file),
      ]);
      setUploadResult(upload);
      setParsedRows(rows);
      const lastRow = rows.length - 1;
      setRowEnd(resolveInitialRowEnd(prefs.rowEnd, lastRow));
      setStep(1);
    } catch (e) {
      console.error("Step 1 failed:", e);
      setFileError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStepTwoNext = async () => {
    if (!uploadResult) return;

    const errors: string[] = [];
    const colNums =
      columnMap.uploadType === "credit_card"
        ? [
            columnMap.date,
            columnMap.description,
            columnMap.local,
            columnMap.usd,
          ]
        : [
            columnMap.date,
            columnMap.description,
            columnMap.debit,
            columnMap.credit,
          ];
    if (colNums.some((n) => n < 1)) {
      errors.push("All column numbers must be at least 1.");
    }
    if (columnMap.uploadType === "savings_account" && !columnMap.currency) {
      errors.push("Please select a currency.");
    }
    if (rowEnd < rowStart) {
      errors.push("End row must be greater than or equal to start row.");
    }
    if (errors.length > 0) {
      setApiError(errors.join(" "));
      return;
    }

    setLoading(true);
    try {
      const dataRows = parsedRows.slice(rowStart, rowEnd + 1);
      const result =
        columnMap.uploadType === "credit_card"
          ? dataRows.map((row, i) => ({
              row_number: rowStart + i,
              date: row[columnMap.date - 1] ?? "",
              description: row[columnMap.description - 1] ?? "",
              local: {
                amount: row[columnMap.local - 1] ?? "",
                currency: "HNL",
              },
              usd: { amount: row[columnMap.usd - 1] ?? "", currency: "USD" },
            }))
          : dataRows.map((row, i) => ({
              row_number: rowStart + i,
              date: row[columnMap.date - 1] ?? "",
              description: row[columnMap.description - 1] ?? "",
              debit: {
                amount: row[columnMap.debit - 1] ?? "",
                currency: columnMap.currency,
              },
              credit: {
                amount: row[columnMap.credit - 1] ?? "",
                currency: columnMap.currency,
              },
            }));
      await uploadService.step2(uploadResult.id, result, columnMap.uploadType);
      savePrefs({
        rowStart,
        rowEnd,
        columnMaps: { ...prefs.columnMaps, [columnMap.uploadType]: columnMap },
      });
      setApiError(null);
      setStep(2);
    } catch (e: unknown) {
      const data = (e as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") {
        const msg = Object.entries(data as Record<string, string[]>)
          .flatMap(([k, errs]) => errs.map((m) => `${k}: ${m}`))
          .join(" · ");
        setApiError(msg);
      } else {
        setApiError("Failed to process upload. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 0) {
      handleStepOneNext();
      return;
    }
    if (step === 1) {
      handleStepTwoNext();
      return;
    }
    setStep((s) => (s + 1) as Step);
  };

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <nav className="flex items-center">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={label} className="flex items-center">
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-sm font-medium border-2 transition-colors ${
                    done
                      ? "bg-zinc-900 border-zinc-900 text-white"
                      : active
                        ? "border-zinc-900 text-zinc-900"
                        : "border-zinc-300 text-zinc-400"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={`text-sm font-medium ${
                    active
                      ? "text-zinc-900"
                      : done
                        ? "text-zinc-600"
                        : "text-zinc-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-3 h-px w-8 ${i < step ? "bg-zinc-900" : "bg-zinc-200"}`}
                />
              )}
            </div>
          );
        })}
      </nav>

      {step === 0 && (
        <UploadStepUpload
          file={file}
          fileError={fileError}
          onFileChange={(f) => {
            setFile(f);
            setFileError("");
          }}
          identifier={identifier}
          identifierOptions={identifierOptions}
          onIdentifierChange={setIdentifier}
        />
      )}

      {step === 1 && (
        <UploadStepTransform
          rows={parsedRows}
          fileName={file?.name ?? null}
          rowStart={rowStart}
          rowEnd={rowEnd}
          columnMap={columnMap}
          savedColumnMaps={prefs.columnMaps}
          onRowStartChange={setRowStart}
          onRowEndChange={setRowEnd}
          onColumnMapChange={setColumnMap}
        />
      )}

      {step === 2 && uploadResult && (
        <UploadStepErrors uploadId={uploadResult.id} />
      )}

      {step === 3 && uploadResult && (
        <UploadStepProcess uploadId={uploadResult.id} />
      )}

      {apiError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {apiError}
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-2">
        {step === 0 && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        {step > 0 && <div />}

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Next"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
