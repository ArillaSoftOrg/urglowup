import type { BusinessMemberRole } from "@urglowup/db";

export const ROLE_RANK: Record<BusinessMemberRole, number> = {
  OWNER: 30,
  MANAGER: 20,
  STAFF: 10,
};

export function meetsMinRole(actual: BusinessMemberRole, minimum: BusinessMemberRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[minimum];
}
