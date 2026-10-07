#!/usr/bin/env python3
"""Throwaway devnet wallet for the demo-video workflow.

  demo-wallet.py new            print a new 12-word BIP-39 phrase
  demo-wallet.py address FILE   print the Solana address fakewallet derives from
                                the phrase in FILE (m/44'/501'/0'/0', SLIP-10)
  demo-wallet.py fingerprint FILE
                                print the first 8 hex of sha256(phrase), so
                                runs can be told apart without showing it

Matches fakewallet v2.2.0 (Bip39UseCase.toSeed, Ed25519Slip10UseCase).
Needs: pip install mnemonic cryptography
"""
import hashlib
import hmac
import sys

B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


def b58encode(raw: bytes) -> str:
    n = int.from_bytes(raw, "big")
    out = ""
    while n:
        n, r = divmod(n, 58)
        out = B58[r] + out
    return "1" * (len(raw) - len(raw.lstrip(b"\0"))) + out


def normalize(phrase: str) -> str:
    return " ".join(phrase.strip().lower().split())


def slip10_ed25519(seed: bytes, path: list[int]) -> bytes:
    node = hmac.new(b"ed25519 seed", seed, hashlib.sha512).digest()
    for index in path:
        data = b"\0" + node[:32] + (index | 0x80000000).to_bytes(4, "big")
        node = hmac.new(node[32:], data, hashlib.sha512).digest()
    return node[:32]


def address(phrase: str, account: int = 0) -> str:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
    from mnemonic import Mnemonic

    phrase = normalize(phrase)
    if not Mnemonic("english").check(phrase):
        sys.exit("not a valid BIP-39 phrase")
    seed = hashlib.pbkdf2_hmac("sha512", phrase.encode(), b"mnemonic", 2048)
    private = slip10_ed25519(seed, [44, 501, account, 0])
    public = Ed25519PrivateKey.from_private_bytes(private).public_key()
    return b58encode(public.public_bytes(Encoding.Raw, PublicFormat.Raw))


def main() -> None:
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "new":
        from mnemonic import Mnemonic
        print(Mnemonic("english").generate(128))
    elif cmd in ("address", "fingerprint") and len(sys.argv) == 3:
        phrase = normalize(open(sys.argv[2]).read())
        if cmd == "address":
            print(address(phrase))
        else:
            print(hashlib.sha256(phrase.encode()).hexdigest()[:8])
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
