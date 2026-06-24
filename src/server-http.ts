import { createServer } from 'node:http';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import {
  authorizeHttpRequest,
  createProtectedResourceMetadata,
  parseHttpConfig,
  readJsonBodyWithLimit,
  sendJsonError,
  validateHostHeader,
  validateHttpConfiguration,
  validateMcpHttpRequest,
  validateOriginHeader
} from './http-security.js';
import { createLogger } from './logging.js';
import { registerToolsOnServer } from './server-core.js';
import { createHttpShutdownHandler } from './shutdown.js';
import { getPackageVersion } from './version.js';

const logger = createLogger('server-http');

async function createHttpTransport() {
  const server = new McpServer(
    {
      name: 'infra-lens-mcp',
      version: getPackageVersion()
    },
    {
      capabilities: {
        logging: {}
      }
    }
  );
  registerToolsOnServer(server);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  await server.connect(transport);
  return transport;
}

const httpConfig = parseHttpConfig(process.env);
validateHttpConfiguration(httpConfig);
const transport = await createHttpTransport();

const httpServer = createServer((request, response) => {
  void (async () => {
    try {
      if (request.url?.startsWith('/.well-known/oauth-protected-resource')) {
        response.statusCode = 200;
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify(createProtectedResourceMetadata(httpConfig)));
        return;
      }

      const hostDecision = validateHostHeader(request.headers.host, httpConfig);
      if (!hostDecision.ok) {
        sendJsonError(
          response,
          hostDecision.statusCode ?? 400,
          hostDecision.message ?? 'Bad request.'
        );
        return;
      }

      const originDecision = validateOriginHeader(request.headers.origin, httpConfig);
      if (!originDecision.ok) {
        sendJsonError(
          response,
          originDecision.statusCode ?? 403,
          originDecision.message ?? 'Forbidden.'
        );
        return;
      }

      const endpointDecision = validateMcpHttpRequest(request, httpConfig);
      if (!endpointDecision.ok) {
        sendJsonError(
          response,
          endpointDecision.statusCode ?? 400,
          endpointDecision.message ?? 'Bad request.',
          endpointDecision.headers
        );
        return;
      }

      const authDecision = authorizeHttpRequest(request.headers.authorization, httpConfig);
      if (!authDecision.ok) {
        sendJsonError(
          response,
          authDecision.statusCode ?? 401,
          authDecision.message ?? 'Authentication failed.',
          authDecision.headers
        );
        return;
      }

      const parsedBody = await readJsonBodyWithLimit(request, httpConfig.bodyLimitBytes);

      await transport.handleRequest(request, response, parsedBody);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected server error';
      const statusCode = message.includes('too large')
        ? 413
        : message.includes('valid JSON')
          ? 400
          : 500;
      sendJsonError(
        response,
        statusCode,
        statusCode === 500 ? 'Unexpected server error.' : message
      );
    }
  })();
});

httpServer.listen(httpConfig.port, httpConfig.host, () => {
  logger.info(
    `infra-lens-mcp HTTP transport listening on http://${httpConfig.host}:${httpConfig.port}${httpConfig.endpointPath}`
  );
});

const shutdown = createHttpShutdownHandler(httpServer, transport);
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
