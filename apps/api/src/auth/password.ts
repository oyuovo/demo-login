import { hash, verify } from "argon2";

const ARGON2_OPTIONS = {
  type: 2, // argon2id
  memoryCost: 19456, // ~19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(
  hash: string,
  plain: string
): Promise<boolean> {
  try {
    return await verify(hash, plain);
  } catch {
    return false;
  }
}
