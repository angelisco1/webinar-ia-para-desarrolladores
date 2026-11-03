import { TestBed, ComponentFixture } from '@angular/core/testing'
import { signal } from '@angular/core'
import { AuthStore } from '@resttek/web-shared'
import { MesasComponent } from './mesas.component'
import { TableStore } from '../../store/table.store'
import { OrderStore } from '../../../orders/store/order.store'
import { Table } from '../../models/table.model'

const table = (id: string, number: number, status: Table['status']): Table => ({
  id, restaurantId: 'r1', number, description: null, capacity: 4, status,
  createdAt: '2026-11-03T10:00:00.000Z', updatedAt: '2026-11-03T10:00:00.000Z',
})

describe('MesasComponent', () => {
  let fixture: ComponentFixture<MesasComponent>
  let tableStore: any
  let orderStore: any
  let user: ReturnType<typeof signal<any>>

  function setup(restaurantId: string | null = 'r1') {
    user = signal(restaurantId ? { restaurantId } : {})
    tableStore = {
      tables: signal([table('t1', 1, 'libre'), table('t2', 2, 'ocupada')]),
      loading: signal(false),
      error: signal(null),
      updateStatus: vi.fn().mockResolvedValue(undefined),
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
    }
    orderStore = {
      orders: signal([]),
      loading: signal(false),
      error: signal(null),
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
    }
    TestBed.configureTestingModule({
      imports: [MesasComponent],
      providers: [
        { provide: AuthStore, useValue: { user } },
        { provide: TableStore, useValue: tableStore },
        { provide: OrderStore, useValue: orderStore },
      ],
    })
    fixture = TestBed.createComponent(MesasComponent)
    fixture.detectChanges()
  }

  const el = () => fixture.nativeElement as HTMLElement

  it('pinta una tarjeta por mesa con su estado', () => {
    setup()
    const cards = el().querySelectorAll('.table-card')
    expect(cards.length).toBe(2)
    expect(cards[0].textContent).toContain('Mesa 1')
    expect((cards[0].querySelector('select') as HTMLSelectElement).value).toBe('libre')
    expect((cards[1].querySelector('select') as HTMLSelectElement).value).toBe('ocupada')
  })

  it('cambiar el select llama a TableStore.updateStatus', () => {
    setup()
    const select = el().querySelectorAll('.table-card')[1].querySelector('select') as HTMLSelectElement
    select.value = 'libre'
    select.dispatchEvent(new Event('change'))
    expect(tableStore.updateStatus).toHaveBeenCalledWith('r1', 't2', 'libre')
  })

  it('arranca el polling con el restaurantId y lo detiene al destruirse', () => {
    setup()
    expect(tableStore.startPolling).toHaveBeenCalledWith('r1')
    expect(orderStore.startPolling).toHaveBeenCalledWith('r1')
    fixture.destroy()
    expect(tableStore.stopPolling).toHaveBeenCalled()
    expect(orderStore.stopPolling).toHaveBeenCalled()
  })

  it('sin restaurantId no llama a la API', () => {
    setup(null)
    expect(tableStore.startPolling).not.toHaveBeenCalled()
    expect(orderStore.startPolling).not.toHaveBeenCalled()
  })
})
