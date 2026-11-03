import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TableService } from './table.service'
import { environment } from '../../../../environments/environment'

describe('TableService', () => {
  let service: TableService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
    service = TestBed.inject(TableService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('getAll hace GET a /restaurants/:id/tables', () => {
    service.getAll('r1').subscribe()
    const req = http.expectOne(`${environment.apiUrl}/restaurants/r1/tables`)
    expect(req.request.method).toBe('GET')
    req.flush([])
  })

  it('updateStatus hace PATCH a /tables/:id/status con el cuerpo', () => {
    service.updateStatus('r1', 't1', { status: 'libre' }).subscribe()
    const req = http.expectOne(`${environment.apiUrl}/restaurants/r1/tables/t1/status`)
    expect(req.request.method).toBe('PATCH')
    expect(req.request.body).toEqual({ status: 'libre' })
    req.flush({})
  })
})
