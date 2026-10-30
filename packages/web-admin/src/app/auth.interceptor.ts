import { Injectable } from '@angular/core'
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    var token = localStorage.getItem('auth_token')
    if (token) {
      req = req.clone({ setHeaders: { Authorization: 'Bearer ' + token } })
    }
    return next.handle(req).pipe(
      catchError((err: any) => {
        if (err.status == 401 && window.location.pathname != '/login') {
          localStorage.clear()
          window.location.href = '/login'
        }
        return throwError(err)
      })
    )
  }
}
