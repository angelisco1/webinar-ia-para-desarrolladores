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
})
