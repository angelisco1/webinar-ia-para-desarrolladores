import { TestBed } from '@angular/core/testing'
import { Subject, of, throwError } from 'rxjs'
import { RestaurantApi } from '../api/restaurant.api'
import { Restaurant } from '../models/restaurant.model'
import { RestaurantStore } from './restaurant.store'

describe('RestaurantStore', () => {
  const restaurant = { id: 'r1', name: 'Bar' } as Restaurant
  let api: { list: any }
  let store: RestaurantStore

  beforeEach(() => {
    api = { list: vi.fn(() => of([restaurant])) }
    TestBed.configureTestingModule({ providers: [{ provide: RestaurantApi, useValue: api }] })
    store = TestBed.inject(RestaurantStore)
  })

  it('load deja los restaurantes y loading pasa por true', async () => {
    const subject = new Subject<Restaurant[]>()
    api.list.mockReturnValue(subject)
    const p = store.load()
    expect(store.loading()).toBe(true)
    subject.next([restaurant])
    subject.complete()
    await p
    expect(store.loading()).toBe(false)
    expect(store.restaurants()).toEqual([restaurant])
  })

  it('loading acaba en false aunque falle la API', async () => {
    api.list.mockReturnValue(throwError(() => new Error('x')))
    await store.load()
    expect(store.loading()).toBe(false)
    expect(store.restaurants()).toEqual([])
  })
})
