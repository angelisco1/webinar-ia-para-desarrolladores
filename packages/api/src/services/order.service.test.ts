import { describe, it, expect, beforeEach } from 'vitest'
import { OrderService } from './order.service.js'
import { MockOrderRepository } from '@repositories/mocks/MockOrderRepository.js'
import { MockTableRepository } from '@repositories/mocks/MockTableRepository.js'
import type { Order } from '@models/order.model.js'
import { OrderNotFoundError, InvalidOrderStatusError, TableNotFoundError } from '@errors/DomainErrors.js'

describe('OrderService.updateItemStatus', () => {
    let repo: MockOrderRepository
    let service: OrderService
    let testOrder: Order

    beforeEach(async () => {
        repo = new MockOrderRepository()
        service = new OrderService(repo, new MockTableRepository())

        testOrder = {
            id: 'order-1',
            restaurantId: 'rest-1',
            tableId: null,
            clientId: null,
            createdAt: new Date(),
            items: [
                { id: 'item-1', dishId: 'dish-1', quantity: 1, notes: null, status: 'pendiente' }
            ]
        }
        await repo.create(testOrder)
    })

    it('should update the status of an item successfully', async () => {
        await service.updateItemStatus('order-1', 'item-1', 'preparando')
        const updatedItem = testOrder.items[0]!
        expect(updatedItem.status).toBe('preparando')
    })

    it('should throw an error if the order does not exist', async () => {
        await expect(service.updateItemStatus('order-bad', 'item-1', 'preparando'))
            .rejects.toThrow(OrderNotFoundError)
    })

    it('should throw an error if the item does not exist inside the order', async () => {
        await expect(service.updateItemStatus('order-1', 'item-bad', 'preparando'))
            .rejects.toThrow(OrderNotFoundError)
    })

    it('should throw DomainError if status is invalid', async () => {
        await expect(service.updateItemStatus('order-1', 'item-1', 'invalid-status'))
            .rejects.toThrow(InvalidOrderStatusError)
    })
})

describe('OrderService.create con mesa', () => {
    let orderRepo: MockOrderRepository
    let tableRepo: MockTableRepository
    let service: OrderService
    const items = [{ dishId: 'dish-1', quantity: 1, notes: null }]

    beforeEach(async () => {
        orderRepo = new MockOrderRepository()
        tableRepo = new MockTableRepository()
        service = new OrderService(orderRepo, tableRepo)
        const now = new Date().toISOString()
        await tableRepo.save({ id: 't1', restaurantId: 'rest-1', number: 1, description: null, capacity: 4, status: 'ocupada', createdAt: now, updatedAt: now })
    })

    it('lanza TableNotFoundError si la mesa no existe', async () => {
        await expect(service.create({ restaurantId: 'rest-1', tableId: 'nope', clientId: null, items }))
            .rejects.toThrow(TableNotFoundError)
        expect(orderRepo.orders).toHaveLength(0)
    })

    it('lanza TableNotFoundError si la mesa es de otro restaurante', async () => {
        await expect(service.create({ restaurantId: 'rest-2', tableId: 't1', clientId: null, items }))
            .rejects.toThrow(TableNotFoundError)
    })

    it('crea el pedido con una mesa válida', async () => {
        const order = await service.create({ restaurantId: 'rest-1', tableId: 't1', clientId: null, items })
        expect(order.tableId).toBe('t1')
    })

    it('crea el pedido sin mesa', async () => {
        const order = await service.create({ restaurantId: 'rest-1', tableId: null, clientId: null, items })
        expect(order.tableId).toBeNull()
    })
})
