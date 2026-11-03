import { DishCategory, DishDto, DishIngredient } from '../../models/dish.model'

export interface DishFormValue {
  name: string
  description: string | null
  price: string | number
  category: DishCategory
  available: boolean
  ingredients: DishIngredient[]
}

export function toDishDto(value: DishFormValue): DishDto {
  return {
    name: value.name,
    description: value.description,
    price: parseFloat(String(value.price)),
    category: value.category,
    available: value.available,
    ingredients: value.ingredients
  }
}
