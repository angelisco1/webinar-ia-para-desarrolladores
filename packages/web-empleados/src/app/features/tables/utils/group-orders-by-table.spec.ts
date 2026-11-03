import { groupOrdersByTable } from './group-orders-by-table'
import { Order } from '../../orders/models/order.model'

const order = (id: string, tableId: string | null): Order => ({
  id, restaurantId: 'r1', tableId, clientId: null, createdAt: '2026-11-03T10:00:00.000Z', items: [],
})

describe('groupOrdersByTable', () => {
  it('agrupa por mesa y descarta los pedidos sin mesa', () => {
    const o1 = order('o1', 't1'), o2 = order('o2', 't1'), o3 = order('o3', null)
    expect(groupOrdersByTable([o1, o2, o3])).toEqual({ t1: [o1, o2] })
  })

  it('devuelve un objeto vacío sin pedidos', () => {
    expect(groupOrdersByTable([])).toEqual({})
  })
})
