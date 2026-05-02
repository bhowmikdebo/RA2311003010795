import { Log } from "logging_middleware";
import { fetchNotifications } from "./api.js";
import { getTopPriorityNotifications } from "./priority.js";

function readFlag(args, name, fallback) {
  const prefix = `--${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = args.indexOf(`--${name}`);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }

  return fallback;
}

function parseArgs(argv) {
  const limit = Number(readFlag(argv, "limit", 10));
  const page = Number(readFlag(argv, "page", 1));
  const type = readFlag(argv, "type", undefined);

  return {
    limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    type
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const token = process.env.EVALUATION_ACCESS_TOKEN;

  await Log("backend", "info", "handler", "stage 1 priority selection started", { token });

  const fetchLimit = Math.max(100, options.limit * 5);
  const notifications = await fetchNotifications({
    limit: fetchLimit,
    page: options.page,
    type: options.type
  });

  const priorityNotifications = getTopPriorityNotifications(notifications, options.limit);

  await Log(
    "backend",
    "info",
    "handler",
    `stage 1 selected ${priorityNotifications.length} priority notifications`,
    { token }
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        limit: options.limit,
        page: options.page,
        type: options.type || "all",
        count: priorityNotifications.length,
        notifications: priorityNotifications
      },
      null,
      2
    )}\n`
  );
}

main().catch(async (error) => {
  const token = process.env.EVALUATION_ACCESS_TOKEN;
  await Log("backend", "error", "handler", `stage 1 failed: ${error.message}`, { token });
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});

