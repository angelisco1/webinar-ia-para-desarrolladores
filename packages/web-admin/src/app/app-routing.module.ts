import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { LoginComponent } from '@resttek/web-shared'
import { AuthGuard } from './auth.guard'
import { ShellComponent } from './components/shell/shell.component'
import { NotFoundComponent } from './components/not-found/not-found.component'
import { DashboardComponent } from './components/dashboard/dashboard.component'
import { RestaurantListComponent } from './components/restaurant-list/restaurant-list.component'
import { RestaurantFormComponent } from './components/restaurant-form/restaurant-form.component'
import { RestaurantDashboardComponent } from './components/restaurant-dashboard/restaurant-dashboard.component'
import { DishListComponent } from './components/dish-list/dish-list.component'
import { DishFormComponent } from './components/dish-form/dish-form.component'
import { IngredientListComponent } from './components/ingredient-list/ingredient-list.component'
import { IngredientFormComponent } from './components/ingredient-form/ingredient-form.component'
import { EmployeeListComponent } from './components/employee-list/employee-list.component'
import { EmployeeFormComponent } from './components/employee-form/employee-form.component'
import { TableListComponent } from './components/table-list/table-list.component'
import { TableFormComponent } from './components/table-form/table-form.component'

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'restaurants', component: RestaurantListComponent },
      { path: 'restaurants/new', component: RestaurantFormComponent },
      { path: 'restaurants/:id/edit', component: RestaurantFormComponent },
      { path: 'restaurants/:restaurantId', redirectTo: 'restaurants/:restaurantId/dashboard', pathMatch: 'full' },
      { path: 'restaurants/:restaurantId/dashboard', component: RestaurantDashboardComponent },
      { path: 'restaurants/:restaurantId/dishes', component: DishListComponent },
      { path: 'restaurants/:restaurantId/dishes/new', component: DishFormComponent },
      { path: 'restaurants/:restaurantId/dishes/:id/edit', component: DishFormComponent },
      { path: 'restaurants/:restaurantId/ingredients', component: IngredientListComponent },
      { path: 'restaurants/:restaurantId/ingredients/new', component: IngredientFormComponent },
      { path: 'restaurants/:restaurantId/ingredients/:id/edit', component: IngredientFormComponent },
      { path: 'restaurants/:restaurantId/tables', component: TableListComponent },
      { path: 'restaurants/:restaurantId/tables/new', component: TableFormComponent },
      { path: 'restaurants/:restaurantId/tables/:id/edit', component: TableFormComponent },
      { path: 'restaurants/:restaurantId/employees', component: EmployeeListComponent },
      { path: 'restaurants/:restaurantId/employees/new', component: EmployeeFormComponent }
    ]
  },
  { path: '**', component: NotFoundComponent }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
