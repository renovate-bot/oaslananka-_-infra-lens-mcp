FROM node:24-bookworm-slim@sha256:24dc26ef1e3c3690f27ebc4136c9c186c3133b25563ae4d7f0692e4d1fe5db0e AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts \
    && pnpm rebuild better-sqlite3

COPY . .
RUN pnpm run build

FROM node:24-bookworm-slim@sha256:24dc26ef1e3c3690f27ebc4136c9c186c3133b25563ae4d7f0692e4d1fe5db0e

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts \
    && pnpm rebuild better-sqlite3 \
    && pnpm store prune \
    && rm -rf /root/.local/share/pnpm /root/.cache/node \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    && rm -rf /opt/yarn* \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg

COPY --from=build /app/dist ./dist
COPY --from=build /app/LICENSE ./LICENSE
COPY --from=build /app/README.md ./README.md
COPY --from=build /app/CHANGELOG.md ./CHANGELOG.md
COPY --from=build /app/mcp.json ./mcp.json
COPY --from=build /app/server.json ./server.json
COPY --from=build /app/docs ./docs

# Run as non-root.
RUN useradd -m -u 1001 appuser
USER appuser

# Data directory for SQLite.
ENV INFRA_LENS_DB=/home/appuser/.mcp-infra-lens/metrics.db
ENV MCP_TRANSPORT=stdio
RUN mkdir -p /home/appuser/.mcp-infra-lens

CMD ["node", "dist/mcp.js"]
