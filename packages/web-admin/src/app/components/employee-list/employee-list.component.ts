import { Component, OnInit } from '@angular/core'
import { DataService } from '../../data.service'

@Component({
  selector: 'app-employee-list',
  standalone: false,
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {

  constructor(public dataService: DataService) {}

  ngOnInit() {
    this.dataService.employees = []
    this.dataService.getEmployees(this.dataService.getRestaurantIdFromUrl())
  }

  getRoleBadgeClass(role) {
    if (role == 'admin') {
      return 'badge'
    } else {
      return 'badge badge-muted'
    }
  }
}
