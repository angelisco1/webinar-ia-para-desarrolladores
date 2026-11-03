import { describe, it, expect, beforeEach } from 'vitest'
import { TableService } from './table.service.js'
import { MockTableRepository } from '@repositories/mocks/MockTableRepository.js'
import {
    DuplicateTableNumberError,
    InvalidTableCapacityError,
    InvalidTableNumberError,
    InvalidTableStatusError,
    TableNotFoundError,
    TableInUseError,
    TableNotAvailableError
} from '@errors/DomainErrors.js'

describe('TableService.create/update', () => {
    let repo: MockTableRepository
    let service: TableService

    beforeEach(() => {
        repo = new MockTableRepository()
        service = new TableService(repo)
    })

    it('create genera id, estado libre por defecto y guarda', async () => {
        const table = await service.create({ restaurantId: 'r1', number: 1, description: 'Terraza', capacity: 4 })
        expect(table.id).toBeTruthy()
        expect(table.status).toBe('libre')
        expect(table.description).toBe('Terraza')
        expect(await repo.findById(table.id)).not.toBeNull()
    })

    it('create respeta el estado indicado', async () => {
        const table = await service.create({ restaurantId: 'r1', number: 1, capacity: 4, status: ' Reservada ' })
        expect(table.status).toBe('reservada')
        expect(table.description).toBeNull()
    })

    it('create rechaza número duplicado en el restaurante pero no en otro', async () => {
        await service.create({ restaurantId: 'r1', number: 1, capacity: 4 })
        await expect(service.create({ restaurantId: 'r1', number: 1, capacity: 2 })).rejects.toThrow(DuplicateTableNumberError)
        await expect(service.create({ restaurantId: 'r2', number: 1, capacity: 2 })).resolves.toBeTruthy()
    })

    it('create valida capacidad, número y estado', async () => {
        await expect(service.create({ restaurantId: 'r1', number: 1, capacity: 0 })).rejects.toThrow(InvalidTableCapacityError)
        await expect(service.create({ restaurantId: 'r1', number: 0, capacity: 2 })).rejects.toThrow(InvalidTableNumberError)
        await expect(service.create({ restaurantId: 'r1', number: 1, capacity: 2, status: 'xx' })).rejects.toThrow(InvalidTableStatusError)
    })

    it('update de mesa inexistente o de otro restaurante lanza TableNotFoundError', async () => {
        await expect(service.update('r1', 'nope', { number: 1, capacity: 2 })).rejects.toThrow(TableNotFoundError)
        const other = await service.create({ restaurantId: 'r2', number: 1, capacity: 2 })
        await expect(service.update('r1', other.id, { number: 1, capacity: 2 })).rejects.toThrow(TableNotFoundError)
    })

    it('update a un número usado por otra mesa lanza DuplicateTableNumberError', async () => {
        await service.create({ restaurantId: 'r1', number: 1, capacity: 4 })
        const t2 = await service.create({ restaurantId: 'r1', number: 2, capacity: 4 })
        await expect(service.update('r1', t2.id, { number: 1, capacity: 4 })).rejects.toThrow(DuplicateTableNumberError)
    })

    it('update conserva su propio número y actualiza campos', async () => {
        const t = await service.create({ restaurantId: 'r1', number: 1, capacity: 4, status: 'ocupada' })
        const updated = await service.update('r1', t.id, { number: 1, description: 'Nueva', capacity: 6 })
        expect(updated.capacity).toBe(6)
        expect(updated.description).toBe('Nueva')
        expect(updated.status).toBe('ocupada')
        expect(updated.createdAt).toBe(t.createdAt)
    })

    it('update puede cambiar el estado', async () => {
        const t = await service.create({ restaurantId: 'r1', number: 1, capacity: 4 })
        const updated = await service.update('r1', t.id, { number: 1, capacity: 4, status: 'reservada' })
        expect(updated.status).toBe('reservada')
    })
})

describe('TableService lectura, borrado, estado y ocupación', () => {
    let repo: MockTableRepository
    let service: TableService

    beforeEach(() => {
        repo = new MockTableRepository()
        service = new TableService(repo)
    })

    it('list devuelve las mesas del restaurante y getById valida pertenencia', async () => {
        const t = await service.create({ restaurantId: 'r1', number: 1, capacity: 4 })
        await service.create({ restaurantId: 'r2', number: 1, capacity: 4 })
        expect((await service.list('r1')).map(x => x.id)).toEqual([t.id])
        expect((await service.getById('r1', t.id)).id).toBe(t.id)
        await expect(service.getById('r2', t.id)).rejects.toThrow(TableNotFoundError)
        await expect(service.getById('r1', 'nope')).rejects.toThrow(TableNotFoundError)
    })

    it('delete de mesa ocupada lanza TableInUseError', async () => {
        const t = await service.create({ restaurantId: 'r1', number: 1, capacity: 4, status: 'ocupada' })
        await expect(service.delete('r1', t.id)).rejects.toThrow(TableInUseError)
        expect(await repo.findById(t.id)).not.toBeNull()
    })

    it('delete de mesa libre la elimina y de inexistente lanza TableNotFoundError', async () => {
        const t = await service.create({ restaurantId: 'r1', number: 1, capacity: 4 })
        await service.delete('r1', t.id)
        expect(await repo.findById(t.id)).toBeNull()
        await expect(service.delete('r1', t.id)).rejects.toThrow(TableNotFoundError)
    })

    it('changeStatus valida el estado y lo aplica', async () => {
        const t = await service.create({ restaurantId: 'r1', number: 1, capacity: 4 })
        await expect(service.changeStatus('r1', t.id, 'x')).rejects.toThrow(InvalidTableStatusError)
        const changed = await service.changeStatus('r1', t.id, 'Ocupada')
        expect(changed.status).toBe('ocupada')
        expect((await repo.findById(t.id))?.status).toBe('ocupada')
        await expect(service.changeStatus('r1', 'nope', 'libre')).rejects.toThrow(TableNotFoundError)
    })

    it('getAvailable valida guests y filtra', async () => {
        await service.create({ restaurantId: 'r1', number: 1, capacity: 2 })
        await service.create({ restaurantId: 'r1', number: 2, capacity: 4 })
        await expect(service.getAvailable('r1', 0)).rejects.toThrow(InvalidTableCapacityError)
        await expect(service.getAvailable('r1', 1.5)).rejects.toThrow(InvalidTableCapacityError)
        await expect(service.getAvailable('r1', NaN)).rejects.toThrow(InvalidTableCapacityError)
        expect((await service.getAvailable('r1', 3)).map(t => t.number)).toEqual([2])
    })

    it('occupy: libre pasa a ocupada, ocupada o reservada lanza TableNotAvailableError, inexistente TableNotFoundError', async () => {
        const free = await service.create({ restaurantId: 'r1', number: 1, capacity: 4 })
        const reserved = await service.create({ restaurantId: 'r1', number: 2, capacity: 4, status: 'reservada' })
        const occupied = await service.occupy('r1', free.id)
        expect(occupied.status).toBe('ocupada')
        await expect(service.occupy('r1', free.id)).rejects.toThrow(TableNotAvailableError)
        await expect(service.occupy('r1', reserved.id)).rejects.toThrow(TableNotAvailableError)
        await expect(service.occupy('r1', 'nope')).rejects.toThrow(TableNotFoundError)
        await expect(service.occupy('r2', free.id)).rejects.toThrow(TableNotFoundError)
    })
})
