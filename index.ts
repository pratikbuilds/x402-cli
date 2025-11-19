#!/usr/bin/env bun

import { Command } from "commander";
import { buildUrlWithQueryParams, parseQueryOption } from "./src/utils/url";
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
  .description("Sends a x402 GET Request")
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
        await makeDryRunRequest(finalUrl, {
          method: "GET",
        });
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
        finalUrl,
        "GET"
      );

      // If no payment required (200 response), requirements will be null
      if (!requirements || !solanaOption) {
        return;
      }

      const network = resolveNetwork(solanaOption.network, options.network);
      console.log("Network:", network);
      console.log("Asset:", solanaOption.asset);

      await makePaymentRequest(finalUrl, keypair, network, solanaOption.asset, {
        method: "GET",
      });
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

program
  .command("POST")
  .description("Sends a x402 POST request")
  .argument("<url>", "url to send the request to")
  .option("--keypair <path>", "Path to Solana keypair file")
  .option("--dry-run", "Dry run the request and get the payment payload")
  .option("--network <network>", "Network to use", "solana-mainnet-beta")
  // update the GET request with this function after testing that it works
  .option("--query <key=value>", "Query parameter", parseQueryOption)
  .action(async (url, options) => {
    try {
      console.log("Options", options);
      const finalUrl = buildUrlWithQueryParams(url, options.query);
      if (options.dryRun) {
        await makeDryRunRequest(finalUrl, {
          method: "POST",
        });
        return;
      }
      if (!options.kepair) {
        console.error("Error: --keypair is required when not using --dry-run");
        process.exit(1);
      }

      const keypair = loadKeypair(options.keypair);
      console.log("Wallet:", keypair.publicKey.toString());

      const { requirements, solanaOption } = await fetchPaymentRequirements(
        finalUrl,
        "POST"
      );

      if (!requirements || !solanaOption) {
        return;
      }

      const network = resolveNetwork(solanaOption.network, options.network);
      console.log("Network:", network);
      console.log("Asset:", solanaOption.asset);

      await makePaymentRequest(finalUrl, keypair, network, solanaOption.asset, {
        method: "POST",
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

program.parse();
