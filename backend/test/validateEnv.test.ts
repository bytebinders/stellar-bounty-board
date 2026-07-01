import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateEnv } from "../src/validation/validateEnv";

vi.mock("../src/logger", () => ({
  logStructured: vi.fn(),
}));

describe("validateEnv", () => {
  const originalEnv = process.env;
  let exitSpy: any;

  beforeEach(() => {
    // Clone environment
    process.env = { ...originalEnv };
    // Spy on process.exit
    exitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit called with ${code}`);
    });
  });

  afterEach(() => {
    // Restore original environment and mocks
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("Production environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      process.env.SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
      process.env.STELLAR_CONTRACT_ID = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4";
      process.env.STELLAR_NETWORK = "testnet";
    });

    it("should not exit when all variables are valid", () => {
      expect(() => validateEnv()).not.toThrow();
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it("should exit with 1 when SOROBAN_RPC_URL is missing", () => {
      delete process.env.SOROBAN_RPC_URL;

      expect(() => validateEnv()).toThrow(/process.exit called with 1/);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("should exit with 1 when SOROBAN_RPC_URL is invalid", () => {
      process.env.SOROBAN_RPC_URL = "invalid-url";

      expect(() => validateEnv()).toThrow(/process.exit called with 1/);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("should exit with 1 when STELLAR_CONTRACT_ID is missing", () => {
      delete process.env.STELLAR_CONTRACT_ID;

      expect(() => validateEnv()).toThrow(/process.exit called with 1/);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("should exit with 1 when STELLAR_CONTRACT_ID is invalid", () => {
      process.env.STELLAR_CONTRACT_ID = "invalid-contract-id";

      expect(() => validateEnv()).toThrow(/process.exit called with 1/);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("should exit with 1 when STELLAR_NETWORK is missing", () => {
      delete process.env.STELLAR_NETWORK;

      expect(() => validateEnv()).toThrow(/process.exit called with 1/);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("should exit with 1 when STELLAR_NETWORK is invalid", () => {
      process.env.STELLAR_NETWORK = "invalid-network";

      expect(() => validateEnv()).toThrow(/process.exit called with 1/);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("Development environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
      // Clear out vars to test defaults
      delete process.env.SOROBAN_RPC_URL;
      delete process.env.STELLAR_CONTRACT_ID;
      delete process.env.STELLAR_NETWORK;
    });

    it("should not call process.exit on missing variables and set defaults", () => {
      expect(() => validateEnv()).not.toThrow();
      expect(exitSpy).not.toHaveBeenCalled();

      expect(process.env.SOROBAN_RPC_URL).toBe("https://soroban-testnet.stellar.org");
      expect(process.env.STELLAR_CONTRACT_ID).toBe("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4");
      expect(process.env.STELLAR_NETWORK).toBe("testnet");
    });

    it("should not call process.exit on invalid variables and fallback to defaults", () => {
      process.env.SOROBAN_RPC_URL = "not-a-url";
      process.env.STELLAR_CONTRACT_ID = "not-a-contract";
      process.env.STELLAR_NETWORK = "not-a-network";

      expect(() => validateEnv()).not.toThrow();
      expect(exitSpy).not.toHaveBeenCalled();

      expect(process.env.SOROBAN_RPC_URL).toBe("https://soroban-testnet.stellar.org");
      expect(process.env.STELLAR_CONTRACT_ID).toBe("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4");
      expect(process.env.STELLAR_NETWORK).toBe("testnet");
    });

    it("should keep user configured values if they are valid", () => {
      process.env.SOROBAN_RPC_URL = "https://custom-rpc.stellar.org";
      process.env.STELLAR_CONTRACT_ID = "CAAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQC526";
      process.env.STELLAR_NETWORK = "futurenet";

      expect(() => validateEnv()).not.toThrow();
      expect(exitSpy).not.toHaveBeenCalled();

      expect(process.env.SOROBAN_RPC_URL).toBe("https://custom-rpc.stellar.org");
      expect(process.env.STELLAR_CONTRACT_ID).toBe("CAAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQC526");
      expect(process.env.STELLAR_NETWORK).toBe("futurenet");
    });
  });
});
