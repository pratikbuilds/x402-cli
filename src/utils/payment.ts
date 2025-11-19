import { x402PaymentRequiredResponse } from "@faremeter/types/x402";
import axios, { AxiosError } from "axios";
import { DEFAULT_HEADERS } from "./requests";

const NETWORK_MAP: Record<string, string> = {
  "solana-mainnet-beta": "mainnet-beta",
  solana: "mainnet-beta",
  "solana-devnet": "devnet",
};

export interface PaymentOption {
  network: string;
  asset: string;
  payTo: string;
  maxAmountRequired: string;
  scheme: string;
}

export interface PaymentRequirementsResult {
  requirements: ReturnType<typeof x402PaymentRequiredResponse> | null;
  solanaOption: PaymentOption | null;
}

export async function fetchPaymentRequirements(
  url: string,
  method: "GET" | "POST" = "GET",
  data?: any
): Promise<PaymentRequirementsResult> {
  try {
    const headers = {
      ...DEFAULT_HEADERS,
      ...(method === "POST" && data
        ? { "Content-Type": "application/json" }
        : {}),
    };

    if (method === "GET") {
      await axios.get(url, {
        headers,
      });
    } else if (method === "POST") {
      await axios.post(url, data, {
        headers,
      });
    }

    return {
      requirements: null,
      solanaOption: null,
    };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 402) {
      const requirements = x402PaymentRequiredResponse(error.response.data);

      if ("error" in requirements || !("accepts" in requirements)) {
        throw new Error("Invalid payment requirements received");
      }

      const solanaOption = requirements.accepts.find(
        (accept) =>
          accept.network.startsWith("solana") && accept.scheme === "exact"
      );

      return {
        requirements,
        solanaOption: solanaOption || null,
      };
    }

    throw new Error(
      `Failed to fetch payment requirements: ${
        error instanceof AxiosError ? error.message : String(error)
      }`
    );
  }
}

export function resolveNetwork(
  paymentNetwork: string,
  userNetwork?: string
): string {
  if (userNetwork) {
    // Map user-provided network too
    return (
      NETWORK_MAP[userNetwork] ||
      userNetwork.replace("solana-", "") ||
      userNetwork
    );
  }

  return (
    NETWORK_MAP[paymentNetwork] ||
    paymentNetwork.replace("solana-", "") ||
    "devnet"
  );
}
