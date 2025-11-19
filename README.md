# x402-cli

A command-line interface for interacting with x402 APIs on Solana. This CLI tool enables you to make GET and POST requests to x402-protected endpoints, automatically handling payment requirements using Solana payments.

## Features

- 🔍 **Dry-run mode**: Preview payment requirements without making payments
- 💰 **Automatic payments**: Handle 402 Payment Required responses with Solana payments
- 🌐 **Network support**: Works with Solana mainnet and devnet
- 🔑 **Keypair management**: Use local Solana keypairs for authentication
- 📊 **Query parameters**: Easily add query parameters to requests
- 📤 **POST support**: Make POST requests with optional JSON body
- ⚡ **Built with Bun**: Fast execution using Bun runtime

## Installation

### Prerequisites

- [Bun](https://bun.sh) v1.1.29 or later
- TypeScript ^5.0.0

### Setup

```bash
# Install dependencies
bun install

# Make the CLI executable (optional, for global usage)
chmod +x index.ts
```

## Usage

### Basic GET Request

```bash
bun run index.ts GET <url>
```

### Basic POST Request

```bash
bun run index.ts POST <url>
```

POST requests can optionally include a JSON body:

```bash
bun run index.ts POST <url> --body '{"key": "value"}'
```

### Dry Run (Preview Payment Requirements)

Preview payment requirements without making a payment:

```bash
bun run index.ts GET <url> --dry-run
bun run index.ts POST <url> --dry-run
```

### Making Payments

To make a request that requires payment, provide a Solana keypair:

```bash
bun run index.ts GET <url> --keypair <path-to-keypair.json>
bun run index.ts POST <url> --keypair <path-to-keypair.json>
```

### Query Parameters

Add query parameters using the `--query` option (can be used multiple times):

```bash
bun run index.ts GET <url> --query "key1=value1" --query "key2=value2"
```

### Network Selection

Specify the Solana network to use:

```bash
bun run index.ts GET <url> --keypair <path> --network mainnet-beta
# or
bun run index.ts GET <url> --keypair <path> --network devnet
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

### Example 1: Dry Run

```bash
bun run index.ts GET https://api.example.com/data --dry-run
```

This will show you the payment requirements without making a payment.

### Example 2: Make a Payment Request

```bash
bun run index.ts GET https://api.example.com/data \
  --keypair ~/.config/solana/id.json \
  --network mainnet-beta
```

### Example 3: Request with Query Parameters

```bash
bun run index.ts GET https://api.example.com/search \
  --query "q=solana" \
  --query "limit=10" \
  --keypair ~/.config/solana/id.json
```

### Example 4: Real-world API Request

```bash
bun run index.ts GET https://jupiter.api.corbits.dev/tokens/v2/recent \
  --keypair ~/.config/solana/auth.json
```

### Example 5: POST Request with Body

```bash
bun run index.ts POST https://api.example.com/data \
  --body '{"name": "test", "value": 123}' \
  --keypair ~/.config/solana/id.json
```

### Example 6: POST Request without Body (Dry Run)

```bash
bun run index.ts POST https://api.example.com/data --dry-run
```

POST requests work with or without a body, making them flexible for different API requirements.

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

This project was created using `bun init` and uses Bun as the runtime.

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
