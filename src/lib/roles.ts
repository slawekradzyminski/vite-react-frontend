type RoleLike = string | { authority?: string };

const normalizeRole = (role: RoleLike) => (
  typeof role === 'string' ? role : role.authority
);

export const hasRole = (roles: unknown, requiredRole: string) => {
  if (!Array.isArray(roles)) {
    return false;
  }

  const acceptedRoles = new Set([requiredRole, `ROLE_${requiredRole}`]);

  return roles.some((role) => {
    const normalizedRole = normalizeRole(role as RoleLike);
    return normalizedRole ? acceptedRoles.has(normalizedRole) : false;
  });
};
