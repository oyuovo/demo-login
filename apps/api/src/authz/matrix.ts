import { UserRole } from "@community-gate/contracts";

/**
 * Centralized permission matrix.
 * Returns true if the given role can access the given resource.
 */
export function canAccess(role: UserRole, resource: "A" | "B"): boolean {
  const MATRIX: Record<UserRole, Record<"A" | "B", boolean>> = {
    MEMBER: { A: true, B: false },
    PRIVILEGED: { A: true, B: true },
  };
  return MATRIX[role][resource];
}
