import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { API_URL } from '@resttek/web-shared'
import { IngredientApi } from './ingredient.api'

describe('IngredientApi', () => {
  let api: IngredientApi
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }]
    })
    api = TestBed.inject(IngredientApi)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('list hace GET de los ingredientes del restaurante', () => {
    api.list('r1').subscribe()
    http.expectOne({ method: 'GET', url: '/api/v1/restaurants/r1/ingredients' }).flush([])
  })
})
