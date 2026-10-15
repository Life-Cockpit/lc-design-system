import { McpServer } from 'tmcp';
import { HttpTransport } from '@tmcp/transport-http';
import { ValibotJsonSchemaAdapter } from '@tmcp/adapter-valibot';
import * as v from 'valibot';
import {
  addListAllDocumentationTool,
  addGetDocumentationTool,
  addGetStoryDocumentationTool,
  STORYBOOK_MCP_INSTRUCTIONS,
} from '@storybook/mcp';

const STORYBOOK_URL = process.env.STORYBOOK_URL || 'https://design.life-cockpit.de';

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, mcp-session-id',
};

async function fetchManifest(_request: unknown, path: string) {
  // @storybook/mcp asks for './manifests/…', our own tools for '/manifests/…': resolve both
  // against the Storybook root (plain concatenation only worked through a trailing-dot host).
  const url = new URL(path.replace(/^\.?\//, ''), `${STORYBOOK_URL.replace(/\/+$/, '')}/`).href;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch manifest from ${url}: ${res.status}`);
  }
  return res.text();
}

let cachedComponents: Record<string, unknown> | null = null;

async function getComponentsManifest(): Promise<Record<string, unknown>> {
  if (cachedComponents) return cachedComponents;
  const text = await fetchManifest(undefined, '/manifests/components.json');
  const parsed = JSON.parse(text);
  cachedComponents = parsed.components || {};
  return cachedComponents;
}

let cachedDocs: Record<string, unknown> | null = null;

async function getDocsManifest(): Promise<Record<string, unknown>> {
  if (cachedDocs) return cachedDocs;
  try {
    const text = await fetchManifest(undefined, '/manifests/docs.json');
    const parsed = JSON.parse(text);
    cachedDocs = parsed.docs || {};
  } catch {
    cachedDocs = {};
  }
  return cachedDocs;
}

function formatComponent(comp: Record<string, unknown>): string {
  let text = `## ${comp.name}\n`;
  if (comp.description) text += `\n${comp.description}\n`;
  // `api` holds the full Angular API block since 3.3; `summary` is a one-line description now
  // (manifests from 3.2 and earlier kept the API in `summary`).
  const api = comp.api ?? (comp.reactComponentMeta ? undefined : comp.summary);
  if (api) text += `\n### Props\n\`\`\`typescript\n${api}\n\`\`\`\n`;
  const stories = comp.stories as Array<{ id: string; name: string; snippet?: string }> | undefined;
  if (stories?.length) {
    text += `\n### Stories\n`;
    for (const story of stories) {
      text += `- **${story.name}** (\`${story.id}\`)`;
      if (story.snippet) text += `\n  \`\`\`html\n  ${story.snippet}\n  \`\`\``;
      text += '\n';
    }
  }
  return text;
}

let handler: ((req: Request, context?: Record<string, unknown>) => Promise<Response>) | null = null;

async function getHandler() {
  if (handler) return handler;

  const adapter = new ValibotJsonSchemaAdapter();
  const server = new McpServer(
    { name: 'lc-design-system', version: '1.0.0' },
    {
      adapter,
      instructions:
        STORYBOOK_MCP_INSTRUCTIONS +
        '\n\nTip: Use the `search_component` tool to find a component by name and get its documentation in a single call, instead of listing all components first.',
      capabilities: { tools: { listChanged: true } },
    }
  ).withContext();

  await addListAllDocumentationTool(server);
  await addGetStoryDocumentationTool(server);
  await addGetDocumentationTool(server);

  // Custom search tool: find component + return docs in one call
  server.tool(
    {
      name: 'search_component',
      title: 'Search Component',
      description:
        'Search for a component or documentation entry by name and get its full documentation in a single call. ' +
        'Use this as your FIRST tool when looking for component information — it eliminates the need to list all components first. ' +
        'Accepts a partial or full name (e.g., "button", "card", "modal", "spacing").',
      schema: v.object({
        query: v.pipe(
          v.string(),
          v.description('Component or doc name to search for. Case-insensitive partial matching is supported.')
        ),
      }),
    },
    async (input: { query: string }) => {
      try {
        const [components, docs] = await Promise.all([getComponentsManifest(), getDocsManifest()]);
        const query = input.query.toLowerCase();

        const matchingComponents = Object.values(components).filter((comp: unknown) => {
          const c = comp as Record<string, unknown>;
          const name = String(c.name || '').toLowerCase();
          const id = String(c.id || '').toLowerCase();
          return name.includes(query) || id.includes(query);
        });

        const matchingDocs = Object.values(docs).filter((doc: unknown) => {
          const d = doc as Record<string, unknown>;
          const name = String(d.name || '').toLowerCase();
          const id = String(d.id || '').toLowerCase();
          const title = String(d.title || '').toLowerCase();
          return name.includes(query) || id.includes(query) || title.includes(query);
        });

        if (matchingComponents.length === 0 && matchingDocs.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `No components or docs found matching "${input.query}". Use list-all-documentation to see all available entries.`,
              },
            ],
          };
        }

        const parts: string[] = [];
        for (const comp of matchingComponents) {
          parts.push(formatComponent(comp as Record<string, unknown>));
        }
        for (const doc of matchingDocs) {
          const d = doc as Record<string, unknown>;
          let text = `## ${d.title || d.name}\n`;
          if (d.content) text += `\n${d.content}\n`;
          parts.push(text);
        }

        return { content: [{ type: 'text' as const, text: parts.join('\n---\n\n') }] };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error searching: ${(error as Error).message}` }],
        };
      }
    }
  );

  // Changelog tool: return full or version-filtered changelog
  server.tool(
    {
      name: 'get_changelog',
      title: 'Get Changelog',
      description:
        'Returns the design system changelog. Optionally filter by version. ' +
        'Use this to find out what changed recently, which components are new, or what was fixed.',
      schema: v.object({
        version: v.optional(
          v.pipe(v.string(), v.description('Optional version to filter for, e.g. "1.3.1". Omit to get the full changelog.'))
        ),
      }),
    },
    async (input: { version?: string }) => {
      try {
        const text = await fetchManifest(undefined, '/manifests/CHANGELOG.md');
        if (input.version) {
          const escaped = input.version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(## \\[${escaped}\\][\\s\\S]*?)(?=\\n## \\[|$)`);
          const match = text.match(regex);
          return {
            content: [{
              type: 'text' as const,
              text: match ? match[1].trim() : `No entry found for version ${input.version}.`,
            }],
          };
        }
        return { content: [{ type: 'text' as const, text }] };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error fetching changelog: ${(error as Error).message}` }],
        };
      }
    }
  );

  const transport = new HttpTransport(server, { path: null });
  handler = async (req: Request, context?: Record<string, unknown>) => {
    return transport.respond(req, { manifestProvider: fetchManifest, ...context, request: req });
  };
  return handler;
}

async function readStreamWithTimeout(body: ReadableStream<Uint8Array>, timeoutMs: number): Promise<string> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  const decoder = new TextDecoder();

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Stream read timeout')), timeoutMs)
  );

  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), timeout]);
      if (done) break;
      if (value) chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return chunks.map((c) => decoder.decode(c, { stream: true })).join('') + decoder.decode();
}

export async function lambdaHandler(event: {
  requestContext: { http: { method: string; path: string } };
  headers: Record<string, string>;
  body?: string;
  isBase64Encoded?: boolean;
}) {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  // OPTIONS - CORS preflight
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // GET - SSE streaming is not supported in Lambda (would hang forever)
  if (method === 'GET') {
    return {
      statusCode: 405,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json', Allow: 'POST, DELETE, OPTIONS' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'SSE streaming not supported. Use POST for all requests.' },
        id: null,
      }),
    };
  }

  // DELETE - session cleanup
  if (method === 'DELETE') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  // POST - process MCP request
  const mcpHandler = await getHandler();

  const headers = new Headers(event.headers);
  const body = event.body
    ? event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString()
      : event.body
    : undefined;

  const url = `${STORYBOOK_URL}${path}`;
  const request = new Request(url, { method, headers, body });

  let response: Response;
  try {
    response = await mcpHandler(request, { request });
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32603, message: `Internal error: ${(err as Error).message}` },
        id: null,
      }),
    };
  }

  const responseHeaders: Record<string, string> = { ...CORS_HEADERS };
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });
  // Ensure CORS headers are not overwritten
  Object.assign(responseHeaders, CORS_HEADERS);

  // Read response body - use stream reader with timeout for SSE responses
  let responseBody = '';
  if (response.body) {
    try {
      responseBody = await readStreamWithTimeout(response.body, 25000);
    } catch {
      return {
        statusCode: 504,
        headers: { ...responseHeaders, 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Request processing timed out' },
          id: null,
        }),
      };
    }
  }

  return {
    statusCode: response.status,
    headers: responseHeaders,
    body: responseBody,
  };
}
