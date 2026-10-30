import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { HttpClient } from '@angular/common/http'

@Component({
  selector: 'app-ingredient-form',
  standalone: false,
  templateUrl: './ingredient-form.component.html',
  styleUrls: ['./ingredient-form.component.css']
})
export class IngredientFormComponent implements OnInit {
  isEditing = false
  ingredientId = null
  restaurantId = null
  loading = false
  error = null

  units = ['kg', 'g', 'l', 'ml', 'unidad']

  ingredient: any = {
    name: '',
    unit: 'kg',
    currentStock: 0
  }

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.restaurantId = params['restaurantId']
      if (params['id']) {
        this.isEditing = true
        this.ingredientId = params['id']
        this.loading = true
        // no hay endpoint para uno solo, traemos todos y buscamos
        this.http.get('/api/v1/restaurants/' + this.restaurantId + '/ingredients').subscribe((data: any) => {
          for (var i = 0; i < data.length; i++) {
            if (data[i].id == this.ingredientId) {
              this.ingredient = data[i]
            }
          }
          this.loading = false
        }, err => {
          this.error = 'No se pudo cargar el ingrediente.'
          this.loading = false
        })
      }
    })
  }

  save() {
    this.error = null
    if (!this.ingredient.name) {
      this.error = 'El nombre es obligatorio'
      return
    }
    if (this.ingredient.currentStock < 0) {
      this.error = 'El stock no puede ser negativo'
      return
    }
    this.loading = true
    var body = { name: this.ingredient.name, unit: this.ingredient.unit, currentStock: this.ingredient.currentStock }
    var url = '/api/v1/restaurants/' + this.restaurantId + '/ingredients'
    var req = this.isEditing ? this.http.put(url + '/' + this.ingredientId, body) : this.http.post(url, body)
    req.subscribe(() => {
      this.loading = false
      this.router.navigate(['/restaurants/' + this.restaurantId + '/ingredients'])
    }, err => {
      this.loading = false
      this.error = err.error && err.error.message ? err.error.message : 'Error al guardar el ingrediente.'
    })
  }
}
