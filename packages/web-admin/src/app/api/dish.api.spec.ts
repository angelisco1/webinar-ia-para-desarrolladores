import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { API_URL } from '@resttek/web-shared'
import { DishApi } from './dish.api'

describe('DishApi', () => {
  let api: DishApi
  let http: HttpTestingController
  const dto: any = { name: 'x' }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }]
    })
    api = TestBed.inject(DishApi)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('list hace GET de los platos del restaurante', () => {
    api.list('r1').subscribe()
    http.expectOne({ method: 'GET', url: '/api/v1/restaurants/r1/dishes' }).flush([])
  })

  it('get hace GET de un plato', () => {
    api.get('r1', 'd1').subscribe()
    http.expectOne({ method: 'GET', url: '/api/v1/restaurants/r1/dishes/d1' }).flush({})
  })

  it('create hace POST', () => {
    api.create('r1', dto).subscribe()
    const req = http.expectOne({ method: 'POST', url: '/api/v1/restaurants/r1/dishes' })
    expect(req.request.body).toBe(dto)
    req.flush({})
  })

  it('update hace PUT', () => {
    api.update('r1', 'd1', dto).subscribe()
    const req = http.expectOne({ method: 'PUT', url: '/api/v1/restaurants/r1/dishes/d1' })
    expect(req.request.body).toBe(dto)
    req.flush({})
  })

  it('remove hace DELETE', () => {
    api.remove('r1', 'd1').subscribe()
    http.expectOne({ method: 'DELETE', url: '/api/v1/restaurants/r1/dishes/d1' }).flush(null)
  })
})
