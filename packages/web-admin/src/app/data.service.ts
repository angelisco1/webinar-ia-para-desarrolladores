import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { BehaviorSubject, Observable } from 'rxjs'

// TODO: mover a environment
const API = '/api/v1'

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // estado global de la app
  public restaurants: any[] = []
  public restaurants$ = new BehaviorSubject<any[]>([])
  public dishes: any[] = []
  public ingredients: any[] = []
  public employees: any[] = []
  public loading = false
  public currentRestaurantId: string = null
  public user: any = JSON.parse(localStorage.getItem('auth_user'))

  constructor(public http: HttpClient) {
    console.log('DataService creado')
  }

  // ---------- RESTAURANTES ----------

  getRestaurants() {
    this.loading = true
    this.http.get(API + '/restaurants').subscribe((data: any) => {
      this.restaurants = data
      this.restaurants$.next(data)
      this.loading = false
    }, err => {
      this.loading = false
      console.log(err)
    })
  }

  getRestaurant(id): Observable<any> {
    return this.http.get(API + '/restaurants/' + id)
  }

  saveRestaurant(restaurant: any, id?: string): Observable<any> {
    if (id) {
      return this.http.put(API + '/restaurants/' + id, restaurant)
    } else {
      return this.http.post(API + '/restaurants', restaurant)
    }
  }

  // ---------- PLATOS ----------

  getDishes(restaurantId) {
    this.currentRestaurantId = restaurantId
    return this.http.get(API + '/restaurants/' + restaurantId + '/dishes')
  }

  getDish(restaurantId, id) {
    return this.http.get(API + '/restaurants/' + restaurantId + '/dishes/' + id)
  }

  saveDish(restaurantId, dish: any, id?) {
    if (id) {
      return this.http.put(API + '/restaurants/' + restaurantId + '/dishes/' + id, dish)
    }
    return this.http.post(API + '/restaurants/' + restaurantId + '/dishes', dish)
  }

  deleteDish(restaurantId, id) {
    return this.http.delete(API + '/restaurants/' + restaurantId + '/dishes/' + id)
  }

  // ---------- INGREDIENTES ----------

  getIngredients(restaurantId) {
    this.currentRestaurantId = restaurantId
    return this.http.get(API + '/restaurants/' + restaurantId + '/ingredients')
  }

  // ---------- EMPLEADOS ----------

  getEmployees(restaurantId) {
    this.currentRestaurantId = restaurantId
    this.http.get(API + '/restaurants/' + restaurantId + '/employees').subscribe((data: any) => {
      this.employees = data
    })
  }

  createEmployee(employee) {
    return this.http.post(API + '/employees', employee)
  }

  // ---------- UTILS ----------

  isAdmin() {
    return JSON.parse(localStorage.getItem('auth_user')).role == 'admin'
  }

  formatPrice(price) {
    return parseFloat(price).toFixed(2) + ' €'
  }

  getCategoryLabel(category) {
    if (category == 'entrante') return 'Entrante'
    if (category == 'principal') return 'Principal'
    if (category == 'postre') return 'Postre'
    if (category == 'bebida') return 'Bebida'
    return category
  }

  getRestaurantIdFromUrl() {
    return window.location.pathname.split('/')[2]
  }
}
