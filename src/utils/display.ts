import type { x402PaymentRequiredResponse } from "@faremeter/types/x402";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  return JSON.stringify(value);
}

export function displayPaymentRequirements(
  payResp: ReturnType<typeof x402PaymentRequiredResponse>
) {
  // Check if it's an error response
  if ("error" in payResp || !("x402Version" in payResp)) {
    console.error("Invalid payment response:", payResp);
    return;
  }

  console.log("\n");
  console.log(
    colorize(
      `═══════════════════════════════════════════════════════════════════`,
      "cyan"
    )
  );
  console.log(
    colorize(
      `  Payment Requirements ${colorize(
        `(x402 v${payResp.x402Version})`,
        "dim"
      )}`,
      "bright"
    )
  );
  console.log(
    colorize(
      `═══════════════════════════════════════════════════════════════════`,
      "cyan"
    )
  );
  console.log("");

  payResp.accepts.forEach((accept, index: number) => {
    console.log(
      colorize(`Payment Option ${index + 1}`, "yellow") +
        colorize(` (${accept.network})`, "dim")
    );
    console.log("");

    console.log(`  ${colorize("Network:", "cyan")}        ${accept.network}`);
    console.log(
      `  ${colorize("Asset:", "cyan")}          ${colorize(
        accept.asset,
        "green"
      )}`
    );
    console.log(
      `  ${colorize("Pay To:", "cyan")}         ${colorize(
        accept.payTo,
        "green"
      )}`
    );
    console.log(
      `  ${colorize("Amount:", "cyan")}         ${colorize(
        accept.maxAmountRequired,
        "yellow"
      )}`
    );
    console.log(`  ${colorize("Scheme:", "cyan")}         ${accept.scheme}`);
    console.log(
      `  ${colorize("Description:", "cyan")}    ${accept.description}`
    );
    console.log(
      `  ${colorize("Resource:", "cyan")}      ${colorize(
        accept.resource,
        "blue"
      )}`
    );
    console.log(
      `  ${colorize("Timeout:", "cyan")}       ${accept.maxTimeoutSeconds}s`
    );

    if (accept.extra && Object.keys(accept.extra).length > 0) {
      console.log("");
      console.log(`  ${colorize("Extra Info:", "magenta")}`);
      Object.entries(accept.extra).forEach(([key, value]) => {
        const displayValue = formatValue(value);
        console.log(
          `    ${colorize(key + ":", "dim")} ${colorize(displayValue, "gray")}`
        );
      });
    }

    // Add separator between options (except for the last one)
    if (index < payResp.accepts.length - 1) {
      console.log("");
      console.log(colorize("─".repeat(60), "dim"));
      console.log("");
    }
  });

  console.log("");
}
