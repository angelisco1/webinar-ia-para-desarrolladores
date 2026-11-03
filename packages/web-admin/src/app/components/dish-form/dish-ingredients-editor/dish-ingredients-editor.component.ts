import { Component, input, output } from '@angular/core'
import { DishIngredient } from '../../../models/dish.model'
import { Ingredient } from '../../../models/ingredient.model'
import { addIngredient, ingredientLabel, removeIngredient } from '../dish-ingredients'

@Component({
  selector: 'app-dish-ingredients-editor',
  standalone: false,
  templateUrl: './dish-ingredients-editor.component.html',
  styleUrls: ['./dish-ingredients-editor.component.css']
})
export class DishIngredientsEditorComponent {
  all = input.required<Ingredient[]>()
  selected = input.required<DishIngredient[]>()
  selectedChange = output<DishIngredient[]>()

  newIngredientId = ''
  newIngredientQty = 1

  label(id: string): string {
    return ingredientLabel(this.all(), id)
  }

  add() {
    const next = addIngredient(this.selected(), this.newIngredientId, this.newIngredientQty)
    if (next === this.selected()) return
    this.selectedChange.emit(next)
    this.newIngredientId = ''
    this.newIngredientQty = 1
  }

  remove(id: string) {
    this.selectedChange.emit(removeIngredient(this.selected(), id))
  }
}
