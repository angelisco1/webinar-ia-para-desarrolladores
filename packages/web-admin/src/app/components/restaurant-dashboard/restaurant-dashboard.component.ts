import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ShellComponent } from '../shell/shell.component'

@Component({
  selector: 'app-restaurant-dashboard',
  standalone: false,
  templateUrl: './restaurant-dashboard.component.html',
  styleUrls: ['./restaurant-dashboard.component.css']
})
export class RestaurantDashboardComponent implements OnInit {
  restaurantId = ''
  restaurantName = 'Restaurante'

  // inyectamos el shell para reutilizar la lista de restaurantes que ya tiene cargada
  constructor(private route: ActivatedRoute, private shell: ShellComponent) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.restaurantId = params['restaurantId']
      // esperamos a que el shell cargue los restaurantes
      setTimeout(() => {
        for (var i = 0; i < this.shell.restaurants.length; i++) {
          if (this.shell.restaurants[i].id == this.restaurantId) {
            this.restaurantName = this.shell.restaurants[i].name
          }
        }
      }, 500)
    })
  }
}
