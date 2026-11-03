import { Component, OnInit, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { TableApi } from '../../api/table.api'
import { Table } from '../../models/table.model'
import { DialogService } from '../../shared/dialog.service'
import { extractApiError } from '../../shared/api-error'

@Component({
  selector: 'app-table-list',
  standalone: false,
  templateUrl: './table-list.component.html',
  styleUrls: ['./table-list.component.css']
})
export class TableListComponent implements OnInit {
  private api = inject(TableApi)
  private route = inject(ActivatedRoute)
  private dialog = inject(DialogService)

  restaurantId: string = this.route.snapshot.paramMap.get('restaurantId')
  tables: Table[] = []
  loading = false
  error: string | null = null

  ngOnInit() {
    this.load()
  }

  load() {
    this.loading = true
    this.error = null
    this.api.list(this.restaurantId).subscribe({
      next: tables => {
        this.tables = tables
        this.loading = false
      },
      error: () => {
        this.error = 'No se pudieron cargar las mesas.'
        this.loading = false
      }
    })
  }

  deleteTable(id: string) {
    if (!this.dialog.confirm('¿Estás seguro de eliminar esta mesa?')) return
    this.error = null
    this.api.remove(this.restaurantId, id).subscribe({
      next: () => this.load(),
      error: err => {
        this.error = extractApiError(err, 'Error al eliminar la mesa.')
      }
    })
  }
}
