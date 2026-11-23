/**
 * Backend selection. Single switch for the whole app:
 * - default (no VITE_API_URL): MockSudokuBackend
 * - VITE_API_URL set + VITE_USE_MOCK=false: HttpSudokuBackend
 */
import { HttpSudokuBackend } from "./httpBackend";
import { MockSudokuBackend } from "./mockBackend";
import type { SudokuBackend } from "./backend";

let cached: SudokuBackend | null = null;

export function getBackend(): SudokuBackend {
  if (cached) return cached;
  const baseUrl = import.meta.env.VITE_API_URL as string | undefined;
  const flag = import.meta.env.VITE_USE_MOCK as string | undefined;
  const useMock = (flag ?? (baseUrl ? "false" : "true")) !== "false";
  cached =
    useMock || !baseUrl
      ? new MockSudokuBackend()
      : new HttpSudokuBackend(baseUrl);
  return cached;
}

export function isMockBackend(backend: SudokuBackend = getBackend()): boolean {
  return backend.id === "mock";
}
