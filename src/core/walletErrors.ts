// Mobile Wallet Adapter failures -> one honest sentence. Every case here
// happens before the wallet broadcasts, so each says nothing was sent.
// (A send that broadcast but did not confirm is handled by the caller.)

export function walletErrorMessage(e: unknown): string {
  const code = (e as { code?: unknown } | null)?.code;
  const msg = e instanceof Error ? e.message : String(e);
  switch (code) {
    case "ERROR_WALLET_NOT_FOUND":
      return "No Mobile Wallet Adapter wallet is installed. Install Phantom or Solflare, then try again.";
    case "ERROR_SESSION_CLOSED":
    case "ERROR_SESSION_TIMEOUT":
      return "The wallet closed before finishing. Nothing was sent.";
    case -1: // ERROR_AUTHORIZATION_FAILED
      return "The wallet didn't authorize Iris. Nothing was sent.";
    case -3: // ERROR_NOT_SIGNED
      return "You declined in the wallet. Nothing was sent.";
    case -4: // ERROR_NOT_SUBMITTED
      return "The wallet signed but couldn't submit it. Nothing was sent.";
    case -2: // ERROR_INVALID_PAYLOADS
      return "The wallet rejected the transaction as invalid. Nothing was sent.";
  }
  if (/declin|reject/i.test(msg)) return "You declined in the wallet. Nothing was sent.";
  return `That didn't go through: ${msg.slice(0, 140)}`;
}
