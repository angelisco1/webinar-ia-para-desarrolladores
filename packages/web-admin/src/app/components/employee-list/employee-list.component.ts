import { Component, OnInit, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { EmployeeStore } from '../../store/employee.store'

@Component({
  selector: 'app-employee-list',
  standalone: false,
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
  private store = inject(EmployeeStore)
  private route = inject(ActivatedRoute)

  restaurantId: string = this.route.snapshot.paramMap.get('restaurantId')
  employees = this.store.employees

  ngOnInit() {
    this.store.load(this.restaurantId)
  }

  getRoleBadgeClass(role) {
    if (role == 'admin') {
      return 'badge'
    } else {
      return 'badge badge-muted'
    }
  }
}
