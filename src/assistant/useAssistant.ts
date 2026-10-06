// The conversation: one utterance in, one reply out. Money only moves from
// `confirm()`, after the card has been shown, and only through the wallet app.

import { PublicKey } from "@solana/web3.js";
import * as Clipboard from "expo-clipboard";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { shortAddress } from "../core/address";
import { lamportsToSol, solToLamports } from "../core/amount";
import { parseIntent } from "../core/intent";
import { checkSend, resolveRecipient } from "../core/planSend";
import { balanceReply, HELP, historyReply, Reply, say, sendPreviewReply, spokenSol } from "../core/replies";
import { explorerTxUrl, Network } from "../config/network";
import { useContacts } from "../state/contacts";
import { useSettings } from "../state/settings";
import { useAuthorization } from "../utils/useAuthorization";
import { useMobileWallet } from "../utils/useMobileWallet";
import { useConnection } from "../wallet/connection";
import { buildTransfer, getBalanceLamports, getRecent, requestAirdrop, TRANSFER_FEE_LAMPORTS } from "../wallet/actions";
import { speak } from "../voice/speak";
import { walletErrorMessage } from "../core/walletErrors";

export type Message = {
  id: number;
  role: "user" | "iris";
  text: string;
  tone?: "normal" | "error" | "success";
  link?: { label: string; url: string };
};

export type PendingSend = {
  lamports: bigint;
  to: string;
  label: string;
  network: Network;
  from: string;
  createdAt: number;
};

const PENDING_TTL_MS = 2 * 60 * 1000;
const MAX_AIRDROP = solToLamports("2");

export function useAssistant() {
  const connection = useConnection();
  const { settings } = useSettings();
  const { contacts } = useContacts();
  const { selectedAccount } = useAuthorization();
  const wallet = useMobileWallet();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<PendingSend | null>(null);
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);

  const push = useCallback((m: Omit<Message, "id">) => {
    setMessages((prev) => [...prev.slice(-60), { ...m, id: nextId.current++ }]);
  }, []);

  const reply = useCallback(
    (r: Reply, extra?: Partial<Message>) => {
      push({ role: "iris", text: r.text, ...extra });
      if (settings.speakReplies) speak(r.speech, settings.speechRate);
    },
    [push, settings.speakReplies, settings.speechRate],
  );

  const refreshBalance = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["balance"] });
  }, [queryClient]);

  const needAccount = useCallback((): PublicKey | null => {
    if (selectedAccount) return selectedAccount.publicKey;
    reply(say("Connect your wallet first — tap Connect wallet at the top."));
    return null;
  }, [selectedAccount, reply]);

  const confirm = useCallback(async () => {
    const p = pending;
    if (!p) {
      reply(say("There's nothing waiting for confirmation."));
      return;
    }
    if (Date.now() - p.createdAt > PENDING_TTL_MS) {
      setPending(null);
      reply(say("That request is more than two minutes old, so I dropped it. Ask again."));
      return;
    }
    if (p.network !== settings.network || selectedAccount?.publicKey.toBase58() !== p.from) {
      setPending(null);
      reply(say("The network or wallet changed since you asked, so I dropped that send. Ask again."));
      return;
    }
    setBusy(true);
    push({ role: "iris", text: "Opening your wallet to approve…" });
    let signature: string | null = null;
    try {
      const from = new PublicKey(p.from);
      const { tx, minContextSlot, blockhash, lastValidBlockHeight } = await buildTransfer(
        connection, from, new PublicKey(p.to), p.lamports,
      );
      signature = await wallet.signAndSendTransaction(tx, minContextSlot);
      setPending(null);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
      const sol = lamportsToSol(p.lamports);
      reply(
        say(`Sent ${sol} SOL to ${p.label === p.to ? shortAddress(p.to) : p.label}. Confirmed on ${p.network}.`,
          `Sent ${spokenSol(sol)}. It's confirmed.`),
        { tone: "success", link: { label: "View on Solana Explorer", url: explorerTxUrl(signature, p.network) } },
      );
    } catch (e) {
      if (signature) {
        reply(say("The wallet sent it, but I couldn't confirm it yet. Check the explorer before trying again."), {
          tone: "error",
          link: { label: "View on Solana Explorer", url: explorerTxUrl(signature, p.network) },
        });
      } else {
        reply(say(walletErrorMessage(e)), { tone: "error" });
      }
    } finally {
      setBusy(false);
      refreshBalance();
    }
  }, [pending, settings.network, selectedAccount, connection, wallet, push, reply, refreshBalance]);

  const cancel = useCallback(() => {
    if (!pending) {
      reply(say("Nothing to cancel."));
      return;
    }
    setPending(null);
    reply(say("Cancelled. Nothing was sent."));
  }, [pending, reply]);

  const handle = useCallback(
    async (text: string) => {
      const said = text.trim();
      if (!said) return;
      push({ role: "user", text: said });
      const intent = parseIntent(said);
      try {
        switch (intent.kind) {
          case "help":
            return reply(HELP);
          case "cancel":
            return cancel();
          case "confirm":
            return await confirm();
          case "address": {
            const me = needAccount();
            if (me) reply(say(`Your address is ${me.toBase58()}`, `Your address ends in ${me.toBase58().slice(-4).split("").join(" ")}.`));
            return;
          }
          case "balance": {
            if (intent.token === "SKR") return reply(say("SKR balances aren't in this build yet. I can read your SOL balance."));
            const me = needAccount();
            if (!me) return;
            setBusy(true);
            const lamports = await getBalanceLamports(connection, me);
            refreshBalance();
            return reply(balanceReply(lamports, settings.network));
          }
          case "history": {
            const me = needAccount();
            if (!me) return;
            setBusy(true);
            const items = await getRecent(connection, me, intent.limit);
            return reply(historyReply(items, settings.network, Math.floor(Date.now() / 1000)));
          }
          case "airdrop": {
            if (settings.network !== "devnet") return reply(say("Airdrops are devnet only. Switch to devnet in Settings."));
            const me = needAccount();
            if (!me) return;
            let lamports: bigint;
            try {
              lamports = solToLamports(intent.amount);
            } catch {
              return reply(say("I didn't understand that amount."));
            }
            if (lamports <= BigInt(0) || lamports > MAX_AIRDROP) return reply(say("The devnet faucet gives 1 or 2 SOL at a time."));
            setBusy(true);
            push({ role: "iris", text: `Asking the devnet faucet for ${lamportsToSol(lamports)} SOL…` });
            try {
              const sig = await requestAirdrop(connection, me, lamports);
              refreshBalance();
              return reply(say(`Airdropped ${lamportsToSol(lamports)} devnet SOL.`), {
                tone: "success",
                link: { label: "View on Solana Explorer", url: explorerTxUrl(sig, "devnet") },
              });
            } catch {
              return reply(say("The devnet faucet said no — it rate-limits often. Try again in a minute, or use faucet.solana.com."), { tone: "error" });
            }
          }
          case "send": {
            if (intent.token === "SKR") return reply(say("SKR transfers aren't in this build yet. I can send SOL."));
            const me = needAccount();
            if (!me) return;
            const clip = intent.recipient.type === "clipboard" ? await Clipboard.getStringAsync() : null;
            const who = resolveRecipient(intent.recipient, contacts, clip);
            if ("problem" in who) return reply(who.problem);
            setBusy(true);
            const balance = await getBalanceLamports(connection, me);
            const check = checkSend(intent.amount, who.address, me.toBase58(), balance, TRANSFER_FEE_LAMPORTS);
            if (!check.ok) return reply(check.reply, { tone: "error" });
            setPending({ lamports: check.lamports, to: check.to, label: who.label, network: settings.network, from: me.toBase58(), createdAt: Date.now() });
            return reply(sendPreviewReply(check.lamports, who.label, check.to, settings.network));
          }
          case "unknown":
            if (intent.reason === "no-amount") return reply(say("How much? Say it like “send 0.01 SOL to Alice”."));
            return reply(
              say(
                "I didn't catch that. Try “what's my balance”, “show my last transactions”, or “send 0.01 SOL to Alice”.",
                "I didn't catch that. Try: what's my balance, or show my last transactions.",
              ),
            );
        }
      } catch (e) {
        reply(say(`I couldn't reach ${settings.network}: ${(e instanceof Error ? e.message : String(e)).slice(0, 120)}`), { tone: "error" });
      } finally {
        setBusy(false);
      }
    },
    [push, reply, cancel, confirm, needAccount, connection, settings.network, refreshBalance, contacts],
  );

  const note = useCallback((text: string, tone: Message["tone"] = "normal") => reply(say(text), { tone }), [reply]);

  return { messages, pending, busy, handle, confirm, cancel, note };
}
