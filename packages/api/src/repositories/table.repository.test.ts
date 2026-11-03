import { SqliteTableRepository } from './table.repository.js'
import { Database } from '@config/database.js'
import type { Table } from '@models/table.model.js'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

function makeTable(overrides: Partial<Table> = {}): Table {
    const now = new Date().toISOString()
    return {
        id: 't1',
        restaurantId: 'r1',
        number: 1,
        description: null,
        capacity: 4,
        status: 'libre',
        createdAt: now,
        updatedAt: now,
        ...overrides
    }
}

describe('SqliteTableRepository (Integration)', () => {
    let db: Database
    let repo: SqliteTableRepository

    beforeAll(async () => {
        process.env.NODE_ENV = 'test'
        db = new Database()
        await db.initialize()
        await db.run(
            "INSERT INTO restaurants (id, name, address, email, phone, owner_first_name, owner_last_name, created_at, updated_at) VALUES ('r1','R1','a','e@e.com','1','o','o','x','x'), ('r2','R2','a','e@e.com','1','o','o','x','x')"
        )
        repo = new SqliteTableRepository(db)
    })

    beforeEach(async () => {
        await db.run('DELETE FROM restaurant_tables')
    })

    afterAll(async () => {
        await db.close()
    })

    it('guarda y encuentra una mesa por id', async () => {
        await repo.save(makeTable({ description: 'Terraza' }))
        const found = await repo.findById('t1')
        expect(found).toEqual(expect.objectContaining({ id: 't1', number: 1, description: 'Terraza', capacity: 4, status: 'libre' }))
    })

    it('devuelve null si no existe', async () => {
        expect(await repo.findById('nope')).toBeNull()
    })

    it('actualiza una mesa existente con save', async () => {
        await repo.save(makeTable())
        await repo.save(makeTable({ capacity: 6, status: 'reservada' }))
        const found = await repo.findById('t1')
        expect(found?.capacity).toBe(6)
        expect(found?.status).toBe('reservada')
    })

    it('lista por restaurante ordenadas por número', async () => {
        await repo.save(makeTable({ id: 'a', number: 3 }))
        await repo.save(makeTable({ id: 'b', number: 1 }))
        await repo.save(makeTable({ id: 'c', number: 2, restaurantId: 'r2' }))
        const tables = await repo.findByRestaurant('r1')
        expect(tables.map(t => t.id)).toEqual(['b', 'a'])
    })

    it('busca por restaurante y número', async () => {
        await repo.save(makeTable({ id: 'a', number: 5 }))
        expect((await repo.findByRestaurantAndNumber('r1', 5))?.id).toBe('a')
        expect(await repo.findByRestaurantAndNumber('r2', 5)).toBeNull()
    })

    it('borra una mesa', async () => {
        await repo.save(makeTable())
        await repo.delete('t1')
        expect(await repo.findById('t1')).toBeNull()
    })

    describe('disponibilidad y ocupación', () => {
        it('findAvailable devuelve solo libres con capacidad suficiente ordenadas por capacidad y número', async () => {
            await repo.save(makeTable({ id: 'a', number: 1, capacity: 2 }))
            await repo.save(makeTable({ id: 'b', number: 2, capacity: 6 }))
            await repo.save(makeTable({ id: 'c', number: 3, capacity: 4 }))
            await repo.save(makeTable({ id: 'd', number: 4, capacity: 4, status: 'ocupada' }))
            await repo.save(makeTable({ id: 'e', number: 5, capacity: 4, status: 'reservada' }))
            await repo.save(makeTable({ id: 'f', number: 6, capacity: 4, restaurantId: 'r2' }))
            const available = await repo.findAvailable('r1', 3)
            expect(available.map(t => t.id)).toEqual(['c', 'b'])
        })

        it('occupyIfFree devuelve true la primera vez y false la segunda', async () => {
            await repo.save(makeTable())
            expect(await repo.occupyIfFree('r1', 't1')).toBe(true)
            expect(await repo.occupyIfFree('r1', 't1')).toBe(false)
            expect((await repo.findById('t1'))?.status).toBe('ocupada')
        })

        it('occupyIfFree no afecta a mesas de otro restaurante ni reservadas', async () => {
            await repo.save(makeTable({ id: 'x', number: 1 }))
            await repo.save(makeTable({ id: 'y', number: 2, status: 'reservada' }))
            expect(await repo.occupyIfFree('r2', 'x')).toBe(false)
            expect((await repo.findById('x'))?.status).toBe('libre')
            expect(await repo.occupyIfFree('r1', 'y')).toBe(false)
            expect((await repo.findById('y'))?.status).toBe('reservada')
        })
    })
})
