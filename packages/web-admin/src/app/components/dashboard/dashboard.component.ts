import { Component } from '@angular/core'

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  user = JSON.parse(localStorage.getItem('auth_user'))
}
