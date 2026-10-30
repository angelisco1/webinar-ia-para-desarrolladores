import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { DataService } from '../../data.service'

@Component({
  selector: 'app-dish-list',
  standalone: false,
  templateUrl: './dish-list.component.html',
  styleUrls: ['./dish-list.component.css']
})
export class DishListComponent implements OnInit {
  restaurantId
  loading = false
  error = null
  message = null
  filter = 'todos'
  categories = ['todos', 'entrante', 'principal', 'postre', 'bebida']

  constructor(public dataService: DataService, public router: Router) {}

  ngOnInit() {
    this.restaurantId = this.dataService.getRestaurantIdFromUrl()
    this.loading = true
    this.dataService.getDishes(this.restaurantId).subscribe((data: any) => {
      this.dataService.dishes = data
      this.loading = false
    }, err => {
      this.error = 'No se pudieron cargar los platos.'
      this.loading = false
    })
  }

  getDishes() {
    console.log('getDishes')
    if (this.filter == 'todos') {
      return this.dataService.dishes
    }
    return this.dataService.dishes.filter(d => d.category == this.filter)
  }

  goToNew() {
    this.router.navigate(['/restaurants/' + this.restaurantId + '/dishes/new'])
  }

  goToEdit(id) {
    this.router.navigate(['/restaurants/' + this.restaurantId + '/dishes/' + id + '/edit'])
  }

  toggleAvailable(dish, event) {
    event.stopPropagation()
    var body = {
      name: dish.name,
      description: dish.description,
      price: dish.price,
      category: dish.category,
      available: !dish.available,
      ingredients: dish.ingredients
    }
    this.dataService.saveDish(this.restaurantId, body, dish.id).subscribe((res: any) => {
      dish.available = res.available
    }, err => {
      alert('Error al actualizar disponibilidad.')
    })
  }

  deleteDish(id, event) {
    event.stopPropagation()
    if (confirm('¿Estás seguro de eliminar este plato?')) {
      this.dataService.deleteDish(this.restaurantId, id).subscribe(() => {
        this.dataService.dishes = this.dataService.dishes.filter(d => d.id != id)
        this.message = 'Plato eliminado'
        setTimeout(() => this.message = null, 2000)
      }, err => {
        alert('Error al eliminar el plato.')
      })
    }
  }
}
