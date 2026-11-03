import { InvalidTableStatusError, InvalidTableNumberError, InvalidTableCapacityError } from '@errors/DomainErrors.js'

export const VALID_TABLE_STATUSES = ['libre', 'ocupada', 'reservada'] as const

export type TableStatusType = typeof VALID_TABLE_STATUSES[number]

export interface Table {
    id: string
    restaurantId: string
    number: number
    description: string | null
    capacity: number
    status: TableStatusType
    createdAt: string
    updatedAt: string
}

export function normalizeTableStatus(value: string): TableStatusType {
    const normalized = typeof value === 'string' ? value.toLowerCase().trim() : ''
    if (!VALID_TABLE_STATUSES.includes(normalized as TableStatusType)) {
        throw new InvalidTableStatusError(`Estado inválido: ${value}. Debe ser uno de: ${VALID_TABLE_STATUSES.join(', ')}`)
    }
    return normalized as TableStatusType
}

export function validateTableNumber(value: number): void {
    if (!Number.isInteger(value) || value < 1) {
        throw new InvalidTableNumberError()
    }
}

export function validateTableCapacity(value: number): void {
    if (!Number.isInteger(value) || value < 1) {
        throw new InvalidTableCapacityError()
    }
}
