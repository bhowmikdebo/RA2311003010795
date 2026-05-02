const DEFAULT_API_BASE_URL = "http://20.207.122.201/evaluation-service";

const STACKS = Object.freeze(["backend", "frontend"]);
const LEVELS = Object.freeze(["debug", "info", "warn", "error", "fatal"]);
const BACKEND_PACKAGES = Object.freeze([
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service"
]);
const FRONTEND_PACKAGES = Object.freeze(["api", "component", "hook", "page", "state", "style"]);
const SHARED_PACKAGES = Object.freeze(["auth", "config", "middleware", "utils"]);

export const VALID_LOG_VALUES = Object.freeze({
  stacks: STACKS,
  levels: LEVELS,
  backendPackages: BACKEND_PACKAGES,
  frontendPackages: FRONTEND_PACKAGES,
  sharedPackages: SHARED_PACKAGES
});

export class LogValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "LogValidationError";
  }
}

function readEnv(name) {
  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }

  return process.env[name];
}

function normalizeBaseUrl(baseUrl) {
  return (baseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function resolveLogEndpoint(options) {
  if (options.endpoint) {
    return options.endpoint;
  }

  const explicitLogUrl = readEnv("EVALUATION_LOG_URL");
  if (explicitLogUrl) {
    return explicitLogUrl;
  }

  return `${normalizeBaseUrl(readEnv("EVALUATION_API_BASE_URL"))}/logs`;
}

function isRelativeEndpoint(endpoint) {
  return endpoint.startsWith("/") || endpoint.startsWith("./") || endpoint.startsWith("../");
}

function packagesForStack(stack) {
  if (stack === "backend") {
    return new Set([...BACKEND_PACKAGES, ...SHARED_PACKAGES]);
  }

  if (stack === "frontend") {
    return new Set([...FRONTEND_PACKAGES, ...SHARED_PACKAGES]);
  }

  return new Set();
}

function ensureLowercase(value, field) {
  if (typeof value !== "string" || value !== value.toLowerCase()) {
    throw new LogValidationError(`${field} must be a lower-case string`);
  }
}

export function validateLogPayload(payload) {
  const stack = payload?.stack;
  const level = payload?.level;
  const packageName = payload?.package;
  const message = payload?.message;

  ensureLowercase(stack, "stack");
  ensureLowercase(level, "level");
  ensureLowercase(packageName, "package");

  if (!STACKS.includes(stack)) {
    throw new LogValidationError(`invalid stack: ${stack}`);
  }

  if (!LEVELS.includes(level)) {
    throw new LogValidationError(`invalid level: ${level}`);
  }

  if (!packagesForStack(stack).has(packageName)) {
    throw new LogValidationError(`invalid package '${packageName}' for ${stack}`);
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    throw new LogValidationError("message must be a non-empty string");
  }

  return {
    stack,
    level,
    package: packageName,
    message: message.trim()
  };
}

async function resolveToken(options) {
  if (typeof options.token === "string") {
    return options.token;
  }

  if (typeof options.getToken === "function") {
    return options.getToken();
  }

  return readEnv("EVALUATION_ACCESS_TOKEN") || readEnv("NEXT_PUBLIC_EVALUATION_ACCESS_TOKEN");
}

async function readJsonSafely(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function Log(stack, level, packageName, message, options = {}) {
  const payload = validateLogPayload({
    stack,
    level,
    package: packageName,
    message
  });

  if (typeof fetch !== "function") {
    return {
      ok: false,
      status: 0,
      error: "fetch is unavailable in this runtime"
    };
  }

  const endpoint = resolveLogEndpoint(options);
  const token = await resolveToken(options);

  if (!token && !isRelativeEndpoint(endpoint) && !options.allowUnauthenticated) {
    return {
      ok: false,
      status: 0,
      skipped: true,
      reason: "missing_token"
    };
  }

  const headers = {
    "content-type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const controller = typeof AbortController === "function" ? new AbortController() : undefined;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 3000;
  const timeout = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : undefined;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller?.signal
    });

    return {
      ok: response.ok,
      status: response.status,
      data: await readJsonSafely(response)
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

