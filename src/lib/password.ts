import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_PREFIX = "scrypt";

function createScryptHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${SCRYPT_PREFIX}$${salt}$${hash}`;
}

function verifyScryptPassword(password: string, storedHash: string) {
  const parts = storedHash.includes("$") ? storedHash.split("$") : ["legacy", ...storedHash.split(":")];
  const salt = parts[1];
  const hash = parts[2];
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function hashPassword(password: string) {
  return createScryptHash(password);
}

export async function verifyPassword(password: string, storedHash: string) {
  return verifyScryptPassword(password, storedHash);
}
