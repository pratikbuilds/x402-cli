import axios, { AxiosError } from "axios";
import { wrap } from "@faremeter/fetch";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import { PublicKey, Keypair, Connection } from "@solana/web3.js";
import { createLocalWallet } from "@faremeter/wallet-solana";
import { x402PaymentRequiredResponse } from "@faremeter/types/x402";
import { displayPaymentRequirements } from "./display";

export const DEFAULT_HEADERS = {
  Accept: "application/json",
};

export async function makeDryRunRequest(
  url: string,
  options?: {
    method?: "GET" | "POST";
    data?: unknown;
  }
): Promise<void> {
  const startTime = performance.now();

  try {
    const method = options?.method || "GET";
    const headers = {
      ...DEFAULT_HEADERS,
      ...(method === "POST" && options?.data
        ? { "Content-Type": "application/json" }
        : {}),
    };
    const response =
      method === "GET"
        ? await axios.get(url, { headers })
        : await axios.post(url, options?.data, { headers });
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    console.log(JSON.stringify(response.data, null, 2));
    console.log(`\n⏱️  Request completed in ${duration}ms`);
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    if (error instanceof AxiosError) {
      if (error.response?.status === 402) {
        const payResp = x402PaymentRequiredResponse(error.response.data);
        displayPaymentRequirements(payResp);
        console.log(`\n⏱️  Request completed in ${duration}ms`);
      } else {
        console.error("Error:", error.response?.data || error.message);
        console.log(`\n⏱️  Request failed after ${duration}ms`);
        process.exit(1);
      }
    } else {
      console.error("Unexpected error:", error);
      console.log(`\n⏱️  Request failed after ${duration}ms`);
      process.exit(1);
    }
  }
}

export async function makePaymentRequest(
  url: string,
  keypair: Keypair,
  network: string,
  asset: string,
  options?: {
    method?: "GET" | "POST";
    body?: BodyInit | null | undefined;
  }
): Promise<void> {
  console.log("\n[DEBUG] Creating payment handler...");
  console.log("[DEBUG] Network:", network);
  console.log("[DEBUG] Asset (mint):", asset);
  console.log("[DEBUG] Method:", options?.method || "GET");
  console.log("[DEBUG] Has body:", !!options?.body);

  const wallet = await createLocalWallet(network, keypair);
  const mint = new PublicKey(asset);

  console.log("[DEBUG] Wallet public key:", wallet.publicKey.toString());
  console.log("[DEBUG] Mint public key:", mint.toString());

  // Check if wallet has token account for this mint
  try {
    const connection = new Connection(
      network === "mainnet-beta"
        ? "https://api.mainnet-beta.solana.com"
        : network === "devnet"
        ? "https://api.devnet.solana.com"
        : `https://api.${network}.solana.com`
    );

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      wallet.publicKey,
      { mint: mint }
    );

    console.log("[DEBUG] Token accounts found:", tokenAccounts.value.length);
    if (tokenAccounts.value.length > 0) {
      const tokenAccount = tokenAccounts.value[0];
      console.log(
        "[DEBUG] Token account address:",
        tokenAccount.pubkey.toString()
      );
      console.log(
        "[DEBUG] Token balance:",
        tokenAccount.account.data.parsed.info.tokenAmount.uiAmount
      );
      console.log(
        "[DEBUG] Token balance (raw):",
        tokenAccount.account.data.parsed.info.tokenAmount.amount
      );
    } else {
      console.log("[DEBUG] WARNING: No token account found for this mint!");
      console.log(
        "[DEBUG] The wallet may not be able to make payments with this asset."
      );
    }
  } catch (tokenCheckError) {
    console.log(
      "[DEBUG] Could not check token account:",
      tokenCheckError instanceof Error
        ? tokenCheckError.message
        : String(tokenCheckError)
    );
  }

  const paymentHandler = createPaymentHandler(wallet, mint);
  console.log("[DEBUG] Payment handler created");

  const fetchWithPayer = wrap(fetch, {
    handlers: [paymentHandler],
  });

  try {
    const headers = {
      ...DEFAULT_HEADERS,
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
    };

    console.log("[DEBUG] Making request with payment handler...");
    console.log("[DEBUG] URL:", url);
    console.log("[DEBUG] Headers:", JSON.stringify(headers, null, 2));
    console.log("[DEBUG] Body type:", typeof options?.body);
    console.log(
      "[DEBUG] Body length:",
      options?.body ? String(options.body).length : 0
    );

    const response = await fetchWithPayer(url, {
      method: options?.method || "GET",
      headers,
      body: options?.body,
    });

    console.log("[DEBUG] Response status:", response.status);
    console.log("[DEBUG] Response ok:", response.ok);

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("\n[DEBUG] Error details:");
    console.error("[DEBUG] Error type:", error?.constructor?.name);
    console.error(
      "[DEBUG] Error message:",
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof Error && error.stack) {
      console.error("[DEBUG] Stack trace:", error.stack);
    }
    console.error("\nError making request:", error);
    process.exit(1);
  }
}
