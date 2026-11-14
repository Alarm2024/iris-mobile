# Ctrl+Space (Expo × ReactVision) — Iris Desk Voice: AR safety card

Draft submission text. Nothing here is posted; Wyndham fills the PENDING lines and submits.

Deadline: Sun 11 Oct, 23:59 PT = **Mon 12 Oct, 06:59 UTC**.

## Title

**Iris Desk Voice — a voice Solana wallet helper with an AR safety card**

## Short description (one line)

Hold the mic and say what you want to do with your Solana wallet; tap the shield and Iris stands a read-only safety card on your table, in AR, before you send anything.

## Problem

People lose crypto to two things that have nothing to do with code: a wrong address and a stranger who asks for the seed phrase. The checks that stop both are simple, but they live in text that people skip, on the same small screen where the send button is.

## Solution

Iris Desk Voice is an Android app that turns speech into wallet actions ("what's my balance", "send 0.01 SOL to Alice") and never signs anything itself: every send shows a confirm card and then goes to the user's own wallet app (Mobile Wallet Adapter) for approval.

For Ctrl+Space we added an **AR safety card**, built with ViroReact:

1. Tap the shield in the top bar.
2. Point the camera at a table or the floor. ARCore finds the surface; tap it.
3. A card stands on the surface where you tapped and turns to face you as you move. It shows:
   - the **network** (Devnet test SOL by default, or Mainnet real SOL);
   - the **wallet** (first 4 and last 4 characters only);
   - the **balance**, read once from the network;
   - the **last three transactions** (amount, sign, how long ago, failed or not);
   - three rules: Iris never asks for your seed phrase; check the first and last 4 characters before you send; every send needs your approval in the wallet app.

It is **read-only**: no signing, no sending, nothing typed. The only new permission is the **camera**, and the camera picture is not recorded or sent. If a value cannot be read, the card says **UNKNOWN** and why, instead of guessing.

On a phone without ARCore, or a build without the AR engine (an x86 emulator), the same card is shown flat on screen, with the reason. "Read as text" shows the same content as plain text for screen readers.

## Target users

- People new to Solana who use a phone wallet and want a second look before sending.
- People who help others with wallets (family, a support desk) and want the rules on the table, literally, while they talk through a send.

## How we built it

- **Expo SDK 52** (React Native 0.76.9), Android, a development/release build (ViroReact does not run in Expo Go).
- **ViroReact `@reactvision/react-viro` 2.43.0**: `ViroARSceneNavigator`, `ViroARScene`, `ViroARPlaneSelector` (horizontal surfaces, tap to place), `ViroNode` with a `billboardY` transform, `ViroFlexView` and `ViroText`. Its peer dependencies are exactly Expo ~52.0.43 and RN 0.76.9, so no SDK upgrade was needed.
- **A small Expo config plugin of our own** (`plugins/withViroAr.js`) instead of the stock one, because the stock plugin replaces the manifest's `<queries>`, which would have dropped the speech-recognition queries that voice input needs. Ours links Viro's Android projects, adds only the camera permission, marks the camera, sensors and OpenGL ES 3 as optional, and registers Viro only where its ARM renderer loads.
- **Solana**: `@solana/web3.js` reads (balance, recent signatures) on Devnet by default; sends go through **Mobile Wallet Adapter** to the user's wallet app.
- **Tests**: the card's content (UNKNOWN cases, signs, rounding, at most three transactions) and the config plugin are unit-tested with Jest; CI type-checks, runs the tests, bundles the JS and builds the Android APK on every pull request.
- **AI assistance**: built with Claude (Anthropic) as a coding assistant; the ReactVision MCP server was used to check component props and validate the AR scene.

## What was built when (honest scope)

- **Before Ctrl+Space:** the app started from [`solana-mobile/solana-mobile-expo-template`](https://github.com/solana-mobile/solana-mobile-expo-template) (MIT).
- **6–7 Oct 2026 (UTC):** Iris Desk Voice v0.1.0: voice input, intent parsing, confirm card, Mobile Wallet Adapter sends, Devnet by default, signed release APK.
- **8 Oct 2026 (UTC):** the AR safety card (this pull request): ViroReact scene, surface placement, card content, config plugin, fallback, tests.

All of it falls inside the Ctrl+Space build week (3–11 Oct).

## Platform

Android (arm64 phone with ARCore for AR; any Android phone for the flat card).

## Links

- Code: https://github.com/Alarm2024/iris-mobile
- AR pull request: PENDING (link to the draft PR)
- APK with the AR card: PENDING (a release built after the PR is merged; v0.1.0 does not have AR)
- Demo video: PENDING (Wyndham, recorded on a real phone)

## Team

Wyndham Heaven (solo).

## Demo script (2–4 min, real Android phone, real room)

Record on the phone itself (screen recording) plus, if possible, a second camera showing the phone and the table. Times are targets.

| Time | What is on screen | What to say | Why it matters |
|---|---|---|---|
| 0:00–0:20 | Iris home screen, DEVNET chip, wallet connected | "This is Iris Desk Voice. It turns what you say into Solana wallet actions, on Devnet by default, and it never holds a key." | Sets the safety model before anything moves. |
| 0:20–0:50 | Hold the mic: "What's my balance?" Iris answers out loud. | "Voice for the everyday questions." | Shows the existing app working. |
| 0:50–1:10 | Tap the shield in the top bar. Camera permission prompt; allow. | "The safety card uses the camera only, to place itself. Nothing is recorded." | The one new permission, explained. |
| 1:10–1:40 | Move the phone over a table; the surface lights up; tap it. The card appears standing on the table. | "ARCore finds the table. I tap, and the card stands where I tapped." | ViroReact plane detection and placement in a real environment. |
| 1:40–2:10 | Walk around the table; the card turns to face the camera. Read the lines out. | "Network: Devnet. Wallet: first and last four characters. Balance and the last three transactions, read from the network. And three rules." | The content is the point: the checks that prevent common losses. |
| 2:10–2:30 | Tap "Read as text". | "The same card as text, for screen readers." | Accessibility; nothing is only in AR. |
| 2:30–3:10 | Back, hold the mic: "Send 0.01 SOL to Alice". Confirm card, then the wallet app asks for approval; approve or cancel. | "Sends still go through the confirm card and then my wallet app. The AR card is read-only." | AR adds a check; it never shortcuts approval. |
| 3:10–3:30 | Back to the shield screen. | "Iris Desk Voice. Built with Expo and ViroReact. The code is on GitHub." | Close. |

## Shot list (for the video and the submission images)

1. The card standing on a real table, phone held at arm's length (main image).
2. The surface highlight just before the tap.
3. The same card from a different angle (it faces the camera).
4. "Read as text" view.
5. The camera permission prompt with Iris's explanation.
6. The confirm card for "Send 0.01 SOL to Alice", then the wallet app's approval screen.

Save stills as described in `docs/screenshots/README.md`.

## Draft social post (Wyndham publishes)

> Built for #Ctrl+Space with @reactvision: Iris Desk Voice now stands a read-only safety card on your table in AR. Network, short address, balance, last three transactions, and the three rules that stop most wallet losses, before you send anything. Expo SDK 52 + ViroReact 2.43, Devnet by default, camera only. Code: https://github.com/Alarm2024/iris-mobile

## Wyndham must do by hand

- Confirm the Ctrl+Space registration (status UNKNOWN here).
- Install an APK that includes this PR on an ARM phone with ARCore, and check the card on a real table.
- Record the demo and take the screenshots in the shot list.
- Submit before Mon 12 Oct, 06:59 UTC, and post the social draft.
