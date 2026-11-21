import { neon } from "@neondatabase/serverless";

// Client Neon (HTTP, adapté au serverless). Créé à la première utilisation.
// Attention aux types : les colonnes DATE doivent être lues en ::text pour éviter les décalages de fuseau,
// et count(*) doit être converti en ::int.

type NeonClient = ReturnType<typeof neon>;
let client: NeonClient | null = null;

export function getSql(): NeonClient {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL manquant (voir .env.example)");
    client = neon(url);
  }
  return client;
}

/** Requête paramétrée : q`select * from users where id = ${id}` */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function q<T = any>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> {
  const rows = await getSql()(strings, ...values);
  return rows as unknown as T[];
}
