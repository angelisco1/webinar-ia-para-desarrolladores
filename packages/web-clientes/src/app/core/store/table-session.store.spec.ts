import { TestBed } from '@angular/core/testing'
import { TableSessionStore } from './table-session.store'
import { Table } from '../models/table.model'

const table: Table = {
  id: 't1', restaurantId: 'r1', number: 1, description: null, capacity: 4,
  status: 'ocupada', createdAt: '', updatedAt: ''
}

describe('TableSessionStore', () => {
  let store: TableSessionStore

  beforeEach(() => {
    store = TestBed.inject(TableSessionStore)
  })

  it('empieza sin mesa', () => {
    expect(store.table()).toBeNull()
    expect(store.restaurantId()).toBeNull()
  })

  it('select expone la mesa y el restaurante', () => {
    store.select('r1', table)
    expect(store.table()).toEqual(table)
    expect(store.restaurantId()).toBe('r1')
  })

  it('clear los pone a null', () => {
    store.select('r1', table)
    store.clear()
    expect(store.table()).toBeNull()
    expect(store.restaurantId()).toBeNull()
  })

  it('hasTableFor solo es true para el restaurante guardado', () => {
    expect(store.hasTableFor('r1')).toBe(false)
    store.select('r1', table)
    expect(store.hasTableFor('r1')).toBe(true)
    expect(store.hasTableFor('r2')).toBe(false)
  })
})
