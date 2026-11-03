export type DishCategory = 'entrante' | 'principal' | 'postre' | 'bebida'

// Única fuente de categorías: chips = claves, etiqueta = valor
export const DISH_CATEGORIES: Record<DishCategory, string> = {
  entrante: 'Entrante',
  principal: 'Principal',
  postre: 'Postre',
  bebida: 'Bebida'
}

export interface DishIngredient {
  ingredientId: string
  quantity: number
}

export interface Dish {
  id: string
  name: string
  description: string | null
  price: number
  category: DishCategory
  available: boolean
  restaurantId: string
  ingredients: DishIngredient[]
  createdAt: string
  updatedAt: string
}

export type DishDto = Omit<Dish, 'id' | 'restaurantId' | 'createdAt' | 'updatedAt'>
