import { randomUUID } from 'crypto'
import type { Table } from '@models/table.model.js'
import { normalizeTableStatus, validateTableCapacity, validateTableNumber } from '@models/table.model.js'
import type { TableRepository } from '@repositories/table.repository.js'
import { DuplicateTableNumberError, TableInUseError, TableNotAvailableError, TableNotFoundError } from '@errors/DomainErrors.js'

export interface CreateTableRequest {
    restaurantId: string
    number: number
    description?: string | null
    capacity: number
    status?: string
}

export interface UpdateTableRequest {
    number: number
    description?: string | null
    capacity: number
    status?: string
}

export class TableService {
    constructor(private readonly tableRepository: TableRepository) {}

    async create(request: CreateTableRequest): Promise<Table> {
        validateTableNumber(request.number)
        validateTableCapacity(request.capacity)
        const status = request.status === undefined ? 'libre' : normalizeTableStatus(request.status)

        const duplicated = await this.tableRepository.findByRestaurantAndNumber(request.restaurantId, request.number)
        if (duplicated) {
            throw new DuplicateTableNumberError()
        }

        const now = new Date().toISOString()
        const table: Table = {
            id: randomUUID(),
            restaurantId: request.restaurantId,
            number: request.number,
            description: request.description ?? null,
            capacity: request.capacity,
            status,
            createdAt: now,
            updatedAt: now
        }
        await this.tableRepository.save(table)
        return table
    }

    async update(restaurantId: string, tableId: string, request: UpdateTableRequest): Promise<Table> {
        const existing = await this.findOwned(restaurantId, tableId)
        validateTableNumber(request.number)
        validateTableCapacity(request.capacity)
        const status = request.status === undefined ? existing.status : normalizeTableStatus(request.status)

        const sameNumber = await this.tableRepository.findByRestaurantAndNumber(restaurantId, request.number)
        if (sameNumber && sameNumber.id !== existing.id) {
            throw new DuplicateTableNumberError()
        }

        const updated: Table = {
            ...existing,
            number: request.number,
            description: request.description ?? null,
            capacity: request.capacity,
            status,
            updatedAt: new Date().toISOString()
        }
        await this.tableRepository.save(updated)
        return updated
    }

    async list(restaurantId: string): Promise<Table[]> {
        return this.tableRepository.findByRestaurant(restaurantId)
    }

    async getById(restaurantId: string, tableId: string): Promise<Table> {
        return this.findOwned(restaurantId, tableId)
    }

    async delete(restaurantId: string, tableId: string): Promise<void> {
        const table = await this.findOwned(restaurantId, tableId)
        if (table.status === 'ocupada') {
            throw new TableInUseError()
        }
        await this.tableRepository.delete(table.id)
    }

    async changeStatus(restaurantId: string, tableId: string, status: string): Promise<Table> {
        const normalized = normalizeTableStatus(status)
        const table = await this.findOwned(restaurantId, tableId)
        const updated: Table = { ...table, status: normalized, updatedAt: new Date().toISOString() }
        await this.tableRepository.save(updated)
        return updated
    }

    async getAvailable(restaurantId: string, guests: number): Promise<Table[]> {
        validateTableCapacity(guests)
        return this.tableRepository.findAvailable(restaurantId, guests)
    }

    async occupy(restaurantId: string, tableId: string): Promise<Table> {
        const occupied = await this.tableRepository.occupyIfFree(restaurantId, tableId)
        if (!occupied) {
            await this.findOwned(restaurantId, tableId)
            throw new TableNotAvailableError()
        }
        return this.findOwned(restaurantId, tableId)
    }

    private async findOwned(restaurantId: string, tableId: string): Promise<Table> {
        const table = await this.tableRepository.findById(tableId)
        if (!table || table.restaurantId !== restaurantId) {
            throw new TableNotFoundError()
        }
        return table
    }
}
