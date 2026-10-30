import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { DataService } from '../../data.service'
import { ShellComponent } from '../shell/shell.component'

@Component({
  selector: 'app-restaurant-form',
  standalone: false,
  templateUrl: './restaurant-form.component.html',
  styleUrls: ['./restaurant-form.component.css']
})
export class RestaurantFormComponent implements OnInit {
  isEditing = false
  restaurantId = null
  loading = false
  error = null

  restaurant: any = {
    name: '',
    address: '',
    email: '',
    phone: '',
    ownerFirstName: '',
    ownerLastName: '',
    logoUrl: null
  }

  constructor(private route: ActivatedRoute, private router: Router, private dataService: DataService) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true
        this.restaurantId = params['id']
        this.loading = true
        this.dataService.getRestaurant(params['id']).subscribe(data => {
          this.restaurant = data
          this.loading = false
        }, err => {
          this.error = 'No se pudo cargar el restaurante.'
          this.loading = false
        })
      }
    })
  }

  save() {
    this.error = null

    // validaciones
    if (this.restaurant.name == '' || this.restaurant.name == null) {
      this.error = 'El nombre es obligatorio'
      return
    }
    if (this.restaurant.email == '' || this.restaurant.email.indexOf('@') == -1) {
      this.error = 'El email no es valido'
      return
    }
    if (this.restaurant.address == '') {
      this.error = 'La direccion es obligatoria'
      return
    }
    if (this.restaurant.phone == '') {
      this.error = 'El telefono es obligatorio'
      return
    }

    this.loading = true
    var body = {
      name: this.restaurant.name,
      address: this.restaurant.address,
      email: this.restaurant.email,
      phone: this.restaurant.phone,
      ownerFirstName: this.restaurant.ownerFirstName,
      ownerLastName: this.restaurant.ownerLastName,
      logoUrl: this.restaurant.logoUrl
    }
    this.dataService.saveRestaurant(body, this.restaurantId).subscribe(res => {
      this.loading = false
      // refrescamos el menu lateral
      ShellComponent.instance.loadRestaurants()
      this.router.navigate(['/restaurants'])
    }, err => {
      this.loading = false
      this.error = err.error && err.error.message ? err.error.message : 'Error al guardar el restaurante.'
    })
  }
}
