import { createHash } from "node:crypto";

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Empreinte d'un code de connexion, liée à l'adresse et au secret du serveur. */
export const codeHash = (email: string, code: string) => sha256(`${email}:${code}:${process.env.SESSION_SECRET ?? ""}`);
