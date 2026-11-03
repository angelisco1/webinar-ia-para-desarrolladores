import { Component, OnInit, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TableApi } from '../../api/table.api'
import { TABLE_STATUSES, TableInput } from '../../models/table.model'
import { extractApiError } from '../../shared/api-error'

@Component({
  selector: 'app-table-form',
  standalone: false,
  templateUrl: './table-form.component.html',
  styleUrls: ['./table-form.component.css']
})
export class TableFormComponent implements OnInit {
  private api = inject(TableApi)
  private route = inject(ActivatedRoute)
  private router = inject(Router)

  restaurantId: string = this.route.snapshot.paramMap.get('restaurantId')
  tableId: string | null = this.route.snapshot.paramMap.get('id')
  isEditing = !!this.tableId
  loading = false
  error: string | null = null

  statuses = TABLE_STATUSES

  table: { number: number | null; description: string | null; capacity: number | null; status: TableInput['status'] } = {
    number: null,
    description: '',
    capacity: null,
    status: 'libre'
  }

  ngOnInit() {
    if (!this.isEditing) return
    this.loading = true
    this.api.get(this.restaurantId, this.tableId).subscribe({
      next: t => {
        this.table = { number: t.number, description: t.description, capacity: t.capacity, status: t.status }
        this.loading = false
      },
      error: err => {
        this.error = extractApiError(err, 'No se pudo cargar la mesa.')
        this.loading = false
      }
    })
  }

  save() {
    this.error = null
    if (!Number.isInteger(this.table.number) || this.table.number <= 0) {
      this.error = 'El número de mesa debe ser un entero mayor que 0'
      return
    }
    if (!Number.isInteger(this.table.capacity) || this.table.capacity <= 0) {
      this.error = 'La capacidad debe ser un entero mayor que 0'
      return
    }
    this.loading = true
    const body: TableInput = {
      number: this.table.number,
      description: this.table.description?.trim() || null,
      capacity: this.table.capacity,
      status: this.table.status
    }
    const req = this.isEditing
      ? this.api.update(this.restaurantId, this.tableId, body)
      : this.api.create(this.restaurantId, body)
    req.subscribe({
      next: () => {
        this.loading = false
        this.router.navigate(['/restaurants/' + this.restaurantId + '/tables'])
      },
      error: err => {
        this.loading = false
        this.error = extractApiError(err, 'Error al guardar la mesa.')
      }
    })
  }
}
