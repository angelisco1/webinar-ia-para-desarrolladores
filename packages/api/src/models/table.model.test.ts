import { describe, it, expect } from 'vitest'
import { normalizeTableStatus, validateTableNumber, validateTableCapacity } from './table.model.js'
import { InvalidTableStatusError, InvalidTableNumberError, InvalidTableCapacityError } from '@errors/DomainErrors.js'

describe('table.model', () => {
    it('normaliza el estado', () => {
        expect(normalizeTableStatus(' Libre ')).toBe('libre')
    })

    it('rechaza un estado inválido', () => {
        expect(() => normalizeTableStatus('xx')).toThrow(InvalidTableStatusError)
    })

    it('rechaza un número de mesa inválido', () => {
        expect(() => validateTableNumber(0)).toThrow(InvalidTableNumberError)
        expect(() => validateTableNumber(1.5)).toThrow(InvalidTableNumberError)
        expect(() => validateTableNumber(2)).not.toThrow()
    })

    it('rechaza una capacidad inválida', () => {
        expect(() => validateTableCapacity(1.5)).toThrow(InvalidTableCapacityError)
        expect(() => validateTableCapacity(0)).toThrow(InvalidTableCapacityError)
        expect(() => validateTableCapacity(4)).not.toThrow()
    })
})
