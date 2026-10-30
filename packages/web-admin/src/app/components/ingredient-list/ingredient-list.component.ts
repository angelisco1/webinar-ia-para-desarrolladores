import { Component, OnInit } from '@angular/core'
import { HttpClient } from '@angular/common/http'

@Component({
  selector: 'app-ingredient-list',
  standalone: false,
  templateUrl: './ingredient-list.component.html',
  styleUrls: ['./ingredient-list.component.css']
})
export class IngredientListComponent implements OnInit {
  ingredients: any[] = []
  loading = false
  error = null
  restaurantId

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.restaurantId = window.location.pathname.split('/')[2]
    this.loadIngredients()
  }

  loadIngredients() {
    this.loading = true
    this.http.get('/api/v1/restaurants/' + this.restaurantId + '/ingredients').subscribe((data: any) => {
      this.ingredients = data
      this.loading = false
    }, err => {
      this.error = 'No se pudieron cargar los ingredientes.'
      this.loading = false
    })
  }

  deleteIngredient(id) {
    if (confirm('¿Estás seguro de eliminar este ingrediente?')) {
      this.http.delete('/api/v1/restaurants/' + this.restaurantId + '/ingredients/' + id).subscribe(() => {
        this.loadIngredients()
      }, err => {
        alert('Error al eliminar el ingrediente.')
      })
    }
  }
}
