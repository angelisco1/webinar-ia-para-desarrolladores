import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { TableSessionStore } from '../store/table-session.store'

export const tableSelectedGuard: CanActivateFn = (route) => {
  const id = route.paramMap.get('id') ?? ''
  if (inject(TableSessionStore).hasTableFor(id)) {
    return true
  }
  return inject(Router).createUrlTree(['/restaurants', id, 'mesas'])
}
