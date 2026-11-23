import { BackendError } from "../api/backend";

export function messageOfGameError(err: unknown): string {
  if (err instanceof BackendError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}
