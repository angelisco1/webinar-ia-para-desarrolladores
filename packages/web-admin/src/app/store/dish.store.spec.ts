import { TestBed } from '@angular/core/testing'
import { Subject, of, throwError } from 'rxjs'
import { DishApi } from '../api/dish.api'
import { Dish } from '../models/dish.model'
import { DishStore } from './dish.store'

const dish = (over: Partial<Dish> = {}): Dish => ({
  id: 'd1', name: 'Tortilla', description: null, price: 10, category: 'principal',
  available: true, restaurantId: 'r1', ingredients: [], createdAt: '', updatedAt: '', ...over
})

describe('DishStore', () => {
  let api: { list: any; get: any; create: any; update: any; remove: any }
  let store: DishStore

  beforeEach(() => {
    api = {
      list: vi.fn(() => of([dish()])),
      get: vi.fn(),
      create: vi.fn(() => of(dish())),
      update: vi.fn((_r: string, _id: string, dto: any) => of(dish({ ...dto }))),
      remove: vi.fn(() => of(undefined))
    }
    TestBed.configureTestingModule({ providers: [{ provide: DishApi, useValue: api }] })
    store = TestBed.inject(DishStore)
  })

  describe('load / findById', () => {
    it('pone loading a true mientras carga y deja los platos', async () => {
      const subject = new Subject<Dish[]>()
      api.list.mockReturnValue(subject)
      const p = store.load('r1')
      expect(store.loading()).toBe(true)
      subject.next([dish()])
      subject.complete()
      await p
      expect(store.loading()).toBe(false)
      expect(store.dishes()).toEqual([dish()])
    })

    it('expone un error si falla la carga', async () => {
      api.list.mockReturnValue(throwError(() => new Error('x')))
      await store.load('r1')
      expect(store.error()).toBe('No se pudieron cargar los platos.')
      expect(store.loading()).toBe(false)
    })

    it('findById solo acierta si el restaurante coincide con el cargado', async () => {
      await store.load('r1')
      expect(store.findById('r1', 'd1')).toEqual(dish())
      expect(store.findById('r2', 'd1')).toBeUndefined()
    })
  })
})
