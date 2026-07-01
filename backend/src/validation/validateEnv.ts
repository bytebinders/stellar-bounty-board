import { logStructured } from "../logger";
import { StrKey } from "@stellar/stellar-sdk";

const DEFAULT_SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
const DEFAULT_STELLAR_NETWORK = "testnet";
const DEFAULT_STELLAR_CONTRACT_ID = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4";

/**
 * Validates critical environment variables for Stellar/Soroban integrations on startup.
 *
 * In production:
 * - Missing or invalid variables will print a critical message and invoke process.exit(1).
 *
 * In development:
 * - Missing or invalid variables will print a warning log and fall back to testnet defaults.
 */
export function validateEnv(): void {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";

  const configSpecs = {
    SOROBAN_RPC_URL: {
      value: process.env.SOROBAN_RPC_URL,
      default: DEFAULT_SOROBAN_RPC_URL,
      validate: (val: string) => {
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      },
      errorMsg: "must be a valid URL (e.g., https://soroban-testnet.stellar.org)",
    },
    STELLAR_CONTRACT_ID: {
      value: process.env.STELLAR_CONTRACT_ID,
      default: DEFAULT_STELLAR_CONTRACT_ID,
      validate: (val: string) => {
        return StrKey.isValidContract(val);
      },
      errorMsg: "must be a valid Stellar contract ID (starts with 'C' and is 56 characters long)",
    },
    STELLAR_NETWORK: {
      value: process.env.STELLAR_NETWORK,
      default: DEFAULT_STELLAR_NETWORK,
      validate: (val: string) => {
        return ["testnet", "mainnet", "futurenet", "standalone"].includes(val.toLowerCase());
      },
      errorMsg: "must be 'testnet', 'mainnet', 'futurenet', or 'standalone'",
    },
  };

  const missingOrInvalid: string[] = [];

  for (const [key, spec] of Object.entries(configSpecs)) {
    const val = spec.value?.trim();

    if (!val) {
      if (isProduction) {
        missingOrInvalid.push(`${key} is missing`);
      } else {
        logStructured("warn", "startup_validation_warning", {
          reason: `missing_${key.toLowerCase()}`,
          environment: nodeEnv,
          message: `${key} environment variable is not configured. Falling back to testnet default: ${spec.default}`,
        });
        process.env[key] = spec.default;
      }
    } else if (!spec.validate(val)) {
      if (isProduction) {
        missingOrInvalid.push(`${key} is invalid (${spec.errorMsg})`);
      } else {
        logStructured("warn", "startup_validation_warning", {
          reason: `invalid_${key.toLowerCase()}`,
          environment: nodeEnv,
          message: `${key} environment variable is invalid (${spec.errorMsg}). Falling back to testnet default: ${spec.default}`,
        });
        process.env[key] = spec.default;
      }
    }
  }

  if (missingOrInvalid.length > 0 && isProduction) {
    const errorDescription = `CRITICAL: Missing or invalid environment variables on startup:\n${missingOrInvalid.map((msg) => `- ${msg}`).join("\n")}`;

    logStructured("error", "startup_validation_failed", {
      reason: "missing_or_invalid_stellar_env_vars",
      environment: nodeEnv,
      details: missingOrInvalid.join(", "),
    });

    console.error(errorDescription);
    process.exit(1);
  }
}
