import crypto from "node:crypto";

export function saltAndHashPassword(password: unknown, salt: string) {
  return crypto.scryptSync(String(password), salt, 64).toString('utf-8');
}
