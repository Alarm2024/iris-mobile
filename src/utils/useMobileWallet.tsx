import { transact, type Web3MobileWallet } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { Account, useAuthorization } from "./useAuthorization";
import {
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { useCallback, useMemo } from "react";
import { SignInPayload } from "@solana-mobile/mobile-wallet-adapter-protocol";
import { isWalletUserDecline, walletSupportsTransaction, type TxVersionCheckable } from "./walletCapabilities";

async function signAndSendWithOptionalRetry(
  wallet: Web3MobileWallet,
  transaction: Transaction | VersionedTransaction,
  minContextSlot: number,
): Promise<TransactionSignature> {
  const { supported_transaction_versions: versions } = await wallet.getCapabilities();
  if (!walletSupportsTransaction(versions, transaction as TxVersionCheckable)) {
    throw Object.assign(new Error("This wallet only supports legacy transactions."), { code: -2 });
  }
  for (;;) {
    try {
      const signatures = await wallet.signAndSendTransactions({
        transactions: [transaction],
        minContextSlot,
      });
      return signatures[0];
    } catch (error) {
      if (!isWalletUserDecline(error)) throw error;
      // MWA 3: a decline must not tear down the session; the user can approve on the next try.
    }
  }
}

async function signMessageWithOptionalRetry(
  wallet: Web3MobileWallet,
  address: Account["address"],
  message: Uint8Array,
): Promise<Uint8Array> {
  for (;;) {
    try {
      const signedMessages = await wallet.signMessages({
        addresses: [address],
        payloads: [message],
      });
      return signedMessages[0];
    } catch (error) {
      if (!isWalletUserDecline(error)) throw error;
    }
  }
}

export function useMobileWallet() {
  const { authorizeSessionWithSignIn, authorizeSession, deauthorizeSession, forgetAuthorization } =
    useAuthorization();

  const connect = useCallback(async (): Promise<Account> => {
    return await transact(async (wallet) => {
      return await authorizeSession(wallet);
    });
  }, [authorizeSession]);

  const signIn = useCallback(
    async (signInPayload: SignInPayload): Promise<Account> => {
      return await transact(async (wallet) => {
        return await authorizeSessionWithSignIn(wallet, signInPayload);
      });
    },
    [authorizeSessionWithSignIn]
  );

  // Deauthorize in the wallet when it can be reached; forget the token here
  // either way, so "disconnect" never leaves Iris holding an authorization.
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await transact(async (wallet) => {
        await deauthorizeSession(wallet);
      });
    } finally {
      await forgetAuthorization();
    }
  }, [deauthorizeSession, forgetAuthorization]);

  const signAndSendTransaction = useCallback(
    async (
      transaction: Transaction | VersionedTransaction,
      minContextSlot: number,
    ): Promise<TransactionSignature> => {
      return await transact(async (wallet) => {
        await authorizeSession(wallet);
        return await signAndSendWithOptionalRetry(wallet, transaction, minContextSlot);
      });
    },
    [authorizeSession]
  );

  const signMessage = useCallback(
    async (message: Uint8Array): Promise<Uint8Array> => {
      return await transact(async (wallet) => {
        const authResult = await authorizeSession(wallet);
        return await signMessageWithOptionalRetry(wallet, authResult.address, message);
      });
    },
    [authorizeSession]
  );

  return useMemo(
    () => ({
      connect,
      signIn,
      disconnect,
      signAndSendTransaction,
      signMessage,
    }),
    [connect, signIn, disconnect, signAndSendTransaction, signMessage]
  );
}