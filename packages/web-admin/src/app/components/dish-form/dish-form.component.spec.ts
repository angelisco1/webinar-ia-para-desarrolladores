import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router'
import { delay, of } from 'rxjs'
import { DishApi } from '../../api/dish.api'
import { IngredientApi } from '../../api/ingredient.api'
import { Dish } from '../../models/dish.model'
import { AutofocusDirective } from '../../shared/autofocus.directive'
import { CategoryLabelPipe } from '../../shared/category-label.pipe'
import { DishStore } from '../../store/dish.store'
import { DishFormComponent } from './dish-form.component'
import { DishIngredientsEditorComponent } from './dish-ingredients-editor/dish-ingredients-editor.component'
import { toDishDto } from './dish-form.mapper'

const dish: Dish = {
  id: 'd1', name: 'Tortilla', description: null, price: 10, category: 'principal',
  available: true, restaurantId: 'r1', ingredients: [{ ingredientId: 'i1', quantity: 2 }],
  createdAt: '', updatedAt: ''
}

describe('DishFormComponent', () => {
  let fixture: ComponentFixture<DishFormComponent>
  let cmp: DishFormComponent
  let dishApi: { get: any }
  let ingredientApi: { list: any }
  let store: { findById: any; save: any }
  let navigate: any

  async function setup(params: Record<string, string>) {
    dishApi = { get: vi.fn(() => of(dish).pipe(delay(0))) }
    // las APIs falsas son asíncronas, como HTTP
    ingredientApi = { list: vi.fn(() => of([{ id: 'i1', name: 'Sal', unit: 'g' }]).pipe(delay(0))) }
    store = { findById: vi.fn(() => undefined), save: vi.fn(() => Promise.resolve(dish)) }
    navigate = vi.fn()
    TestBed.configureTestingModule({
      declarations: [DishFormComponent, DishIngredientsEditorComponent, CategoryLabelPipe],
      imports: [FormsModule, AutofocusDirective],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
        { provide: Router, useValue: { navigate } },
        { provide: DishApi, useValue: dishApi },
        { provide: IngredientApi, useValue: ingredientApi },
        { provide: DishStore, useValue: store }
      ]
    })
    fixture = TestBed.createComponent(DishFormComponent)
    document.body.appendChild(fixture.nativeElement)
    cmp = fixture.componentInstance
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
  }

  afterEach(() => fixture.nativeElement.remove())

  it('en edición carga ingredientes y plato (sin caché → GET)', async () => {
    await setup({ restaurantId: 'r1', id: 'd1' })
    expect(ingredientApi.list).toHaveBeenCalledWith('r1')
    expect(dishApi.get).toHaveBeenCalledWith('r1', 'd1')
    expect(cmp.isEditing).toBe(true)
    expect(cmp.dish.name).toBe('Tortilla')
    expect(cmp.allIngredients.length).toBe(1)
  })

  it('en edición usa el plato de la caché del store si existe', async () => {
    await setup({ restaurantId: 'r1', id: 'd1' })
    dishApi.get.mockClear()
    store.findById.mockReturnValue({ ...dish, name: 'Cacheado' })
    await cmp.ngOnInit()
    expect(dishApi.get).not.toHaveBeenCalled()
    expect(cmp.dish.name).toBe('Cacheado')
  })

  it('con nombre vacío marca el error y no llama al store', async () => {
    await setup({ restaurantId: 'r1' })
    cmp.dish.price = 5
    await cmp.save()
    expect(cmp.errors.name).toBe(true)
    expect(cmp.error).toBe('Revisa los campos marcados (1 error)')
    expect(store.save).not.toHaveBeenCalled()
  })

  it('con datos válidos guarda con el DTO y navega al listado', async () => {
    await setup({ restaurantId: 'r1', id: 'd1' })
    cmp.dish.price = '12.5'
    await cmp.save()
    expect(store.save).toHaveBeenCalledWith('r1', toDishDto(cmp.dish), 'd1')
    expect(navigate).toHaveBeenCalledWith(['/restaurants/r1/dishes'])
  })

  it('si la API falla muestra el mensaje del error', async () => {
    await setup({ restaurantId: 'r1', id: 'd1' })
    store.save.mockReturnValue(Promise.reject({ error: { message: 'Nombre duplicado' } }))
    await cmp.save()
    expect(cmp.error).toBe('Nombre duplicado')
    store.save.mockReturnValue(Promise.reject({}))
    await cmp.save()
    expect(cmp.error).toBe('Error al guardar el plato.')
    expect(cmp.loading).toBe(false)
  })

  it('en alta enfoca #dish-name y en edición no', async () => {
    await setup({ restaurantId: 'r1' })
    expect(document.activeElement?.id).toBe('dish-name')
    fixture.nativeElement.remove()
    TestBed.resetTestingModule()
    await setup({ restaurantId: 'r1', id: 'd1' })
    expect(document.activeElement?.id).not.toBe('dish-name')
  })
})
