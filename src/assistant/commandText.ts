import { parseIntent, type Intent } from "../core/intent";

export type UserCommand = { text: string; intent: Intent };

/** Voice finals and typed commands both enter the assistant through this helper. */
export function userCommandFromText(raw: string): UserCommand | null {
  const text = raw.trim();
  if (!text) return null;
  return { text, intent: parseIntent(text) };
}
