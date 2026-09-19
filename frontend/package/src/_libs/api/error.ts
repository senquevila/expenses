import axios from "axios";

function flattenErrorDetails(value: unknown, path = ""): string[] {
  if (value == null) return [];
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return [path ? `${path}: ${String(value)}` : String(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenErrorDetails(item, path));
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, nestedValue]) => {
        const nextPath = path ? `${path}.${key}` : key;
        return flattenErrorDetails(nestedValue, nextPath);
      },
    );
  }
  return [path ? `${path}: ${String(value)}` : String(value)];
}

export function parseApiError(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const parts = flattenErrorDetails(data);
      if (parts.length) return parts.join(" · ");
    }
    return null;
  }
  if (error instanceof Error) return error.message;
  return null;
}
