import { Keypair } from "@solana/web3.js";
import * as fs from "fs";

export function loadKeypair(keypairPath: string): Keypair {
  if (!keypairPath) {
    throw new Error("Keypair path is required");
  }
  if (!fs.existsSync(keypairPath)) {
    throw new Error(`Keypair file not found: ${keypairPath}`);
  }

  try {
    const keypairFile = fs.readFileSync(keypairPath);
    const keypairBytes = new Uint8Array(JSON.parse(keypairFile.toString()));
    const keypair = Keypair.fromSecretKey(keypairBytes);

    return keypair;
  } catch (error) {
    throw new Error(
      `Failed to load keypair: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
