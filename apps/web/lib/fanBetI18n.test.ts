import { describe, expect, it } from "vitest";
import { fanBetCopy } from "./fanBetI18n";

describe("fanBetI18n", () => {
  it("zh fan bet slip is fully localized (no EN disclaimer leak)", () => {
    const c = fanBetCopy("zh");
    expect(c.disclaimer).toContain("世界杯");
    expect(c.disclaimer).not.toContain("World Cup nations");
    expect(c.demoTitle).toBe("演示模式");
    expect(c.status.ready_to_bet).toContain("就绪");
    expect(c.clusterDevnet).toBe("开发网");
    expect(c.statusLabel).toBe("状态");
  });
});
