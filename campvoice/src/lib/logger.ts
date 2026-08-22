/**
 * Server-side logging.
 *
 * Technical detail belongs in the logs (Vercel → your project → Logs), never in
 * a message shown to a camp director. Keep secrets and personal information out
 * of anything passed here.
 */

type Meta = Record<string, unknown> | undefined;

function serialize(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

export const logger = {
  info(event: string, meta?: Meta) {
    console.log(JSON.stringify({ level: "info", event, ...meta, at: new Date().toISOString() }));
  },
  warn(event: string, meta?: Meta) {
    console.warn(JSON.stringify({ level: "warn", event, ...meta, at: new Date().toISOString() }));
  },
  error(event: string, error: unknown, meta?: Meta) {
    console.error(
      JSON.stringify({ level: "error", event, error: serialize(error), ...meta, at: new Date().toISOString() }),
    );
  },
};
