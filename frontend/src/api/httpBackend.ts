/**
 * HTTP backend: talks to the real service. Mirrors the mock's interface
 * exactly — see README for the expected REST endpoints.
 */
import {
  BackendError,
  type AgentMoveRequest,
  type AgentMoveResponse,
  type FetchPuzzleRequest,
  type FetchPuzzleResponse,
  type HintRequest,
  type HintResponse,
  type RulesResponse,
  type SudokuBackend,
  type ValidateMoveRequest,
  type ValidateMoveResponse,
  type ValidateSizeRequest,
  type ValidateSizeResponse,
} from "./backend";

const TIMEOUT_MS = 12_000;

export class HttpSudokuBackend implements SudokuBackend {
  readonly id = "http" as const;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: { "Content-Type": "application/json", ...init?.headers },
      });
      const body = (await res.json().catch(() => ({}))) as
        | T
        | { message?: string };
      if (!res.ok) {
        const message =
          typeof body === "object" && body && "message" in body && body.message
            ? String(body.message)
            : `Request failed (${res.status})`;
        throw new BackendError(message, res.status);
      }
      return body as T;
    } catch (err) {
      if (err instanceof BackendError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new BackendError("Request timed out.", 408);
      }
      throw new BackendError(
        err instanceof Error ? err.message : "Network error.",
      );
    } finally {
      clearTimeout(timer);
    }
  }

  validateBoardSize(
    req: ValidateSizeRequest,
  ): Promise<ValidateSizeResponse> {
    return this.request<ValidateSizeResponse>("/api/sudoku/validate-size", {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  fetchRules(size: number): Promise<RulesResponse> {
    return this.request<RulesResponse>(
      `/api/sudoku/rules?size=${encodeURIComponent(size)}`,
    );
  }

  fetchPuzzle(req: FetchPuzzleRequest): Promise<FetchPuzzleResponse> {
    return this.request<FetchPuzzleResponse>("/api/sudoku/puzzle", {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  validateMove(req: ValidateMoveRequest): Promise<ValidateMoveResponse> {
    return this.request<ValidateMoveResponse>("/api/sudoku/validate-move", {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  requestHint(req: HintRequest): Promise<HintResponse> {
    return this.request<HintResponse>("/api/sudoku/hint", {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  requestAgentMove(req: AgentMoveRequest): Promise<AgentMoveResponse> {
    return this.request<AgentMoveResponse>("/api/agent/next-move", {
      method: "POST",
      body: JSON.stringify(req),
    });
  }
}
