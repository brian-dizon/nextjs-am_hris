import { describe, it, expect, vi, beforeEach } from "vitest";
import { addStaff, getStaffList } from "@/lib/actions/staff-actions";
import { prisma } from "@/lib/prisma";
import { getCachedSession } from "@/lib/auth";

// Mock the dependencies
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    leaveBalance: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
  default: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      admin: {
        createUser: vi.fn(),
      },
    },
  },
  getCachedSession: vi.fn(),
}));

describe("Staff Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStaffList", () => {
    it("should return empty array if no session", async () => {
      (getCachedSession as any).mockResolvedValue(null);
      const result = await getStaffList();
      expect(result).toEqual([]);
    });

    it("should fetch staff list for admin", async () => {
      const mockSession = {
        user: { id: "admin-1", role: "ADMIN", organizationId: "org-1" },
      };
      (getCachedSession as any).mockResolvedValue(mockSession);
      (prisma.user.findMany as any).mockResolvedValue([{ id: "user-1", name: "Employee" }]);

      const result = await getStaffList();
      
      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Employee");
    });
  });

  describe("addStaff", () => {
    it("should throw error if not admin", async () => {
      const mockSession = {
        user: { id: "user-1", role: "EMPLOYEE", organizationId: "org-1" },
      };
      (getCachedSession as any).mockResolvedValue(mockSession);

      await expect(addStaff({
        name: "New Hire",
        email: "new@org.com",
        role: "EMPLOYEE",
      } as any)).rejects.toThrow("Only admins can add staff members.");
    });
  });
});
