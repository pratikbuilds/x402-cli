#!/usr/bin/env bun

import { Command } from "commander";
import { buildUrlWithQueryParams } from "./src/utils/url";
import { loadKeypair } from "./src/utils/keypair";
import { makeDryRunRequest, makePaymentRequest } from "./src/utils/requests";
import { fetchPaymentRequirements, resolveNetwork } from "./src/utils/payment";
import { displayPaymentRequirements } from "./src/utils/display";

const program = new Command();

program
  .name("x402-cli")
  .description("A CLI to call x402 apis on Solana")
  .version("0.1.0");

program
  .command("GET")
  .description("Sends a Get Request")
  .argument("<url>", "url to send the request to")
  .option("--keypair <path>", "Path to Solana keypair file")
  .option("--dry-run", "Dry run the request and get the payment payload")
  .option("--network <network>", "Network to use")
  .option(
    "--query <key=value>",
    "Query parameter (can be used multiple times)",
    (val, prev: Record<string, string> = {}) => {
      const [key, ...valueParts] = val.split("=");
      if (!key) {
        throw new Error(
          `Invalid query parameter format: ${val}. Use --query key=value`
        );
      }
      const value = valueParts.join("="); // Handle values that contain '='
      prev[key] = value;
      return prev;
    }
  )
  .action(async (url, options) => {
    try {
      const finalUrl = buildUrlWithQueryParams(url, options.query);

      if (options.dryRun) {
        await makeDryRunRequest(finalUrl);
        return;
      }

      // Payment mode - requires keypair
      if (!options.keypair) {
        console.error("Error: --keypair is required when not using --dry-run");
        process.exit(1);
      }

      const keypair = loadKeypair(options.keypair);
      console.log("Wallet:", keypair.publicKey.toString());

      const { requirements, solanaOption } = await fetchPaymentRequirements(
        finalUrl
      );

      // If no payment required (200 response), requirements will be null
      if (!requirements || !solanaOption) {
        return;
      }

      const network = resolveNetwork(solanaOption.network, options.network);
      console.log("Network:", network);
      console.log("Asset:", solanaOption.asset);

      await makePaymentRequest(finalUrl, keypair, network, solanaOption.asset);
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });
program.parse();
