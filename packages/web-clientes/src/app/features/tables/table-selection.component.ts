import { Component, inject, signal } from '@angular/core'
import { HttpErrorResponse } from '@angular/common/http'
import { ActivatedRoute, Router } from '@angular/router'
import { TableService } from '../../core/services/table.service'
import { TableSessionStore } from '../../core/store/table-session.store'
import { Table } from '../../core/models/table.model'

@Component({
  selector: 'app-table-selection',
  standalone: true,
  template: `
    <div class="container">
      <div class="page-header">
        <h1>Elige tu mesa</h1>
        <p>Indica cuántas personas sois y selecciona una mesa libre</p>
      </div>

      <div class="search-row">
        <label for="guests">Personas</label>
        <input id="guests" type="number" min="1" step="1" [value]="guests()" (input)="onGuests($event)" />
        <button class="btn btn-primary search" [disabled]="loading()" (click)="search()">Buscar mesas</button>
      </div>

      @if (validation()) {
        <p class="validation error-msg">{{ validation() }}</p>
      }
      @if (error()) {
        <p class="error-msg">{{ error() }}</p>
      }

      @if (searched()) {
        @if (tables().length === 0) {
          <div class="empty-state card">
            <p>No hay mesas libres para {{ searchedGuests() }} personas</p>
          </div>
        } @else {
          <div class="table-grid">
            @for (table of tables(); track table.id) {
              <div class="table-card card" [class.selected]="selected()?.id === table.id" (click)="select(table)">
                <h3>Mesa {{ table.number }}</h3>
                @if (table.description) {
                  <p>{{ table.description }}</p>
                }
                <p class="capacity">Capacidad: {{ table.capacity }}</p>
              </div>
            }
          </div>
        }
      }

      <button class="btn btn-primary continue" [disabled]="!selected() || loading()" (click)="continue()">Continuar</button>
    </div>
  `,
  styles: [`
    .container { max-width: 900px; margin: 0 auto; }
    .search-row { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
    .search-row input { width: 100px; }
    .table-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .table-card { padding: 16px; cursor: pointer; }
    .table-card.selected { border-color: var(--green-medium); }
    .capacity { color: var(--text-muted); font-size: 13px; }
    .error-msg { color: var(--red); font-size: 13px; margin-bottom: 12px; }
  `]
})
export class TableSelectionComponent {
  private readonly tableService = inject(TableService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly session = inject(TableSessionStore)
  private readonly restaurantId = this.route.snapshot.paramMap.get('id') ?? ''

  readonly guests = signal('')
  readonly tables = signal<Table[]>([])
  readonly selected = signal<Table | null>(null)
  readonly loading = signal(false)
  readonly error = signal<string | null>(null)
  readonly validation = signal<string | null>(null)
  readonly searched = signal(false)
  readonly searchedGuests = signal(0)

  onGuests(event: Event): void {
    this.guests.set((event.target as HTMLInputElement).value)
  }

  search(): void {
    const value = this.guests().trim()
    const guests = Number(value)
    if (value === '' || !Number.isInteger(guests) || guests < 1) {
      this.validation.set('Indica un número entero de personas mayor o igual que 1')
      return
    }
    this.validation.set(null)
    this.load(guests)
  }

  select(table: Table): void {
    this.selected.set(table)
  }

  continue(): void {
    const table = this.selected()
    if (!table || this.loading()) return

    this.loading.set(true)
    this.error.set(null)
    this.tableService.occupy(this.restaurantId, table.id).subscribe({
      next: (occupied) => {
        this.session.select(this.restaurantId, occupied)
        this.loading.set(false)
        this.router.navigate(['/restaurants', this.restaurantId])
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false)
        if (err.status === 409) {
          this.load(this.searchedGuests(), 'Esa mesa acaba de ser ocupada, elige otra')
        } else {
          this.error.set('Error al ocupar la mesa. Inténtalo de nuevo.')
        }
      }
    })
  }

  private load(guests: number, notice: string | null = null): void {
    this.loading.set(true)
    this.error.set(notice)
    this.selected.set(null)
    this.tableService.getAvailable(this.restaurantId, guests).subscribe({
      next: (tables) => {
        this.tables.set(tables)
        this.searchedGuests.set(guests)
        this.searched.set(true)
        this.loading.set(false)
      },
      error: () => {
        this.error.set('Error al cargar las mesas. Inténtalo de nuevo.')
        this.loading.set(false)
      }
    })
  }
}
