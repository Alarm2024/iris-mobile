/** Voice and typed input both call this — one path into the assistant handle(). */
export function submitUserCommand(
  raw: string,
  handle: (text: string) => void | Promise<void>,
  clearInput?: () => void,
): boolean {
  const t = raw.trim();
  if (!t) return false;
  clearInput?.();
  void handle(t);
  return true;
}
