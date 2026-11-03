import { describe, it, expect, vi } from 'vitest'
import { TableController } from './table.controller.js'
import type { Table } from '@models/table.model.js'

const table: Table = {
    id: 't1', restaurantId: 'r1', number: 1, description: null, capacity: 4, status: 'libre',
    createdAt: '2026-11-03T10:00:00.000Z', updatedAt: '2026-11-03T10:00:00.000Z'
}

function setup(serviceOverrides: Record<string, any> = {}) {
    const service = {
        create: vi.fn().mockResolvedValue(table),
        update: vi.fn().mockResolvedValue(table),
        list: vi.fn().mockResolvedValue([table]),
        getById: vi.fn().mockResolvedValue(table),
        delete: vi.fn().mockResolvedValue(undefined),
        changeStatus: vi.fn().mockResolvedValue(table),
        getAvailable: vi.fn().mockResolvedValue([table]),
        occupy: vi.fn().mockResolvedValue({ ...table, status: 'ocupada' }),
        ...serviceOverrides
    }
    const controller = new TableController(service as any)
    const json = vi.fn()
    const send = vi.fn()
    const status = vi.fn().mockReturnValue({ json, send })
    const res = { status } as any
    const next = vi.fn()
    return { service, controller, res, status, json, send, next }
}

const req = (extra: Record<string, any> = {}) => ({ params: { restaurantId: 'r1', tableId: 't1' }, body: {}, query: {}, ...extra }) as any

describe('TableController', () => {
    it('create responde 201 con la mesa', async () => {
        const { controller, service, res, status, json, next } = setup()
        await controller.create(req({ body: { number: 1, capacity: 4, description: 'T' } }), res, next)
        expect(service.create).toHaveBeenCalledWith({ restaurantId: 'r1', number: 1, description: 'T', capacity: 4, status: undefined })
        expect(status).toHaveBeenCalledWith(201)
        expect(json).toHaveBeenCalledWith(table)
    })

    it('getAll, getById y update responden 200', async () => {
        const { controller, res, status, json, next } = setup()
        await controller.getAll(req(), res, next)
        expect(json).toHaveBeenLastCalledWith([table])
        await controller.getById(req(), res, next)
        expect(json).toHaveBeenLastCalledWith(table)
        await controller.update(req({ body: { number: 1, capacity: 4 } }), res, next)
        expect(status).toHaveBeenCalledWith(200)
    })

    it('changeStatus pasa el estado del cuerpo', async () => {
        const { controller, service, res, next } = setup()
        await controller.changeStatus(req({ body: { status: 'libre' } }), res, next)
        expect(service.changeStatus).toHaveBeenCalledWith('r1', 't1', 'libre')
    })

    it('occupy responde 200', async () => {
        const { controller, res, status, json, next } = setup()
        await controller.occupy(req(), res, next)
        expect(status).toHaveBeenCalledWith(200)
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ocupada' }))
    })

    it('remove responde 204', async () => {
        const { controller, res, status, send, next } = setup()
        await controller.remove(req(), res, next)
        expect(status).toHaveBeenCalledWith(204)
        expect(send).toHaveBeenCalled()
    })

    it('getAvailable lee guests como número', async () => {
        const { controller, service, res, next } = setup()
        await controller.getAvailable(req({ query: { guests: '4' } }), res, next)
        expect(service.getAvailable).toHaveBeenCalledWith('r1', 4)
    })

    it('getAvailable sin guests pasa NaN al servicio para que valide', async () => {
        const { controller, service, res, next } = setup()
        await controller.getAvailable(req(), res, next)
        expect(service.getAvailable).toHaveBeenCalledWith('r1', NaN)
    })

    it('delega los errores en next', async () => {
        const error = new Error('boom')
        const { controller, res, next } = setup({ occupy: vi.fn().mockRejectedValue(error), delete: vi.fn().mockRejectedValue(error) })
        await controller.occupy(req(), res, next)
        await controller.remove(req(), res, next)
        expect(next).toHaveBeenCalledTimes(2)
        expect(next).toHaveBeenCalledWith(error)
    })
})
