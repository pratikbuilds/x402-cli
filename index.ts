import { Command } from "commander";
import axios from "axios";
import { wrapFetchWithPayment } from "x402-fetch";
import { withPaymentInterceptor, type Signer } from "x402-axios";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import fs from "fs";
import os from "os";
import path from "path";

const program = new Command();

program
  .name("x402-cli")
  .description("A CLI to call x402 apis on Solana")
  .version("0.1.0");

program
  .command("GET")
  .description("Sends a Get Request")
  .argument("<url>", "url to send the request to")
  .action(async (url) => {
    const keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");
    const keypairFile = fs.readFileSync(keypairPath);
    const keypairBytes = new Uint8Array(JSON.parse(keypairFile.toString()));

    const signer = (await createKeyPairSignerFromBytes(keypairBytes)) as Signer;
    const protectedFetch = wrapFetchWithPayment(fetch, signer);
    const params = new URLSearchParams({
      inputMint: "So11111111111111111111111111111111111111112", // SOL
      outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
      amount: "1000000000", // 1 SOL (9 decimals)
    });
    const response = await protectedFetch(
      `https://dflow.api.corbits.dev/quote?${params}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    console.log("response", response);
    // const api = withPaymentInterceptor(
    //   axios.create({
    //     baseURL: "https://dflow.api.corbits.dev",
    //   }),
    //   signer
    // );

    // api.get(`/quote?${params}`).then((response) => {
    //   console.log(response.data);
    // });
  });
program.parse();
