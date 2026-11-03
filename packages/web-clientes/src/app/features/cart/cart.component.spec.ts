import { TestBed } from '@angular/core/testing'
import { Router, provideRouter } from '@angular/router'
import { of } from 'rxjs'
import { CartComponent } from './cart.component'
import { CartStore, Dish } from '../../core/store/cart.store'
import { TableSessionStore } from '../../core/store/table-session.store'
import { OrderService } from '../../core/services/order.service'
import { Table } from '../../core/models/table.model'

const dish: Dish = {
  id: 'd1', name: 'Paella', description: null, price: 10, category: 'main',
  available: true, restaurantId: 'r1', ingredients: []
}
const table: Table = {
  id: 't1', restaurantId: 'r1', number: 1, description: null, capacity: 4,
  status: 'ocupada', createdAt: '', updatedAt: ''
}

describe('CartComponent', () => {
  let orderService: { createOrder: ReturnType<typeof vi.fn> }
  let session: TableSessionStore
  let cart: CartStore

  beforeEach(() => {
    orderService = { createOrder: vi.fn().mockReturnValue(of({ id: 'o1' })) }
    TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [provideRouter([]), { provide: OrderService, useValue: orderService }]
    })
    session = TestBed.inject(TableSessionStore)
    cart = TestBed.inject(CartStore)
    cart.addItem(dish, 2, 'sin sal')
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true)
  })

  it('confirmOrder envía la mesa del store y la limpia tras crear el pedido', () => {
    session.select('r1', table)
    const component = TestBed.createComponent(CartComponent).componentInstance

    component.confirmOrder()

    expect(orderService.createOrder).toHaveBeenCalledWith(
      'r1',
      [{ dishId: 'd1', quantity: 2, notes: 'sin sal' }],
      't1'
    )
    expect(session.table()).toBeNull()
    expect(cart.items().length).toBe(0)
  })

  it('no limpia la mesa si el pedido falla', () => {
    session.select('r1', table)
    orderService.createOrder.mockReturnValue({ subscribe: ({ error }: { error: (e: unknown) => void }) => error(new Error('x')) })
    const component = TestBed.createComponent(CartComponent).componentInstance

    component.confirmOrder()

    expect(session.table()).toEqual(table)
  })
})
