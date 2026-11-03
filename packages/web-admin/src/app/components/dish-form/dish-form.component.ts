import { AfterViewInit, Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { DataService } from '../../data.service'

@Component({
  selector: 'app-dish-form',
  standalone: false,
  templateUrl: './dish-form.component.html',
  styleUrls: ['./dish-form.component.css']
})
export class DishFormComponent implements OnInit, AfterViewInit {
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
  }

  ngAfterViewInit() {
    // el foco inicial solo tiene sentido al crear: al editar no se roba al usuario
    if (this.route.snapshot.params['id']) return
    var el: any = document.getElementById('dish-name')
    if (el) el.focus()
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

  showError(msg, persistent = false) {
    this.error = msg
    if (!persistent) setTimeout(() => this.error = null, 10000)
  }

  validate() {
    this.errors = {}
    if (!this.dish.name) this.errors.name = 'Indica el nombre del plato'
    if (!this.dish.price || isNaN(this.dish.price) || this.dish.price <= 0) this.errors.price = 'Introduce un precio mayor que 0'
    return Object.keys(this.errors).length
  }

  validationSummary(count) {
    return 'Revisa los campos marcados (' + count + (count === 1 ? ' error)' : ' errores)')
  }

  onFieldChange() {
    if (!this.error || Object.keys(this.errors).length === 0) return
    var count = this.validate()
    this.error = count ? this.validationSummary(count) : null
  }

  save() {
    var count = this.validate()
    if (count > 0) {
      // el resumen permanece visible hasta corregir o cerrar (WCAG 2.2.1)
      this.showError(this.validationSummary(count), true)
      var first = document.getElementById(this.errors.name ? 'dish-name' : 'dish-price')
      if (first) first.focus()
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
