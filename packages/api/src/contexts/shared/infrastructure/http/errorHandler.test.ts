import { describe, it, expect, vi } from 'vitest'
import { errorHandler } from './errorHandler.js'
import {
    TableNotFoundError,
    DuplicateTableNumberError,
    TableNotAvailableError,
    TableInUseError,
    InvalidTableStatusError
} from '@errors/DomainErrors.js'

function run(err: Error) {
    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    errorHandler(err, {} as any, { status } as any, vi.fn())
    return { status, json }
}

describe('errorHandler (mesas)', () => {
    it.each([
        [new TableNotFoundError(), 404],
        [new DuplicateTableNumberError(), 409],
        [new TableNotAvailableError(), 409],
        [new TableInUseError(), 409],
        [new InvalidTableStatusError(), 400]
    ])('%o devuelve el status esperado', (err, code) => {
        const { status, json } = run(err)
        expect(status).toHaveBeenCalledWith(code)
        expect(json).toHaveBeenCalledWith({ error: err.name, message: err.message })
    })
})
