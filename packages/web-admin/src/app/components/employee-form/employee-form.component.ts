import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { DataService } from '../../data.service'

@Component({
  selector: 'app-employee-form',
  standalone: false,
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.css']
})
export class EmployeeFormComponent implements OnInit {
  loading = false
  error = null
  restaurantId = null

  roles = ['manager', 'camarero', 'cocinero']

  employee: any = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'camarero',
    restaurantId: null
  }

  constructor(private router: Router, private dataService: DataService) {}

  ngOnInit() {
    this.restaurantId = this.dataService.currentRestaurantId || this.dataService.getRestaurantIdFromUrl()
    this.employee.restaurantId = this.restaurantId
  }

  save() {
    this.error = null
    if (this.employee.firstName == '' || this.employee.lastName == '') {
      this.error = 'Nombre y apellido son obligatorios'
      return
    }
    if (this.employee.email.indexOf('@') == -1) {
      this.error = 'El email no es valido'
      return
    }
    if (this.employee.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres'
      return
    }
    this.loading = true
    this.dataService.createEmployee(this.employee).subscribe(res => {
      this.loading = false
      this.dataService.employees.push(res)
      this.router.navigate(['/restaurants/' + this.restaurantId + '/employees'])
    }, err => {
      this.loading = false
      this.error = err.error && err.error.message ? err.error.message : 'Error al crear el empleado.'
    })
  }
}
