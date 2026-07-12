type Level = "info" | "warn" | "error";

function write(level: Level, msg: string, meta?: Record<string, unknown>) {
  const line = { level, msg, time: new Date().toISOString(), ...meta };
  const out = JSON.stringify(line);
  if (level === "error") console.error(out);
  else if (level === "warn") console.warn(out);
  else console.log(out);
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => write("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => write("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write("error", msg, meta)
};
