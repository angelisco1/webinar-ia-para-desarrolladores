import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { DISH_CATEGORIES, Dish } from '../../models/dish.model'
import { DialogService } from '../../shared/dialog.service'
import { DishStore } from '../../store/dish.store'

@Component({
  selector: 'app-dish-list',
  standalone: false,
  templateUrl: './dish-list.component.html',
  styleUrls: ['./dish-list.component.css']
})
export class DishListComponent implements OnInit {
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private store = inject(DishStore)
  private dialog = inject(DialogService)

  restaurantId: string = this.route.snapshot.paramMap.get('restaurantId')
  loading = this.store.loading
  error = this.store.error
  message = signal<string | null>(null)
  filter = signal('todos')
  categories = ['todos', ...Object.keys(DISH_CATEGORIES)]

  filteredDishes = computed(() => {
    const dishes = this.store.dishes()
    const filter = this.filter()
    return filter == 'todos' ? dishes : dishes.filter(d => d.category == filter)
  })

  ngOnInit() {
    this.store.load(this.restaurantId)
  }

  goToNew() {
    this.router.navigate(['/restaurants/' + this.restaurantId + '/dishes/new'])
  }

  goToEdit(id: string) {
    this.router.navigate(['/restaurants/' + this.restaurantId + '/dishes/' + id + '/edit'])
  }

  async toggleAvailable(dish: Dish, event: Event) {
    event.stopPropagation()
    try {
      await this.store.setAvailability(this.restaurantId, dish, !dish.available)
    } catch {
      this.dialog.alert('Error al actualizar disponibilidad.')
    }
  }

  async deleteDish(id: string, event: Event) {
    event.stopPropagation()
    if (!this.dialog.confirm('¿Estás seguro de eliminar este plato?')) return
    try {
      await this.store.remove(this.restaurantId, id)
      this.message.set('Plato eliminado')
      setTimeout(() => this.message.set(null), 2000)
    } catch {
      this.dialog.alert('Error al eliminar el plato.')
    }
  }
}
