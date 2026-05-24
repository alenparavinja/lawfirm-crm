// config.ts
// Single source of truth for environment variables. Fails fast at startup
// if required vars are missing rather than surfacing cryptic errors later.

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongoUri: required('MONGO_URI'),
  jwtSecret: required('JWT_SECRET'),
  nodeEnv: process.env.NODE_ENV ?? 'production',
};

export default config;
