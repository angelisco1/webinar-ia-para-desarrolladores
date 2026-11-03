import { Order } from '../../orders/models/order.model'

export function groupOrdersByTable(orders: Order[]): Record<string, Order[]> {
  const grouped: Record<string, Order[]> = {}
  for (const order of orders) {
    if (!order.tableId) continue
    ;(grouped[order.tableId] ??= []).push(order)
  }
  return grouped
}
