import { NO_ERRORS_SCHEMA, signal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Restaurant } from '../../models/restaurant.model'
import { RestaurantStore } from '../../store/restaurant.store'
import { RestaurantListComponent } from './restaurant-list.component'

const restaurant = (id: string): Restaurant => ({
  id, name: 'Bar ' + id, address: 'Calle', email: 'a@b.c', phone: '1',
  ownerFirstName: 'A', ownerLastName: 'B', logoUrl: null
})

describe('RestaurantListComponent', () => {
  let fixture: ComponentFixture<RestaurantListComponent>
  let store: any
  const el = () => fixture.nativeElement as HTMLElement

  function setup(loading = false) {
    store = {
      restaurants: signal([restaurant('1'), restaurant('2')]),
      loading: signal(loading),
      load: vi.fn(() => Promise.resolve())
    }
    TestBed.configureTestingModule({
      declarations: [RestaurantListComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: RestaurantStore, useValue: store }]
    })
    fixture = TestBed.createComponent(RestaurantListComponent)
    fixture.detectChanges()
  }

  it('carga los restaurantes al iniciarse y muestra una fila por restaurante', () => {
    setup()
    expect(store.load).toHaveBeenCalled()
    expect(el().querySelectorAll('tbody tr').length).toBe(2)
    expect(el().querySelector('.spinner')).toBeNull()
  })

  it('muestra el spinner mientras carga', () => {
    setup(true)
    expect(el().querySelector('.spinner')).not.toBeNull()
    expect(el().querySelectorAll('tbody tr').length).toBe(0)
  })
})
