<!-- 5a4a4515-6989-4e25-af85-06c8254443b9 f2761361-6cb4-4ca2-b958-c6609daf7f80 -->
# x402 CLI Implementation Plan

## Goal

Create a CLI tool with `get` and `post` commands that can:

1. Send HTTP requests to x402 APIs
2. Display payment requirements when receiving 402 status (dry-run mode)
3. Automatically handle payments using Solana keypair (when keypair provided)

## Current State

- Basic GET command exists in `index.ts` (lines 18-63)
- Uses commander.js for CLI parsing
- Has commented-out code showing both `wrapFetchWithPayment` and `withPaymentInterceptor` patterns
- Currently hardcodes keypair path and test URL

## Implementation Steps

### Step 1: Create Keypair Utility Module

**File**: `src/utils/keypair.ts`

**What to do**:

- Create a function `loadKeypair(keypairPath?: string)` that:
  - Takes optional keypair path (defaults to `~/.config/solana/id.json`)
  - Reads the JSON file using `fs.readFileSync`
  - Parses JSON and converts to `Uint8Array`
  - Uses `createKeyPairSignerFromBytes` from `@solana/kit` to create signer
  - Returns the signer as `Signer` type
  - Handles errors (file not found, invalid format) with helpful messages

**Code pattern to follow**:

```typescript
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { type Signer } from "x402-axios";
import fs from "fs";
import path from "path";
import os from "os";

export async function loadKeypair(keypairPath?: string): Promise<Signer> {
  // Default path logic
  // File reading and parsing
  // Error handling
  // Return signer
}
```

**Help**: Look at lines 23-27 in `index.ts` for the existing pattern.

---

### Step 2: Create Payment Requirements Display Module

**File**: `src/utils/payment.ts`

**What to do**:

- Create a function `displayRequirements(requirements: unknown, format: 'json' | 'table')` that:
  - Takes payment requirements (from 402 response) and format preference
  - Validates/parses using `PaymentRequirementsSchema` from `x402/types`
  - If format is 'json': Pretty-print JSON using `JSON.stringify` with 2-space indent
  - If format is 'table': Display in human-readable format showing:
    - Amount
    - Token mint address
    - Recipient address
    - Any other relevant fields from PaymentRequirementsSchema

**Code pattern to follow**:

```typescript
import { PaymentRequirementsSchema } from "x402/types";

export function displayRequirements(requirements: unknown, format: 'json' | 'table'): void {
  // Parse with PaymentRequirementsSchema
  // Format based on format parameter
  // Console.log the formatted output
}
```

**Help**: You'll need to check what fields `PaymentRequirementsSchema` contains. Use the ask agent if needed.

---

### Step 3: Create Request Handler Module

**File**: `src/utils/request.ts`

**What to do**:

- Create a function `sendRequest(options)` that handles both dry-run and payment modes:
  - **Parameters**: 
    - `url: string`
    - `method: 'GET' | 'POST'`
    - `dryRun: boolean`
    - `signer?: Signer` (optional, only when not dry-run)
    - `body?: string` (for POST)
    - `queryParams?: Record<string, string>` (for GET)

  - **Dry-run mode** (`dryRun === true`):
    - Use plain `axios` to send request
    - If response is 200/201: return response data
    - If response is 402: extract payment requirements from response body and throw special error with requirements
    - Handle other errors normally

  - **Payment mode** (`dryRun === false` and signer provided):
    - Use `withPaymentInterceptor(axios.create(), signer)` from `x402-axios`
    - Create axios instance with interceptor
    - Send request (interceptor handles 402 automatically)
    - Return response data

**Code pattern to follow**:

```typescript
import axios from "axios";
import { withPaymentInterceptor, type Signer } from "x402-axios";

export async function sendRequest(options: {
  url: string;
  method: 'GET' | 'POST';
  dryRun: boolean;
  signer?: Signer;
  body?: string;
  queryParams?: Record<string, string>;
}) {
  if (options.dryRun) {
    // Plain axios request
    // Check for 402 status
    // Throw error with requirements if 402
  } else if (options.signer) {
    // Use withPaymentInterceptor
    // Send request
  }
}
```

**Help**: Look at commented code in `index.ts` (lines 53-62) for `withPaymentInterceptor` usage pattern.

---

### Step 4: Refactor GET Command

**File**: `index.ts` (modify existing GET command)

**What to do**:

- Replace the current GET command implementation (lines 18-63)
- Add command options:
  - `--dry-run`: Boolean flag (use `.option('--dry-run', 'description')`)
  - `--keypair <path>`: Optional keypair path (use `.option('--keypair <path>', 'description')`)
  - `--format <json|table>`: Format for requirements (use `.option('--format <type>', 'description', 'table')`)
  - `--query <key=value>`: Query params (use `.option('--query <key=value>', 'description').allowUnknownOption()` or handle multiple)
- In the action handler:
  - Parse options from command
  - Build query params object from `--query` flags
  - If `--dry-run`: Call `sendRequest` with `dryRun: true`, no signer
  - If not `--dry-run` and `--keypair` provided: Load keypair, call `sendRequest` with signer
  - If 402 error: Call `displayRequirements` with the requirements
  - Handle other errors gracefully

**Command structure**:

```typescript
program
  .command("get")
  .description("Send a GET request to an x402 API")
  .argument("<url>", "URL to send request to")
  .option("--dry-run", "Send request without payment, show requirements on 402")
  .option("--keypair <path>", "Path to Solana keypair file")
  .option("--format <type>", "Format for payment requirements", "table")
  .option("--query <key=value>", "Query parameter", (val, prev) => { /* collect */ })
  .action(async (url, options) => {
    // Implementation
  });
```

**Help**: Commander.js docs for handling multiple values: use a custom parser or collect into array.

---

### Step 5: Implement POST Command

**File**: `index.ts` (add new command)

**What to do**:

- Add a new `post` command similar to `get` command
- Add options:
  - `--dry-run`: Same as GET
  - `--keypair <path>`: Same as GET
  - `--format <json|table>`: Same as GET
  - `--body <json>`: JSON string for request body
  - `--file <path>`: Path to JSON file for request body
- In action handler:
  - Validate that either `--body` or `--file` is provided (but not both)
  - Read body from string or file
  - Parse JSON and validate
  - Call `sendRequest` with body
  - Handle 402 and errors same as GET

**Command structure**:

```typescript
program
  .command("post")
  .description("Send a POST request to an x402 API")
  .argument("<url>", "URL to send request to")
  .option("--dry-run", "Send request without payment, show requirements on 402")
  .option("--keypair <path>", "Path to Solana keypair file")
  .option("--format <type>", "Format for payment requirements", "table")
  .option("--body <json>", "Request body as JSON string")
  .option("--file <path>", "Path to JSON file for request body")
  .action(async (url, options) => {
    // Validate body/file options
    // Read and parse body
    // Call sendRequest
  });
```

**Help**: Use `fs.readFileSync` to read file, `JSON.parse` to parse JSON.

---

### Step 6: Add Error Handling

**Files**: All utility files and `index.ts`

**What to do**:

- In `keypair.ts`: Handle file not found, invalid JSON, invalid keypair format
- In `request.ts`: Handle network errors, 402 responses (extract requirements), other HTTP errors
- In `payment.ts`: Handle invalid requirements format
- In `index.ts`: Catch errors from utility functions and display user-friendly messages
- Use try-catch blocks appropriately
- Provide helpful error messages that guide users

**Error types to handle**:

- File not found (keypair)
- Invalid JSON (keypair, body, requirements)
- Network errors (timeout, connection refused)
- 402 Payment Required (extract and display requirements)
- Missing required options (body/file for POST)
- Invalid URLs

---

## Testing Your Implementation

**Test cases to try**:

1. **Dry-run GET with 402**:
   ```bash
   bun run index.ts get https://api.example.com/data --dry-run
   ```


Should show payment requirements if 402.

2. **GET with payment**:
   ```bash
   bun run index.ts get https://api.example.com/data --keypair ~/.config/solana/id.json
   ```


Should automatically handle payment.

3. **POST with body**:
   ```bash
   bun run index.ts post https://api.example.com/data --body '{"key":"value"}' --dry-run
   ```

4. **POST with file**:
   ```bash
   bun run index.ts post https://api.example.com/data --file ./request.json --keypair ~/.config/solana/id.json
   ```


---

## Tips

- Start with Step 1 (keypair utility) and test it independently
- Use TypeScript types from `x402-axios` and `x402/types` packages
- Check existing imports in `index.ts` - you already have most dependencies
- For query params collection in commander, you might need to use `.option().allowUnknownOption()` or collect manually
- When testing, use a real x402 API endpoint that returns 402 to verify behavior
- Use the ask agent if you get stuck on PaymentRequirementsSchema structure, x402 library usage, or how to pass network configuration to `withPaymentInterceptor`
- Network option defaults to 'mainnet' - users can specify 'devnet' for testing

### To-dos

- [ ] Refactor existing GET command to support --no-pay flag and proper 402 handling
- [ ] Create utility modules: request.ts (HTTP handling), payment.ts (requirements display), keypair.ts (signer creation)
- [ ] Implement POST command with body and file options
- [ ] Add 402 response parsing and formatted display (table/JSON)
- [ ] Add comprehensive error handling for network, keypair, and payment errors
- [ ] Update README with command usage examples and documentation