import { Component, OnInit } from '@angular/core'
import { DataService } from '../../data.service'

@Component({
  selector: 'app-restaurant-list',
  standalone: false,
  templateUrl: './restaurant-list.component.html',
  styleUrls: ['./restaurant-list.component.css']
})
export class RestaurantListComponent implements OnInit {

  constructor(public dataService: DataService) {}

  ngOnInit() {
    this.dataService.getRestaurants()
  }
}
