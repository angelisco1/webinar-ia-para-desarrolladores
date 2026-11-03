import { TestBed } from '@angular/core/testing'
import { ActivatedRouteSnapshot, Router, UrlTree, convertToParamMap } from '@angular/router'
import { tableSelectedGuard } from './table-selected.guard'
import { TableSessionStore } from '../store/table-session.store'
import { Table } from '../models/table.model'

const table: Table = {
  id: 't1', restaurantId: 'r1', number: 1, description: null, capacity: 4,
  status: 'ocupada', createdAt: '', updatedAt: ''
}

describe('tableSelectedGuard', () => {
  let store: TableSessionStore
  const route = (id: string) => ({ paramMap: convertToParamMap({ id }) }) as ActivatedRouteSnapshot
  const run = (id: string) => TestBed.runInInjectionContext(() => tableSelectedGuard(route(id), {} as never))

  beforeEach(() => {
    store = TestBed.inject(TableSessionStore)
  })

  it('permite el paso si hay mesa para el restaurante', () => {
    store.select('r1', table)
    expect(run('r1')).toBe(true)
  })

  it('redirige a /restaurants/:id/mesas si no hay mesa', () => {
    const result = run('r1')
    expect(result).toBeInstanceOf(UrlTree)
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/restaurants/r1/mesas')
  })

  it('redirige si la mesa guardada es de otro restaurante', () => {
    store.select('r2', { ...table, restaurantId: 'r2' })
    expect(run('r1')).toBeInstanceOf(UrlTree)
  })
})
