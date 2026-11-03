import { DishIngredient } from '../../models/dish.model'
import { Ingredient } from '../../models/ingredient.model'

export function addIngredient(list: DishIngredient[], ingredientId: string, quantity: number): DishIngredient[] {
  if (!ingredientId || quantity <= 0) return list
  if (list.some(i => i.ingredientId == ingredientId)) return list
  return [...list, { ingredientId, quantity }]
}

export function removeIngredient(list: DishIngredient[], ingredientId: string): DishIngredient[] {
  return list.filter(i => i.ingredientId != ingredientId)
}

export function ingredientLabel(all: Ingredient[], id: string): string {
  const ing = all.find(i => i.id == id)
  return ing ? `${ing.name} (${ing.unit})` : id
}
