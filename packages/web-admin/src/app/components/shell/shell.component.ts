import { Component, OnInit, inject } from '@angular/core'
import { Router, NavigationEnd } from '@angular/router'
import { RestaurantStore } from '../../store/restaurant.store'

@Component({
  selector: 'app-shell',
  standalone: false,
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css']
})
export class ShellComponent implements OnInit {
  // para poder llamar al shell desde otros componentes
  static instance: ShellComponent

  user: any
  expandedRestaurantId: any = null
  private store = inject(RestaurantStore)

  get restaurants() {
    return this.store.restaurants()
  }

  get loading() {
    return this.store.loading()
  }

  constructor(public router: Router) {
    ShellComponent.instance = this
  }

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('auth_user'))
    this.loadRestaurants()

    var match = this.router.url.match(/\/restaurants\/([^/]+)\//)
    if (match) {
      this.expandedRestaurantId = match[1]
    }

    this.router.events.subscribe((e: any) => {
      if (e instanceof NavigationEnd) {
        console.log('navegando a', e.urlAfterRedirects)
        var match = e.urlAfterRedirects.match(/\/restaurants\/([^/]+)\//)
        if (match) {
          this.expandedRestaurantId = match[1]
        }
      }
    })

    if (this.user.role != 'admin') {
      if (this.user.restaurantId) {
        this.expandedRestaurantId = this.user.restaurantId
        if (this.router.url == '/dashboard' || this.router.url == '/') {
          this.router.navigate(['/restaurants', this.user.restaurantId, 'dashboard'])
        }
      }
    }
  }

  loadRestaurants() {
    this.store.load()
  }

  toggleRestaurant(id) {
    if (this.expandedRestaurantId == id) {
      this.expandedRestaurantId = null
    } else {
      this.expandedRestaurantId = id
    }
  }

  logout() {
    localStorage.clear()
    window.location.href = '/login'
  }
}
