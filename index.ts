// Polyfills first: @solana/web3.js needs Buffer and crypto.getRandomValues.
import "./src/polyfills";
import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
