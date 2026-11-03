import { NO_ERRORS_SCHEMA, signal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router'
import { Dish } from '../../models/dish.model'
import { CategoryLabelPipe } from '../../shared/category-label.pipe'
import { DialogService } from '../../shared/dialog.service'
import { PriceFormatPipe } from '../../shared/price-format.pipe'
import { DishStore } from '../../store/dish.store'
import { DishListComponent } from './dish-list.component'

const dish = (id: string, category: Dish['category']): Dish => ({
  id, name: id, description: null, price: 10, category, available: true,
  restaurantId: 'r1', ingredients: [], createdAt: '', updatedAt: ''
})

describe('DishListComponent', () => {
  let fixture: ComponentFixture<DishListComponent>
  let cmp: DishListComponent
  let store: any
  let dialog: { confirm: any; alert: any }
  const event = () => ({ stopPropagation: vi.fn() })

  beforeEach(() => {
    store = {
      dishes: signal([dish('a', 'entrante'), dish('b', 'entrante'), dish('c', 'postre')]),
      loading: signal(false),
      error: signal(null),
      load: vi.fn(() => Promise.resolve()),
      setAvailability: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve())
    }
    dialog = { confirm: vi.fn(() => true), alert: vi.fn() }
    TestBed.configureTestingModule({
      declarations: [DishListComponent, CategoryLabelPipe, PriceFormatPipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ restaurantId: 'r1' }) } } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: DishStore, useValue: store },
        { provide: DialogService, useValue: dialog }
      ]
    })
    fixture = TestBed.createComponent(DishListComponent)
    cmp = fixture.componentInstance
    fixture.detectChanges()
  })

  it('toma el restaurantId de la ruta y carga los platos', () => {
    expect(cmp.restaurantId).toBe('r1')
    expect(store.load).toHaveBeenCalledWith('r1')
  })

  it('filteredDishes filtra por categoría', () => {
    expect(cmp.filteredDishes().length).toBe(3)
    cmp.filter.set('postre')
    expect(cmp.filteredDishes().map(d => d.id)).toEqual(['c'])
  })

  it('toggleAvailable cambia la disponibilidad y detiene la propagación', async () => {
    const e = event()
    const d = store.dishes()[0]
    await cmp.toggleAvailable(d, e as any)
    expect(e.stopPropagation).toHaveBeenCalled()
    expect(store.setAvailability).toHaveBeenCalledWith('r1', d, false)
  })

  it('toggleAvailable avisa si falla', async () => {
    store.setAvailability.mockReturnValue(Promise.reject(new Error('x')))
    await cmp.toggleAvailable(store.dishes()[0], event() as any)
    expect(dialog.alert).toHaveBeenCalledWith('Error al actualizar disponibilidad.')
  })

  it('deleteDish no hace nada si no se confirma', async () => {
    dialog.confirm.mockReturnValue(false)
    await cmp.deleteDish('a', event() as any)
    expect(store.remove).not.toHaveBeenCalled()
  })

  it('deleteDish elimina y muestra el mensaje si se confirma', async () => {
    await cmp.deleteDish('a', event() as any)
    expect(store.remove).toHaveBeenCalledWith('r1', 'a')
    expect(cmp.message()).toBe('Plato eliminado')
  })

  it('deleteDish avisa si falla la API', async () => {
    store.remove.mockReturnValue(Promise.reject(new Error('x')))
    await cmp.deleteDish('a', event() as any)
    expect(dialog.alert).toHaveBeenCalledWith('Error al eliminar el plato.')
    expect(cmp.message()).toBeNull()
  })
})
