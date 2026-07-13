import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildClaudeAndroidAppIntentUrl,
  buildClaudeCodeCommand,
  buildClaudeConnectorInstallUrl,
  buildClaudeDesktopJson,
  buildCursorDeepLink,
  buildProjectMcpJson,
  CURSOR_DEEPLINK_INSTALL_NAME,
  cursorServerConfig,
  decodeCursorDeepLinkConfig,
  getAgentConnectConfig,
  isAgentConnectEnabled,
  normalizeMcpClientId,
  type AgentConnectConfig,
} from "./agentConnect";

const FIXTURE: AgentConnectConfig = {
  serverName: "natt-pundit",
  mcpUrl: "https://hypernatt.com/mcp-pundit/protocol",
  smitherySlug: null,
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("agentConnect", () => {
  it("buildCursorDeepLink roundtrip", () => {
    const link = buildCursorDeepLink(FIXTURE);
    expect(link.startsWith("cursor://anysphere.cursor-deeplink/mcp/install?")).toBe(true);
    expect(link).toContain(`name=${encodeURIComponent(CURSOR_DEEPLINK_INSTALL_NAME)}`);
    expect(decodeCursorDeepLinkConfig(link)).toEqual(cursorServerConfig(FIXTURE));
  });

  it("buildProjectMcpJson contains server url", () => {
    const json = buildProjectMcpJson(FIXTURE);
    const parsed = JSON.parse(json) as {
      mcpServers: Record<string, { url: string }>;
    };
    expect(parsed.mcpServers["natt-pundit"]?.url).toBe(FIXTURE.mcpUrl);
  });

  it("buildClaudeDesktopJson parses", () => {
    const json = buildClaudeDesktopJson(FIXTURE);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("buildClaudeCodeCommand uses server name and url", () => {
    expect(buildClaudeCodeCommand(FIXTURE)).toBe(
      "claude mcp add --scope user --transport http natt-pundit https://hypernatt.com/mcp-pundit/protocol",
    );
  });

  it("buildClaudeConnectorInstallUrl prefills Anthropic install dialog", () => {
    const url = buildClaudeConnectorInstallUrl(FIXTURE);
    expect(url).toContain("modal=add-custom-connector");
    expect(url).toContain("connectorName=Natt+Pundit");
    expect(url).toContain(
      `connectorUrl=${encodeURIComponent("https://hypernatt.com/mcp-pundit/protocol")}`,
    );
  });

  it("buildClaudeAndroidAppIntentUrl targets Claude Android package", () => {
    const install = buildClaudeConnectorInstallUrl(FIXTURE);
    const intent = buildClaudeAndroidAppIntentUrl(install);
    expect(intent).toContain("intent://claude.ai/customize/connectors");
    expect(intent).toContain("package=com.anthropic.claude");
    expect(intent).toContain("browser_fallback_url=");
  });

  it("getAgentConnectConfig uses env overrides", () => {
    vi.stubEnv("NEXT_PUBLIC_NATT_PUNDIT_MCP_URL", "https://example.com/mcp");
    vi.stubEnv("NEXT_PUBLIC_NATT_PUNDIT_MCP_NAME", "demo");
    vi.stubEnv("NEXT_PUBLIC_SMITHERY_SLUG", "hypernatt/natt-pundit");
    const cfg = getAgentConnectConfig();
    expect(cfg.mcpUrl).toBe("https://example.com/mcp");
    expect(cfg.serverName).toBe("demo");
    expect(cfg.smitherySlug).toBe("hypernatt/natt-pundit");
  });

  it("normalizeMcpClientId maps windsurf to other", () => {
    expect(normalizeMcpClientId("windsurf")).toBe("other");
    expect(normalizeMcpClientId("cursor")).toBe("cursor");
  });

  it("isAgentConnectEnabled respects flag", () => {
    vi.stubEnv("NEXT_PUBLIC_AGENT_CONNECT_ENABLED", "false");
    expect(isAgentConnectEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_AGENT_CONNECT_ENABLED", "true");
    expect(isAgentConnectEnabled()).toBe(true);
  });
});
