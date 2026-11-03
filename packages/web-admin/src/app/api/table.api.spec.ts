import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { API_URL } from '@resttek/web-shared'
import { TableApi } from './table.api'

describe('TableApi', () => {
  let api: TableApi
  let http: HttpTestingController
  const base = '/api/v1/restaurants/r1/tables'

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }]
    })
    api = TestBed.inject(TableApi)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('list hace GET de las mesas del restaurante', () => {
    api.list('r1').subscribe()
    http.expectOne({ method: 'GET', url: base }).flush([])
  })

  it('get hace GET de una mesa', () => {
    api.get('r1', 't1').subscribe()
    http.expectOne({ method: 'GET', url: `${base}/t1` }).flush({})
  })

  it('create hace POST con el cuerpo', () => {
    const body = { number: 1, description: 'Terraza', capacity: 4 }
    api.create('r1', body).subscribe()
    const req = http.expectOne({ method: 'POST', url: base })
    expect(req.request.body).toEqual(body)
    req.flush({})
  })

  it('update hace PUT con el cuerpo', () => {
    const body = { number: 1, capacity: 6, status: 'reservada' as const }
    api.update('r1', 't1', body).subscribe()
    const req = http.expectOne({ method: 'PUT', url: `${base}/t1` })
    expect(req.request.body).toEqual(body)
    req.flush({})
  })

  it('remove hace DELETE de la mesa', () => {
    api.remove('r1', 't1').subscribe()
    http.expectOne({ method: 'DELETE', url: `${base}/t1` }).flush(null)
  })
})
