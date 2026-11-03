import { Component, OnInit, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { firstValueFrom } from 'rxjs'
import { DishApi } from '../../api/dish.api'
import { IngredientApi } from '../../api/ingredient.api'
import { DISH_CATEGORIES, Dish, DishCategory } from '../../models/dish.model'
import { Ingredient } from '../../models/ingredient.model'
import { extractApiError } from '../../shared/api-error'
import { DishStore } from '../../store/dish.store'
import { DishFormValue, toDishDto } from './dish-form.mapper'
import { DishFormErrors, validateDishForm } from './dish-form.validation'

@Component({
  selector: 'app-dish-form',
  standalone: false,
  templateUrl: './dish-form.component.html',
  styleUrls: ['./dish-form.component.css']
})
export class DishFormComponent implements OnInit {
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private store = inject(DishStore)
  private dishApi = inject(DishApi)
  private ingredientApi = inject(IngredientApi)

  isEditing = false
  dishId: string | null = null
  restaurantId: string | null = null
  loading = false
  error: string | null = null
  errors: DishFormErrors = {}

  categories = Object.keys(DISH_CATEGORIES) as DishCategory[]
  allIngredients: Ingredient[] = []

  dish: DishFormValue = {
    name: '',
    description: null,
    price: 0,
    category: 'principal',
    available: true,
    ingredients: []
  }

  async ngOnInit() {
    const params = this.route.snapshot.paramMap
    this.restaurantId = params.get('restaurantId')
    this.dishId = params.get('id')
    this.isEditing = !!this.dishId

    try {
      this.allIngredients = await firstValueFrom(this.ingredientApi.list(this.restaurantId))
    } catch {
      return
    }
    if (!this.dishId) return

    const cached = this.store.findById(this.restaurantId, this.dishId)
    if (cached) {
      this.dish = this.toFormValue(cached)
      return
    }
    this.loading = true
    try {
      this.dish = this.toFormValue(await firstValueFrom(this.dishApi.get(this.restaurantId, this.dishId)))
    } catch {
      this.showError('No se pudo cargar el plato.')
    } finally {
      this.loading = false
    }
  }

  private toFormValue(dish: Dish): DishFormValue {
    return {
      name: dish.name,
      description: dish.description,
      price: dish.price,
      category: dish.category,
      available: dish.available,
      ingredients: dish.ingredients
    }
  }

  selectCategory(c: DishCategory) {
    this.dish.category = c
  }

  toggleAvailable() {
    this.dish.available = !this.dish.available
  }

  showError(msg: string, persistent = false) {
    this.error = msg
    if (!persistent) setTimeout(() => this.error = null, 10000)
  }

  private validationSummary(count: number): string {
    return 'Revisa los campos marcados (' + count + (count === 1 ? ' error)' : ' errores)')
  }

  onFieldChange() {
    if (!this.error || Object.keys(this.errors).length === 0) return
    this.errors = validateDishForm(this.dish)
    const count = Object.keys(this.errors).length
    this.error = count ? this.validationSummary(count) : null
  }

  async save() {
    this.errors = validateDishForm(this.dish)
    const count = Object.keys(this.errors).length
    if (count > 0) {
      // el resumen permanece visible hasta corregir o cerrar (WCAG 2.2.1)
      this.showError(this.validationSummary(count), true)
      document.getElementById(this.errors.name ? 'dish-name' : 'dish-price')?.focus()
      return
    }

    this.loading = true
    try {
      await this.store.save(this.restaurantId, toDishDto(this.dish), this.dishId ?? undefined)
      this.loading = false
      this.router.navigate(['/restaurants/' + this.restaurantId + '/dishes'])
    } catch (err) {
      this.loading = false
      this.showError(extractApiError(err, 'Error al guardar el plato.'))
    }
  }
}
