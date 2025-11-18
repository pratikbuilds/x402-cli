import axios, { AxiosError } from "axios";
import { wrap } from "@faremeter/fetch";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import { PublicKey, Keypair } from "@solana/web3.js";
import { createLocalWallet } from "@faremeter/wallet-solana";
import { x402PaymentRequiredResponse } from "@faremeter/types/x402";
import { displayPaymentRequirements } from "./display";

const DEFAULT_HEADERS = {
  Accept: "application/json",
};

export async function makeDryRunRequest(url: string): Promise<void> {
  const startTime = performance.now();

  try {
    const response = await axios.get(url, { headers: DEFAULT_HEADERS });
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
  asset: string
): Promise<void> {
  const wallet = await createLocalWallet(network, keypair);
  const mint = new PublicKey(asset);
  const paymentHandler = createPaymentHandler(wallet, mint);

  const fetchWithPayer = wrap(fetch, {
    handlers: [paymentHandler],
  });

  try {
    const response = await fetchWithPayer(url, {
      method: "GET",
      headers: DEFAULT_HEADERS,
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error making request:", error);
    process.exit(1);
  }
}
