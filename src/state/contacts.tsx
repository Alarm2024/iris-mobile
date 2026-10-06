import AsyncStorage from "@react-native-async-storage/async-storage";
import { PublicKey } from "@solana/web3.js";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Contact, normalizeName } from "../core/contacts";

const KEY = "iris-contacts-v1";

type Ctx = {
  contacts: Contact[];
  add: (name: string, address: string) => string | null;
  remove: (name: string) => void;
};
const ContactsContext = createContext<Ctx>({ contacts: [], add: () => "not ready", remove: () => {} });

export function isValidAddress(address: string): boolean {
  try {
    return new PublicKey(address.trim()).toBase58() === address.trim();
  } catch {
    return false;
  }
}

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setContacts(JSON.parse(raw) as Contact[]))
      .catch(() => {});
  }, []);

  const persist = (next: Contact[]) => {
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
    return next;
  };

  /** Returns an error message, or null when saved. */
  const add = useCallback((name: string, address: string): string | null => {
    const n = name.trim();
    const a = address.trim();
    if (!normalizeName(n)) return "Give the contact a name you can say.";
    if (!isValidAddress(a)) return "That is not a valid Solana address.";
    setContacts((prev) => persist([...prev.filter((c) => normalizeName(c.name) !== normalizeName(n)), { name: n, address: a }]));
    return null;
  }, []);

  const remove = useCallback((name: string) => {
    setContacts((prev) => persist(prev.filter((c) => c.name !== name)));
  }, []);

  const value = useMemo(() => ({ contacts, add, remove }), [contacts, add, remove]);
  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>;
}

export function useContacts() {
  return useContext(ContactsContext);
}
