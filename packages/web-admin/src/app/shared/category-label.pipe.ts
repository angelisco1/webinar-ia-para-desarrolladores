import { Pipe, PipeTransform } from '@angular/core'
import { DISH_CATEGORIES, DishCategory } from '../models/dish.model'

@Pipe({ name: 'categoryLabel', standalone: false })
export class CategoryLabelPipe implements PipeTransform {
  transform(category: string): string {
    return DISH_CATEGORIES[category as DishCategory] ?? category
  }
}
