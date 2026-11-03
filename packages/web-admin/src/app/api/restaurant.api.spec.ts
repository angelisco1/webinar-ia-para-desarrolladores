import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { API_URL } from '@resttek/web-shared'
import { RestaurantApi } from './restaurant.api'

describe('RestaurantApi', () => {
  let api: RestaurantApi
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }]
    })
    api = TestBed.inject(RestaurantApi)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('list hace GET de los restaurantes', () => {
    api.list().subscribe()
    http.expectOne({ method: 'GET', url: '/api/v1/restaurants' }).flush([])
  })

  it('get hace GET de un restaurante', () => {
    api.get('r1').subscribe()
    http.expectOne({ method: 'GET', url: '/api/v1/restaurants/r1' }).flush({})
  })

  it('create hace POST', () => {
    const body: any = { name: 'x' }
    api.create(body).subscribe()
    const req = http.expectOne({ method: 'POST', url: '/api/v1/restaurants' })
    expect(req.request.body).toBe(body)
    req.flush({})
  })

  it('update hace PUT', () => {
    const body: any = { name: 'x' }
    api.update('r1', body).subscribe()
    const req = http.expectOne({ method: 'PUT', url: '/api/v1/restaurants/r1' })
    expect(req.request.body).toBe(body)
    req.flush({})
  })
})
