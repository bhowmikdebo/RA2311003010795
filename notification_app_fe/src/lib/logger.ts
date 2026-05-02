import { Log, type FrontendPackage, type Level } from "logging_middleware";

export function appLog(level: Level, packageName: FrontendPackage | "auth" | "config" | "middleware" | "utils", message: string) {
  return Log("frontend", level, packageName, message, {
    endpoint: "/api/log",
    allowUnauthenticated: true,
    timeoutMs: 2500
  });
}

