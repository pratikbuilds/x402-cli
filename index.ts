#!/usr/bin/env node

import { Command } from "commander";
import { buildUrlWithQueryParams, parseQueryOption } from "./src/utils/url.js";
import { loadKeypair } from "./src/utils/keypair.js";
import { makeDryRunRequest, makePaymentRequest } from "./src/utils/requests.js";
import {
  fetchPaymentRequirements,
  resolveNetwork,
} from "./src/utils/payment.js";

const program = new Command();

program
  .name("x402tool")
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
    parseQueryOption
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
  .option("--network <network>", "Network to use")
  .option("--query <key=value>", "Query parameter", parseQueryOption)
  .option("--body <json>", "JSON body for POST request (as JSON string)")
  .action(async (url, options) => {
    try {
      const finalUrl = buildUrlWithQueryParams(url, options.query);

      let bodyData: unknown;
      if (options.body) {
        try {
          bodyData = JSON.parse(options.body);
        } catch (e) {
          console.error("Error: --body must be valid JSON");
          process.exit(1);
        }
      }

      if (options.dryRun) {
        await makeDryRunRequest(finalUrl, {
          method: "POST",
          data: bodyData,
        });
        return;
      }

      if (!options.keypair) {
        console.error("Error: --keypair is required when not using --dry-run");
        process.exit(1);
      }

      const keypair = loadKeypair(options.keypair);
      console.log("Wallet:", keypair.publicKey.toString());

      const { requirements, solanaOption } = await fetchPaymentRequirements(
        finalUrl,
        "POST",
        bodyData
      );

      if (!requirements || !solanaOption) {
        return;
      }

      const network = resolveNetwork(solanaOption.network, options.network);
      console.log("Network:", network);
      console.log("Asset:", solanaOption.asset);

      await makePaymentRequest(finalUrl, keypair, network, solanaOption.asset, {
        method: "POST",
        body: bodyData ? JSON.stringify(bodyData) : undefined,
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
