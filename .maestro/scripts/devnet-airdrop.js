// Ask the devnet faucet for 1 SOL for this run's throwaway fakewallet address.
// Sets output.airdropSig when the faucet accepts; logs the RPC reply either way.
const res = http.post("https://api.devnet.solana.com", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "requestAirdrop", params: [ADDRESS, 1000000000] }),
});
console.log("devnet faucet " + res.status + ": " + res.body);
try {
  const reply = JSON.parse(res.body);
  if (reply && reply.result) output.airdropSig = reply.result;
} catch (e) {
  // Not JSON (e.g. an HTML rate-limit page): leave output.airdropSig unset.
}
