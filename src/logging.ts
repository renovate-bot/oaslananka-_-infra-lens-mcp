type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const REDACTED_KEYS = new Set([
  'password',
  'passwd',
  'privatekey',
  'private_key',
  'passphrase',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'client_secret',
  'api_key',
  'apikey',
  'authorization'
]);

const SECRET_ASSIGNMENT_PATTERN =
  /\b(password|passwd|passphrase|token|access_token|refresh_token|secret|client_secret|api_key|apikey)=([^\s"'&]+)/gi;
const BEARER_PATTERN = /\bauthorization:\s*bearer\s+([^\s"']+)/gi;
const PRIVATE_KEY_PATTERN =
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g;

function redactString(value: string): string {
  return value
    .replace(PRIVATE_KEY_PATTERN, '[REDACTED PRIVATE KEY]')
    .replace(SECRET_ASSIGNMENT_PATTERN, (_match, key: string) => `${key}=[REDACTED]`)
    .replace(BEARER_PATTERN, 'authorization: bearer [REDACTED]');
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry));
  }

  if (typeof value === 'string') {
    return redactString(value);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        REDACTED_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : redactValue(nestedValue)
      ])
    );
  }

  return value;
}

export function redactSecrets<T>(value: T): T {
  return redactValue(value) as T;
}

export function createLogger(component: string) {
  return {
    debug(message: string, context?: Record<string, unknown>) {
      log('debug', component, message, context);
    },
    info(message: string, context?: Record<string, unknown>) {
      log('info', component, message, context);
    },
    warn(message: string, context?: Record<string, unknown>) {
      log('warn', component, message, context);
    },
    error(message: string, context?: Record<string, unknown>) {
      log('error', component, message, context);
    }
  };
}

function log(
  level: LogLevel,
  component: string,
  message: string,
  context?: Record<string, unknown>
) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    component,
    message,
    ...(context ? { context: redactSecrets(context) } : {})
  };

  process.stderr.write(`${JSON.stringify(payload)}\n`);
}
