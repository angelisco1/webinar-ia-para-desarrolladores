import { NgModule, provideZoneChangeDetection } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { FormsModule } from '@angular/forms'
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'
import {
  LucideAngularModule,
  LayoutDashboard, Users, Utensils, Package, LogOut, Plus,
  Edit, Trash2, Check, AlertCircle, X, ChevronLeft, ChevronRight, Search, Menu, Settings, Store, Armchair
} from 'lucide-angular'
import { API_URL } from '@resttek/web-shared'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { AuthInterceptor } from './auth.interceptor'
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
import { CategoryLabelPipe } from './shared/category-label.pipe'
import { PriceFormatPipe } from './shared/price-format.pipe'
import { AutofocusDirective } from './shared/autofocus.directive'
import { DishIngredientsEditorComponent } from './components/dish-form/dish-ingredients-editor/dish-ingredients-editor.component'

@NgModule({
  declarations: [
    AppComponent,
    ShellComponent,
    NotFoundComponent,
    DashboardComponent,
    RestaurantListComponent,
    RestaurantFormComponent,
    RestaurantDashboardComponent,
    DishListComponent,
    DishFormComponent,
    IngredientListComponent,
    IngredientFormComponent,
    EmployeeListComponent,
    EmployeeFormComponent,
    TableListComponent,
    TableFormComponent,
    DishIngredientsEditorComponent,
    CategoryLabelPipe,
    PriceFormatPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AutofocusDirective,
    AppRoutingModule,
    LucideAngularModule.pick({
      LayoutDashboard, Users, Utensils, Package, LogOut, Plus,
      Edit, Trash2, Check, AlertCircle, X, ChevronLeft, ChevronRight, Search, Menu, Settings, Store, Armchair
    })
  ],
  providers: [
    provideZoneChangeDetection(),
    // el login de web-shared lo necesita
    { provide: API_URL, useValue: '/api/v1' },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
