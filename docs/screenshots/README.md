# Screenshots

None yet. These must be taken on a real Android phone (arm64, with Google Play Services for AR), with an APK that includes the AR safety card. The CI emulator cannot show AR.

Save each as PNG, portrait, at the phone's native resolution, with these names:

| File | What it shows |
|---|---|
| `01-ar-card-on-table.png` | **Required.** The safety card standing on a real table, phone at arm's length; network, short address, balance and the three rules readable. |
| `02-surface-highlight.png` | **Required.** The highlighted surface just before the tap that places the card. |
| `03-ar-card-other-angle.png` | The same card from another angle (it turns to face the camera). |
| `04-read-as-text.png` | The "Read as text" view of the same card. |
| `05-camera-permission.png` | The camera permission prompt with Iris's explanation. |
| `06-confirm-card.png` | The confirm card for a voice send ("Send 0.01 SOL to Alice") on Devnet. |

Use a Devnet wallet with test SOL only. Before saving, check that no full address, seed phrase or private key is visible anywhere on the screen (the card shows only the first and last 4 characters).
