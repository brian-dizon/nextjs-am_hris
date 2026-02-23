import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTimeStats } from "@/lib/actions/timer-actions";
import { prisma } from "@/lib/prisma";
import { getCachedSession } from "@/lib/auth";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    timeLog: {
      aggregate: vi.fn(),
    },
    timeCorrection: {
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
  default: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
  getCachedSession: vi.fn(),
}));

describe("Timer Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null if no session", async () => {
    (getCachedSession as any).mockResolvedValue(null);
    const result = await getTimeStats();
    expect(result).toBeNull();
  });

  it("should return correct stats when session is present", async () => {
    const mockSession = {
      user: { id: "user-1", role: "EMPLOYEE", organizationId: "org-1" },
    };
    (getCachedSession as any).mockResolvedValue(mockSession);
    
    (prisma.timeLog.aggregate as any).mockResolvedValue({
      _sum: { duration: 3600 }
    });
    
    (prisma.timeCorrection.count as any).mockResolvedValue(2);

    const result = await getTimeStats();

    expect(result).toEqual({
      totalSeconds: 3600,
      pendingCorrections: 2,
    });
    expect(prisma.timeLog.aggregate).toHaveBeenCalled();
  });
});
