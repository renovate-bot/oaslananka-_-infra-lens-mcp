import { describe, expect, it } from '@jest/globals';
import { Readable } from 'node:stream';

import {
  authorizeHttpRequest,
  parseHttpConfig,
  readJsonBodyWithLimit,
  sendJsonError,
  validateHostHeader,
  validateHttpConfiguration,
  validateOriginHeader
} from '../../src/http-security.js';

describe('HTTP security configuration', () => {
  it('allows loopback HTTP without auth for local development', () => {
    const config = parseHttpConfig({
      MCP_HTTP_HOST: '127.0.0.1',
      MCP_HTTP_PORT: '3000',
      MCP_HTTP_AUTH_MODE: 'none'
    });

    expect(() => validateHttpConfiguration(config)).not.toThrow();
  });

  it('fails fast for non-loopback HTTP without a remote-safe authenticated profile', () => {
    const config = parseHttpConfig({
      MCP_HTTP_HOST: '0.0.0.0',
      MCP_HTTP_AUTH_MODE: 'none'
    });

    expect(() => validateHttpConfiguration(config)).toThrow(
      /Non-loopback HTTP requires MCP_PROFILE=remote-safe/
    );
  });

  it('requires allowed origins and allowed hosts when HTTP is exposed beyond loopback', () => {
    const config = parseHttpConfig({
      MCP_HTTP_HOST: '0.0.0.0',
      MCP_PROFILE: 'remote-safe',
      MCP_HTTP_AUTH_MODE: 'bearer',
      MCP_HTTP_BEARER_TOKEN: 'dev-token'
    });

    expect(() => validateHttpConfiguration(config)).toThrow(/MCP_HTTP_ALLOWED_ORIGINS/);
  });

  it('rejects missing or invalid Origin when origin enforcement is enabled', () => {
    const config = parseHttpConfig({
      MCP_HTTP_ALLOWED_ORIGINS: 'https://client.example.com'
    });

    expect(validateOriginHeader(undefined, config)).toEqual({
      ok: false,
      statusCode: 403,
      message: 'Origin is required.'
    });
    expect(validateOriginHeader('https://evil.example.com', config)).toEqual({
      ok: false,
      statusCode: 403,
      message: 'Origin is not allowed.'
    });
    expect(validateOriginHeader('https://client.example.com', config)).toEqual({ ok: true });
  });

  it('rejects missing or invalid Host when a host allowlist is configured', () => {
    const config = parseHttpConfig({
      MCP_HTTP_ALLOWED_HOSTS: 'mcp.example.com,localhost:3000'
    });

    expect(validateHostHeader(undefined, config)).toEqual({
      ok: false,
      statusCode: 400,
      message: 'Host is required.'
    });
    expect(validateHostHeader('evil.example.com', config)).toEqual({
      ok: false,
      statusCode: 403,
      message: 'Host is not allowed.'
    });
    expect(validateHostHeader('mcp.example.com', config)).toEqual({ ok: true });
    expect(validateHostHeader('localhost:3000', config)).toEqual({ ok: true });
  });

  it('accepts and rejects bearer authentication deterministically', () => {
    const config = parseHttpConfig({
      MCP_HTTP_AUTH_MODE: 'bearer',
      MCP_HTTP_BEARER_TOKEN: 'expected-token'
    });

    expect(authorizeHttpRequest(undefined, config)).toMatchObject({
      ok: false,
      statusCode: 401,
      message: 'Authentication is required.'
    });
    expect(authorizeHttpRequest('Bearer wrong-token', config)).toMatchObject({
      ok: false,
      statusCode: 401,
      message: 'Authentication is invalid.'
    });
    expect(authorizeHttpRequest('Bearer expected-token', config)).toEqual({ ok: true });
  });

  it('rejects oversized JSON bodies before parsing', async () => {
    const request = Readable.from([Buffer.from('{"payload":"too large"}')]);

    await expect(readJsonBodyWithLimit(request as never, 8)).rejects.toThrow(
      'Request body is too large.'
    );
  });

  it('sends sanitized JSON errors without stack traces', () => {
    const response = {
      statusCode: 0,
      headers: {} as Record<string, string>,
      body: '',
      setHeader(key: string, value: string) {
        this.headers[key] = value;
      },
      end(body: string) {
        this.body = body;
      }
    };

    sendJsonError(response as never, 500, 'Unexpected server error.');

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe('{"error":"Unexpected server error."}');
    expect(response.body).not.toContain('stack');
  });
});
