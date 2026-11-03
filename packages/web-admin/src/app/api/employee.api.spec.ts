import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { API_URL } from '@resttek/web-shared'
import { EmployeeApi } from './employee.api'

describe('EmployeeApi', () => {
  let api: EmployeeApi
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }]
    })
    api = TestBed.inject(EmployeeApi)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('list hace GET de los empleados del restaurante', () => {
    api.list('r1').subscribe()
    http.expectOne({ method: 'GET', url: '/api/v1/restaurants/r1/employees' }).flush([])
  })

  it('create hace POST a /employees', () => {
    const e: any = { firstName: 'a' }
    api.create(e).subscribe()
    const req = http.expectOne({ method: 'POST', url: '/api/v1/employees' })
    expect(req.request.body).toBe(e)
    req.flush({})
  })
})
