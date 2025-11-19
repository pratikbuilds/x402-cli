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
  const wallet = await createLocalWallet(network, keypair);
  const mint = new PublicKey(asset);

  const paymentHandler = createPaymentHandler(wallet, mint);

  const fetchWithPayer = wrap(fetch, {
    handlers: [paymentHandler],
  });

  try {
    const headers = {
      ...DEFAULT_HEADERS,
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
    };

    const response = await fetchWithPayer(url, {
      method: options?.method || "GET",
      headers,
      body: options?.body,
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("\nError making request:", error);
    process.exit(1);
  }
}
