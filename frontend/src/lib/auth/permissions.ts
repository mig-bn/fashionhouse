import type { Role } from '@/types/user'

export const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 3,
  STAFF: 2,
  CUSTOMER: 1,
}

export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function canManageProducts(role: Role): boolean {
  return role === 'ADMIN' || role === 'STAFF'
}

export function canViewAccounting(role: Role): boolean {
  return role === 'ADMIN'
}

export function canManageOrders(role: Role): boolean {
  return role === 'ADMIN' || role === 'STAFF'
}
