import { Component, OnInit } from '@angular/core'
import { Router, NavigationEnd } from '@angular/router'
import { DataService } from '../../data.service'

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
  restaurants: any[] = []
  expandedRestaurantId: any = null
  loading = false

  constructor(public dataService: DataService, public router: Router) {
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
    this.loading = true
    this.dataService.http.get('/api/v1/restaurants').subscribe((data: any) => {
      this.restaurants = data
      this.dataService.restaurants = data
      this.loading = false
    })
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
