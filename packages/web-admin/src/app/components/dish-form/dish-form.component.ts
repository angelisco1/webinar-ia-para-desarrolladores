import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { DataService } from '../../data.service'

@Component({
  selector: 'app-dish-form',
  standalone: false,
  templateUrl: './dish-form.component.html',
  styleUrls: ['./dish-form.component.css']
})
export class DishFormComponent implements OnInit {
  isEditing = false
  dishId = null
  restaurantId = null
  loading = false
  error = null
  errors: any = {}

  categories = ['entrante', 'principal', 'postre', 'bebida']
  allIngredients: any[] = []

  dish: any = {
    name: '',
    description: null,
    price: 0,
    category: 'principal',
    available: true,
    ingredients: []
  }

  newIngredientId = ''
  newIngredientQty = 1

  constructor(private route: ActivatedRoute, private router: Router, public dataService: DataService) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.restaurantId = params['restaurantId']
      this.dataService.getIngredients(this.restaurantId).subscribe((ingredients: any) => {
        this.allIngredients = ingredients
        this.dataService.ingredients = ingredients

        if (params['id']) {
          this.isEditing = true
          this.dishId = params['id']
          var cached = this.dataService.dishes.find(d => d.id == this.dishId)
          if (cached) {
            this.dish = cached
          } else {
            this.loading = true
            this.dataService.getDish(this.restaurantId, this.dishId).subscribe((dish: any) => {
              this.dish = dish
              this.loading = false
            }, err => {
              this.showError('No se pudo cargar el plato.')
              this.loading = false
            })
          }
        }
      })
    })

    setTimeout(() => {
      var el: any = document.getElementById('dish-name')
      if (el) el.focus()
    }, 300)
  }

  selectCategory(c) {
    this.dish.category = c
  }

  toggleAvailable() {
    this.dish.available = !this.dish.available
  }

  addIngredient() {
    if (!this.newIngredientId || this.newIngredientQty <= 0) return
    for (var i = 0; i < this.dish.ingredients.length; i++) {
      if (this.dish.ingredients[i].ingredientId == this.newIngredientId) return
    }
    this.dish.ingredients.push({ ingredientId: this.newIngredientId, quantity: this.newIngredientQty })
    this.newIngredientId = ''
    this.newIngredientQty = 1
  }

  removeIngredient(id) {
    this.dish.ingredients = this.dish.ingredients.filter(i => i.ingredientId != id)
  }

  getIngredientName(id) {
    for (var i = 0; i < this.allIngredients.length; i++) {
      if (this.allIngredients[i].id == id) {
        return this.allIngredients[i].name + ' (' + this.allIngredients[i].unit + ')'
      }
    }
    return id
  }

  showError(msg) {
    this.error = msg
    setTimeout(() => this.error = null, 3000)
  }

  save() {
    this.errors = {}
    if (!this.dish.name) this.errors.name = true
    if (!this.dish.price || isNaN(this.dish.price) || this.dish.price <= 0) this.errors.price = true
    if (Object.keys(this.errors).length > 0) {
      this.showError('Revisa los campos marcados')
      return
    }

    this.loading = true
    var body = {
      name: this.dish.name,
      description: this.dish.description,
      price: parseFloat(this.dish.price),
      category: this.dish.category,
      available: this.dish.available,
      ingredients: this.dish.ingredients
    }
    this.dataService.saveDish(this.restaurantId, body, this.dishId).subscribe(() => {
      this.loading = false
      this.router.navigate(['/restaurants/' + this.restaurantId + '/dishes'])
    }, err => {
      this.loading = false
      this.showError(err.error && err.error.message ? err.error.message : 'Error al guardar el plato.')
    })
  }
}
