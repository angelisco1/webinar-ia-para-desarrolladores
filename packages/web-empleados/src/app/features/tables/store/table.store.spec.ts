import { TestBed } from '@angular/core/testing'
import { of, throwError } from 'rxjs'
import { TableStore } from './table.store'
import { TableService } from '../services/table.service'
import { Table } from '../models/table.model'

const table = (id: string, status: Table['status'] = 'libre'): Table => ({
  id, restaurantId: 'r1', number: 1, description: null, capacity: 4, status,
  createdAt: '2026-11-03T10:00:00.000Z', updatedAt: '2026-11-03T10:00:00.000Z',
})

describe('TableStore', () => {
  let store: TableStore
  let service: { getAll: ReturnType<typeof vi.fn>; updateStatus: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.useFakeTimers()
    service = { getAll: vi.fn().mockReturnValue(of([table('t1')])), updateStatus: vi.fn() }
    TestBed.configureTestingModule({ providers: [{ provide: TableService, useValue: service }] })
    store = TestBed.inject(TableStore)
  })

  afterEach(() => {
    store.stopPolling()
    vi.useRealTimers()
  })

  it('loadTables rellena tables()', async () => {
    await store.loadTables('r1')
    expect(service.getAll).toHaveBeenCalledWith('r1')
    expect(store.tables()).toEqual([table('t1')])
  })

  it('un error deja error() con mensaje', async () => {
    service.getAll.mockReturnValue(throwError(() => new Error('boom')))
    await store.loadTables('r1')
    expect(store.error()).toBe('boom')
  })

  it('updateStatus reemplaza la mesa devuelta', async () => {
    await store.loadTables('r1')
    service.updateStatus.mockReturnValue(of(table('t1', 'ocupada')))
    await store.updateStatus('r1', 't1', 'ocupada')
    expect(service.updateStatus).toHaveBeenCalledWith('r1', 't1', { status: 'ocupada' })
    expect(store.tables()[0].status).toBe('ocupada')
  })

  it('startPolling recarga cada 30 s y stopPolling lo detiene', async () => {
    store.startPolling('r1')
    expect(service.getAll).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(30000)
    expect(service.getAll).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(30000)
    expect(service.getAll).toHaveBeenCalledTimes(3)
    store.stopPolling()
    await vi.advanceTimersByTimeAsync(60000)
    expect(service.getAll).toHaveBeenCalledTimes(3)
  })
})
