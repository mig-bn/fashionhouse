export type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER' | 'TRUSTED_CLIENT'

export interface User {
  id: string
  email: string
  role: Role
  isActive: boolean
  createdAt: string
}

export interface Customer {
  id: string
  userId: string | null
  firstName: string
  lastName: string
  phone?: string
  birthDate?: string
  addressLine?: string
  city?: string
  state?: string
  postalCode?: string
  country: string
  createdAt: string
}
