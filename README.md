# Iris Desk Voice

A native Android voice assistant for your Solana wallet. Hold the mic, say what
you want, check the card, approve in your wallet app.

- **"What's my balance?"** — reads your SOL balance and says it back.
- **"Show my last transactions"** — the last few transfers, in plain words.
- **"Send 0.01 SOL to Alice"** — builds the transfer, shows a confirm card, and
  hands it to your wallet (Phantom, Solflare, any Mobile Wallet Adapter wallet)
  to sign and send.
- **"Airdrop 1 SOL"** — devnet test SOL, for trying it out.

Built for the **Clock In — Solana Mobile Hackathon**. Expo React Native, started
from [`solana-mobile-expo-template`](https://github.com/solana-mobile/solana-mobile-expo-template),
native **Mobile Wallet Adapter** (`@solana-mobile/mobile-wallet-adapter-protocol-web3js`).

## Safety model

- **Iris never holds a key.** Every send is signed in your wallet app over
  Mobile Wallet Adapter. Iris builds one `SystemProgram.transfer` and nothing else.
- **Devnet by default.** Mainnet is a switch in Settings, off unless you turn it
  on, with a warning. Each network has its own wallet authorization.
- **A card before every send:** the amount, the full recipient address, the
  network, the fee. Nothing moves until you tap *Confirm & sign*, and then your
  wallet asks again. A pending send expires after two minutes, or as soon as
  you change the network or wallet.
- **Exact amounts.** SOL is converted to lamports with integer math; "0.01" is
  exactly 10,000,000 lamports.
- **Balance check first.** It won't build a send that the balance plus the fee
  can't cover.

## How voice works (free, no API keys)

- **Speech to text:** Android's own `SpeechRecognizer`, through
  [`expo-speech-recognition`](https://github.com/jamsch/expo-speech-recognition).
  When the phone has an offline model, Iris asks for on-device recognition
  (`requiresOnDeviceRecognition`). Otherwise it uses the system recognizer and
  asks it to prefer offline. If the offline English pack is missing, Iris offers
  to download it. There's no paid speech API and no server of ours.
- **Intent:** deterministic rules in [`src/core/intent.ts`](src/core/intent.ts), with
  no model and no network call, so the same sentence means the same thing every time.
  It reads digits ("0.01") and words ("point zero one", "one and a half",
  "half a sol"), and it treats the recognizer's usual mishearings ("soul",
  "sole") as SOL.
- **Text to speech:** Android TTS via `expo-speech`. It can be turned off and slowed down in Settings.

### Who to send to

Nobody can dictate a 44-character base58 address, so a recipient is one of:

| Say | Iris uses |
|---|---|
| "…to **Alice**" | a contact saved in Settings (tolerates one misheard letter, never guesses between two names) |
| "…to **clipboard**" / "…to the copied address" | the address you copied |
| type or paste an address into the text box | that address |

`.sol` names are recognised but not resolved yet. Iris says so instead of guessing.

## Demo script (about 2 minutes, devnet)

1. Open **Iris Desk Voice**. The header shows **DEVNET**.
2. Tap **Connect wallet**. Phantom or Solflare opens; approve. The address and balance appear.
3. Hold the mic: **"Airdrop 1 SOL."** The reply is spoken and links to the explorer. (The devnet
   faucet rate-limits; if it refuses, use faucet.solana.com.)
4. Hold the mic: **"What's my balance?"** → *"You have 1 SOL on devnet."*
5. Settings → Contacts → save **Alice** with a second devnet address (paste).
6. Hold the mic: **"Send 0.01 SOL to Alice."** The confirm card shows 0.01 SOL, Alice's
   full address, DEVNET, and the fee.
7. Tap **Confirm & sign** → the wallet opens → approve. Iris says *"Sent 0.01 SOL. It's
   confirmed."* and links the transaction.
8. Hold the mic: **"Show my last transactions."** → *"sent 0.01 SOL, just now; received 1 SOL…"*
9. Say **"Send 5 SOL to Alice"**. Iris refuses because the balance can't cover it. Then
   **"Send 0.01 to Alice"** followed by **"Cancel"**: nothing is sent.

## Build and run

Requirements: Node 20, JDK 17, Android SDK (Android Studio), an Android phone or
emulator with a Mobile Wallet Adapter wallet installed.

```bash
npm ci
npm test            # parser, amounts, history, wallet errors, signing plugin
npm run typecheck
npx expo run:android   # generates android/, builds a debug app, starts Metro
```

`android/` is generated (`expo prebuild`) and not committed.

### Release APK

CI (`.github/workflows/ci.yml`) typechecks, tests, bundles the JS and builds a
release APK on every PR. That APK is signed with the debug key and uploaded as a
workflow artifact.

Publishing (`.github/workflows/release.yml`): push a tag such as `v0.1.0`. The
workflow builds the APK, signs it with the release key, checks the signature is
not the debug key, and attaches `iris-desk-voice-v0.1.0.apk` and its `.sha256` to a
GitHub Release.

#### Release signing

The keystore is never committed. The release workflow reads four repository secrets:

| Secret | Value |
|---|---|
| `IRIS_KEYSTORE_BASE64` | `base64 -w0 iris-release.jks` |
| `IRIS_KEYSTORE_PASSWORD` | keystore password |
| `IRIS_KEY_ALIAS` | key alias |
| `IRIS_KEY_PASSWORD` | key password |

[`plugins/withReleaseSigning.js`](plugins/withReleaseSigning.js) adds a release
signing config to the generated `build.gradle` that reads these from the
environment. PR builds have none and fall back to the debug key.

Without the secrets, the release workflow still signs: it makes a one-time key
on the runner, uses it for that build and throws it away. That APK installs,
but no later build can update it in place, so the release notes say "uninstall
this one first". Set the four secrets before you publish anywhere that expects
updates, such as the Solana dApp Store.

To make a key you keep (any machine with Java):

```sh
keytool -genkeypair -keystore iris-release.jks -storetype PKCS12 -alias iris \
  -keyalg RSA -keysize 4096 -validity 10000 -dname "CN=Iris Desk Voice, O=elghaly"
base64 -w0 iris-release.jks   # paste as IRIS_KEYSTORE_BASE64
```

Keep a backup of the keystore. Android only installs an update when it is signed with the same key.

## Layout

```
App.tsx, index.ts            providers + navigation, polyfills first
src/core/                    pure logic with tests: intent, numbers, amounts, contacts, history, replies
src/assistant/useAssistant   utterance → reply; pending send; confirm → wallet
src/voice/                   speech-to-text (hold to talk), text-to-speech
src/wallet/                  RPC reads, transfer builder, devnet airdrop
src/utils/                   Mobile Wallet Adapter authorization (per network), from the template
src/screens/, components/    Voice screen, confirm card, Settings
plugins/withReleaseSigning   release signing from env
```

## Limits

- English (en-US) only.
- Public RPC endpoints, so history on mainnet can be rate-limited.
- SKR balance and transfer are recognised in speech but not in this build. Iris
  says so instead of acting.
- No .sol name resolution yet.

---

Iris Desk Voice shows balances and moves SOL only when you approve it in your
wallet. It gives no financial advice and makes no claims about returns.
