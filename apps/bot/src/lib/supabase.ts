function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

const supabaseUrl = requireEnv("SUPABASE_URL");
const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");

export async function supabaseRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(new URL(path, `${supabaseUrl}/rest/v1/`), {
    ...init,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${errorText}`);
  }

  if (response.status === 204) {
    return [] as T;
  }

  return (await response.json()) as T;
}
