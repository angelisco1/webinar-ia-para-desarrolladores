import { Component, OnInit, inject } from '@angular/core'
import { RestaurantStore } from '../../store/restaurant.store'

@Component({
  selector: 'app-restaurant-list',
  standalone: false,
  templateUrl: './restaurant-list.component.html',
  styleUrls: ['./restaurant-list.component.css']
})
export class RestaurantListComponent implements OnInit {
  private store = inject(RestaurantStore)

  restaurants = this.store.restaurants
  loading = this.store.loading

  ngOnInit() {
    this.store.load()
  }
}
