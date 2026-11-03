import { Component, OnInit, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { EmployeeApi } from '../../api/employee.api'
import { EmployeeStore } from '../../store/employee.store'

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

  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private api = inject(EmployeeApi)
  private store = inject(EmployeeStore)

  ngOnInit() {
    this.restaurantId = this.route.snapshot.paramMap.get('restaurantId')
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
    this.api.create(this.employee).subscribe(res => {
      this.loading = false
      this.store.add(res)
      this.router.navigate(['/restaurants/' + this.restaurantId + '/employees'])
    }, err => {
      this.loading = false
      this.error = err.error && err.error.message ? err.error.message : 'Error al crear el empleado.'
    })
  }
}
