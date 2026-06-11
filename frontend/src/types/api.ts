export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: PageMeta
  error?: ApiError
  timestamp: string
}

export interface PageMeta {
  page: number
  totalPages: number
  totalItems: number
}

export interface ApiError {
  code: string
  message: string
  details?: FieldError[]
}

export interface FieldError {
  field: string
  message: string
}
