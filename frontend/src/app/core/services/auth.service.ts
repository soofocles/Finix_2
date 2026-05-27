import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, tap, timeout } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';
  
  // To track if the user is authenticated throughout the app
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      timeout(15000),
      tap((res: any) => {
        if (res.success && res.data) {
          if (res.data.accessToken) {
            this.setToken(res.data.accessToken);
          }
          if (res.data.user) {
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData).pipe(
      timeout(15000),
      tap((res: any) => {
        if (res.success && res.data) {
          if (res.data.accessToken) {
            this.setToken(res.data.accessToken);
          }
          if (res.data.user) {
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isAuthenticatedSubject.next(false);
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
    this.isAuthenticatedSubject.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  getUser(): any {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  getUserName(): string {
    const user = this.getUser();
    return user ? user.name : 'Usuario';
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`).pipe(
      tap((res: any) => {
        if (res.success && res.data) {
          localStorage.setItem('user', JSON.stringify(res.data));
        }
      })
    );
  }
}
