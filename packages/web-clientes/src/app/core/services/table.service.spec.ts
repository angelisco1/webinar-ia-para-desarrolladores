import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { API_URL } from '@resttek/web-shared'
import { TableService } from './table.service'

describe('TableService', () => {
  let service: TableService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/v1' }
      ]
    })
    service = TestBed.inject(TableService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('getAvailable consulta las mesas libres para N personas', () => {
    let result: unknown
    service.getAvailable('r1', 4).subscribe(r => (result = r))

    const req = http.expectOne('/api/v1/restaurants/r1/tables/available?guests=4')
    expect(req.request.method).toBe('GET')
    req.flush([{ id: 't1' }])
    expect(result).toEqual([{ id: 't1' }])
  })

  it('occupy hace POST sin cuerpo', () => {
    let result: unknown
    service.occupy('r1', 't1').subscribe(r => (result = r))

    const req = http.expectOne('/api/v1/restaurants/r1/tables/t1/occupy')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toBeNull()
    req.flush({ id: 't1', status: 'ocupada' })
    expect(result).toEqual({ id: 't1', status: 'ocupada' })
  })
})
