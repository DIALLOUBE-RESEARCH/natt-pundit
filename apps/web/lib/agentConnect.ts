export type McpClientId = "cursor" | "claude" | "other";

/** Tabs shown in the modal (windsurf removed — use Autre). */
export const AGENT_CONNECT_TABS: McpClientId[] = ["cursor", "claude", "other"];

export type AgentConnectConfig = {
  serverName: string;
  mcpUrl: string;
  smitherySlug: string | null;
};

const DEFAULT_MCP_URL = "https://hypernatt.com/mcp-pundit/protocol";
const DEFAULT_SERVER_NAME = "natt-pundit";

/** Display name in cursor:// deeplink (Home MCP Servers list). */
export const CURSOR_DEEPLINK_INSTALL_NAME = "NattPundit";

/** Human-readable connector name for Claude.ai web (Add custom connector). */
export const CLAUDE_WEB_CONNECTOR_DISPLAY_NAME = "Natt Pundit";

export const CLAUDE_WEB_CONNECTORS_URL = "https://claude.ai/customize/connectors";

/** @deprecated use CLAUDE_WEB_CONNECTORS_URL */
export const CLAUDE_CONNECTOR_MODAL_URL = CLAUDE_WEB_CONNECTORS_URL;

/** Claude Desktop — Developer / MCP config (no deeplink; user pastes JSON). */
export const CLAUDE_DESKTOP_MCP_HELP_URL =
  "https://modelcontextprotocol.io/docs/develop/connect-local-servers";

export const AGENT_CONNECT_CLIENT_STORAGE_KEY = "natt_agent_connect_client";

export function isAgentConnectEnabled(): boolean {
  const value = process.env.NEXT_PUBLIC_AGENT_CONNECT_ENABLED;
  if (value === undefined || value === "") return true;
  return value === "true" || value === "1";
}

/** MCP server deployed (F72N) — default true after prod deploy. */
export function isMcpLive(): boolean {
  const value = process.env.NEXT_PUBLIC_NATT_PUNDIT_MCP_LIVE;
  if (value === undefined || value === "") return true;
  return value === "true" || value === "1";
}

export function getAgentConnectConfig(): AgentConnectConfig {
  const mcpUrl = process.env.NEXT_PUBLIC_NATT_PUNDIT_MCP_URL?.trim() || DEFAULT_MCP_URL;
  if (!mcpUrl.startsWith("https://")) {
    throw new Error("NEXT_PUBLIC_NATT_PUNDIT_MCP_URL must start with https://");
  }
  const serverName =
    process.env.NEXT_PUBLIC_NATT_PUNDIT_MCP_NAME?.trim() || DEFAULT_SERVER_NAME;
  const slugRaw = process.env.NEXT_PUBLIC_SMITHERY_SLUG?.trim();
  const smitherySlug = slugRaw && slugRaw.length > 0 ? slugRaw : null;
  return { serverName, mcpUrl, smitherySlug };
}

/** Inner server object for Cursor deeplink (NOT wrapped in mcpServers). */
export function cursorServerConfig(cfg: AgentConnectConfig): { url: string } {
  return { url: cfg.mcpUrl };
}

function encodeBase64Utf8(text: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(text, "utf8").toString("base64");
  }
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function decodeBase64Utf8(payload: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(payload, "base64").toString("utf8");
  }
  const binary = atob(payload);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Base64 for cursor://...&config= (standard base64, URI-encoded in URL). */
export function buildCursorDeepLink(
  cfg: AgentConnectConfig,
  installName: string = CURSOR_DEEPLINK_INSTALL_NAME,
): string {
  const inner = cursorServerConfig(cfg);
  const payload = encodeBase64Utf8(JSON.stringify(inner));
  const config = encodeURIComponent(payload);
  const name = encodeURIComponent(installName);
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${name}&config=${config}`;
}

export function decodeCursorDeepLinkConfig(deepLink: string): { url: string } {
  const url = new URL(deepLink);
  const configParam = url.searchParams.get("config");
  if (!configParam) {
    throw new Error("missing config param");
  }
  const json = decodeBase64Utf8(decodeURIComponent(configParam));
  return JSON.parse(json) as { url: string };
}

export function buildProjectMcpJson(cfg: AgentConnectConfig): string {
  const snippet = {
    mcpServers: {
      [cfg.serverName]: { url: cfg.mcpUrl },
    },
  };
  return JSON.stringify(snippet, null, 2);
}

export function buildClaudeDesktopJson(cfg: AgentConnectConfig): string {
  return buildProjectMcpJson(cfg);
}

/** One-liner for Claude Code CLI — user scope, HTTP transport, no auth. */
export function buildClaudeCodeCommand(cfg: AgentConnectConfig): string {
  return `claude mcp add --scope user --transport http ${cfg.serverName} ${cfg.mcpUrl}`;
}

export function buildWindsurfJson(cfg: AgentConnectConfig): string {
  const snippet = {
    mcpServers: {
      [cfg.serverName]: {
        url: cfg.mcpUrl,
        serverUrl: cfg.mcpUrl,
      },
    },
  };
  return JSON.stringify(snippet, null, 2);
}

export function buildSmitheryAddCommand(
  cfg: AgentConnectConfig,
  client: "cursor" | "claude",
): string | null {
  if (!cfg.smitherySlug) return null;
  return `npx -y @smithery/cli@latest mcp add ${cfg.smitherySlug} --client ${client}`;
}

export function jsonForClient(cfg: AgentConnectConfig): string {
  return buildProjectMcpJson(cfg);
}

export function normalizeMcpClientId(value: string | null | undefined): McpClientId {
  if (value === "cursor" || value === "claude" || value === "other") return value;
  if (value === "windsurf") return "other";
  return "cursor";
}

export function isMcpClientId(value: string): value is McpClientId {
  return value === "cursor" || value === "claude" || value === "other";
}
