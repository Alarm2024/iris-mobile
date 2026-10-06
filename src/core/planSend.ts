// Who and how much, decided before any card is shown. Pure: the caller reads
// the clipboard, the balance and the contacts, and this decides.

import { findAddress, isValidAddress } from "./address";
import { lamportsToSol, solToLamports } from "./amount";
import { Contact, matchContact } from "./contacts";
import type { Recipient } from "./intent";
import { Reply, say } from "./replies";

export type Resolved = { address: string; label: string } | { problem: Reply };

export function resolveRecipient(r: Recipient, contacts: Contact[], clipboardText: string | null): Resolved {
  switch (r.type) {
    case "address":
      return { address: r.address, label: r.address };
    case "clipboard": {
      const address = clipboardText ? findAddress(clipboardText.trim()) : null;
      if (!address) return { problem: say("Your clipboard doesn't hold a Solana address. Copy one first.") };
      return { address, label: address };
    }
    case "contact": {
      const m = matchContact(contacts, r.name);
      if (m.kind === "one") return { address: m.contact.address, label: m.contact.name };
      if (m.kind === "many") return { problem: say(`Did you mean ${m.contacts.map((c) => c.name).join(" or ")}? Say the name again.`) };
      return {
        problem: say(
          `I don't have a contact called “${r.name}”. Save one in Settings, or copy an address and say “send … to clipboard”.`,
          `I don't have a contact called ${r.name}. Save one in Settings, or copy an address and say send to clipboard.`,
        ),
      };
    }
    case "domain":
      return { problem: say(`I can't look up .sol names yet. Save ${r.name} as a contact with its address.`) };
    case "missing":
      return { problem: say("Who should I send it to? Say a saved contact's name, or “to clipboard”.") };
  }
}

export type SendCheck = { ok: true; lamports: bigint; to: string } | { ok: false; reply: Reply };

/** Amount, address, self-send and balance — everything that can refuse a send before the card. */
export function checkSend(amount: string, address: string, me: string, balance: bigint | null, feeLamports: bigint): SendCheck {
  let lamports: bigint;
  try {
    lamports = solToLamports(amount);
  } catch {
    return { ok: false, reply: say("I didn't understand that amount. Try “send 0.01 SOL to Alice”.") };
  }
  if (lamports <= BigInt(0)) return { ok: false, reply: say("The amount has to be more than zero.") };
  if (!isValidAddress(address)) return { ok: false, reply: say("That isn't a valid Solana address.") };
  const to = address;
  if (to === me) return { ok: false, reply: say("That's your own address — nothing to send.") };
  if (balance != null && lamports + feeLamports > balance) {
    return {
      ok: false,
      reply: say(`You have ${lamportsToSol(balance)} SOL — not enough for ${lamportsToSol(lamports)} SOL plus the network fee.`),
    };
  }
  return { ok: true, lamports, to };
}
