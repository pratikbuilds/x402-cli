# x402tool

[![npm version](https://img.shields.io/npm/v/x402tool.svg)](https://www.npmjs.com/package/x402tool)
[![npm downloads](https://img.shields.io/npm/dm/x402tool.svg)](https://www.npmjs.com/package/x402tool)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A command-line interface for interacting with x402 APIs on Solana. This CLI tool enables you to make GET and POST requests to x402-protected endpoints, automatically handling payment requirements using Solana payments.

## Features

- **Automatic payment handling**: Intercepts 402 Payment Required responses and executes Solana transactions transparently
- **Dry-run mode**: Inspect payment requirements without executing transactions
- **HTTP method support**: GET and POST requests with optional JSON payloads
- **Solana integration**: Mainnet and devnet support with automatic network resolution
- **Query parameter support**: Multiple query parameters via repeated flags

## Installation

### Prerequisites

- Node.js v18.0.0 or later
- npm or yarn

### Install from npm

```bash
npm install -g x402tool
```

Or using yarn:

```bash
yarn global add x402tool
```

### Verify Installation

```bash
x402tool --version
```

## Usage

### Basic GET Request

```bash
x402tool GET <url>
```

### Basic POST Request

```bash
x402tool POST <url>
```

POST requests can optionally include a JSON body:

```bash
x402tool POST <url> --body '{"key": "value"}'
```

### Dry Run (Preview Payment Requirements)

Preview payment requirements without making a payment:

```bash
x402tool GET <url> --dry-run
x402tool POST <url> --dry-run
```

### Making Payments

To make a request that requires payment, provide a Solana keypair:

```bash
x402tool GET <url> --keypair <path-to-keypair.json>
x402tool POST <url> --keypair <path-to-keypair.json>
```

### Query Parameters

Add query parameters using the `--query` option (can be used multiple times):

```bash
x402tool GET <url> --query "key1=value1" --query "key2=value2"
```

### Network Selection

Specify the Solana network to use:

```bash
x402tool GET <url> --keypair <path> --network mainnet-beta
# or
x402tool GET <url> --keypair <path> --network devnet
```

## Command Options

### GET Command

- `<url>` (required): The URL to send the GET request to
- `--keypair <path>`: Path to Solana keypair file (required for payment mode)
- `--dry-run`: Preview payment requirements without making payment
- `--network <network>`: Solana network to use (`mainnet-beta` or `devnet`)
- `--query <key=value>`: Query parameter (can be used multiple times)

### POST Command

- `<url>` (required): The URL to send the POST request to
- `--keypair <path>`: Path to Solana keypair file (required for payment mode)
- `--dry-run`: Preview payment requirements without making payment
- `--network <network>`: Solana network to use (`mainnet-beta` or `devnet`)
- `--query <key=value>`: Query parameter (can be used multiple times)
- `--body <json>`: JSON body for POST request (as JSON string, optional)

## Examples

The following examples demonstrate usage with [Corbits](https://docs.corbits.dev) x402-protected APIs, including Jupiter and Triton RPC endpoints.

### Example 1: Jupiter GET Request (Dry Run)

Preview payment requirements for a Jupiter API request with query parameters:

```bash
x402tool GET "https://jupiter.api.corbits.dev/ultra/v1/order" \
  --dry-run \
  --query inputMint=So11111111111111111111111111111111111111112 \
  --query outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --query amount=20000000 \
  --query taker=YOUR_WALLET_ADDRESS
```

### Example 2: Jupiter GET Request (With Payment)

Make a paid request to Jupiter API:

```bash
x402tool GET https://jupiter.api.corbits.dev/tokens/v2/recent \
  --keypair ~/.config/solana/auth.json
```

### Example 3: Triton RPC POST Request (Dry Run)

Preview payment requirements for a Triton RPC call. See [Triton RPC documentation](https://docs.corbits.dev/api/partners/triton/overview) for details:

```bash
x402tool POST https://triton.api.corbits.dev \
  --dry-run \
  --body '{"jsonrpc":"2.0","id":1,"method":"getBalance","params":["corzHctjX9Wtcrkfxz3Se8zdXqJYCaamWcQA7vwKF7Q"]}'
```

### Example 4: Triton RPC POST Request (With Payment)

Execute a Solana RPC method via Triton with automatic payment:

```bash
x402tool POST https://triton.api.corbits.dev \
  --keypair ~/.config/solana/auth.json \
  --body '{"jsonrpc":"2.0","id":1,"method":"getBalance","params":["corzHctjX9Wtcrkfxz3Se8zdXqJYCaamWcQA7vwKF7Q"]}'
```

## How It Works

1. **Dry Run Mode**: When `--dry-run` is used, the CLI makes a request (GET or POST) and displays payment requirements if a 402 response is received. No payment is made.

2. **Payment Mode**: When a keypair is provided:

   - The CLI fetches payment requirements from the API
   - If a 402 Payment Required response is received, it extracts Solana payment options
   - Automatically creates and submits a Solana payment transaction
   - Retries the original request with payment proof

3. **Network Resolution**: The CLI automatically resolves network names:

   - `solana-mainnet-beta` → `mainnet-beta`
   - `solana-devnet` → `devnet`
   - `solana` → `mainnet-beta`
   - You can override with `--network` option
   - User-provided networks are also automatically mapped if they match known patterns

4. **POST Requests**: POST requests support optional JSON bodies. If no `--body` is provided, the request is sent without a body. This works consistently in both dry-run and payment modes.

## Keypair Format

The keypair file should be a JSON array of numbers (Solana's standard keypair format):

```json
[123,45,67,...]
```

You can generate a keypair using Solana CLI:

```bash
solana-keygen new -o my-keypair.json
```

## Development

### Prerequisites

- Node.js v18.0.0 or later
- npm or yarn
- TypeScript ^5.0.0

### Setup

```bash
# Clone the repository
git clone https://github.com/pratikbuilds/x402-cli.git
cd x402-cli

# Install dependencies
npm install

# Build the project
npm run build
```

### Running Locally

After building, you can run the CLI locally:

```bash
node dist/index.js GET <url>
```

Or use npm link for development:

```bash
npm link
x402tool GET <url>
```

## Contributing

Contributions are welcome! This project is open to contributions from the community. Whether it's bug fixes, new features, documentation improvements, or other enhancements, we appreciate your help in making this CLI tool better.

To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some feature'`)
5. Push to the branch (`git push origin feat/your-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
