import { TestBed } from '@angular/core/testing'
import { Subject, of, throwError } from 'rxjs'
import { DishApi } from '../api/dish.api'
import { Dish } from '../models/dish.model'
import { toDishDto } from '../components/dish-form/dish-form.mapper'
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

  describe('save / setAvailability', () => {
    it('save crea sin id y actualiza con id', async () => {
      const dto: any = { name: 'x' }
      await store.save('r1', dto)
      expect(api.create).toHaveBeenCalledWith('r1', dto)
      await store.save('r1', dto, 'd1')
      expect(api.update).toHaveBeenCalledWith('r1', 'd1', dto)
    })

    it('setAvailability hace PUT con el DTO completo y actualiza sin mutar', async () => {
      await store.load('r1')
      const original = store.dishes()[0]
      await store.setAvailability('r1', original, false)
      expect(api.update).toHaveBeenCalledWith('r1', 'd1', { ...toDishDto(original), available: false })
      expect(store.dishes()[0].available).toBe(false)
      expect(original.available).toBe(true)
    })
  })

  describe('remove', () => {
    it('quita el plato de la lista', async () => {
      await store.load('r1')
      await store.remove('r1', 'd1')
      expect(api.remove).toHaveBeenCalledWith('r1', 'd1')
      expect(store.dishes()).toEqual([])
    })

    it('si la API falla no cambia la lista y rechaza', async () => {
      await store.load('r1')
      api.remove.mockReturnValue(throwError(() => new Error('x')))
      await expect(store.remove('r1', 'd1')).rejects.toThrow()
      expect(store.dishes()).toEqual([dish()])
    })
  })
})
