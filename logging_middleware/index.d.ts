export type Stack = "backend" | "frontend";
export type Level = "debug" | "info" | "warn" | "error" | "fatal";
export type BackendPackage =
  | "cache"
  | "controller"
  | "cron_job"
  | "db"
  | "domain"
  | "handler"
  | "repository"
  | "route"
  | "service";
export type FrontendPackage = "api" | "component" | "hook" | "page" | "state" | "style";
export type SharedPackage = "auth" | "config" | "middleware" | "utils";
export type PackageName = BackendPackage | FrontendPackage | SharedPackage;

export interface LogOptions {
  endpoint?: string;
  token?: string;
  getToken?: () => string | Promise<string>;
  timeoutMs?: number;
  allowUnauthenticated?: boolean;
  headers?: Record<string, string>;
}

export interface LogResult {
  ok: boolean;
  status: number;
  data?: unknown;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

export const VALID_LOG_VALUES: {
  stacks: readonly Stack[];
  levels: readonly Level[];
  backendPackages: readonly BackendPackage[];
  frontendPackages: readonly FrontendPackage[];
  sharedPackages: readonly SharedPackage[];
};

export class LogValidationError extends Error {}

export function validateLogPayload(payload: unknown): {
  stack: Stack;
  level: Level;
  package: PackageName;
  message: string;
};

export function Log(
  stack: Stack,
  level: Level,
  packageName: PackageName,
  message: string,
  options?: LogOptions
): Promise<LogResult>;

