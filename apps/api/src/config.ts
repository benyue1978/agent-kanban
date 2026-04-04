function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export interface AppConfig {
  databaseUrl: string;
  port: number;
}

export function getConfig(): AppConfig {
  return {
    databaseUrl: getRequiredEnv("DATABASE_URL"),
    port: Number(process.env.PORT ?? "3000"),
  };
}
