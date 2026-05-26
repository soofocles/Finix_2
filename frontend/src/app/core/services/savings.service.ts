import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SavingsGoal {
  _id?: string;
  titulo: string;
  descripcion?: string;
  montoObjetivo: number;
  montoActual?: number;
  fechaObjetivo?: string;
}

@Injectable({ providedIn: 'root' })
export class SavingsService {
  private apiUrl = environment.apiUrl + '/personal-finance/savings';
  constructor(private http: HttpClient) {}

  getAll(): Observable<{success: boolean, data: SavingsGoal[]}> {
    return this.http.get<{success: boolean, data: SavingsGoal[]}>(this.apiUrl);
  }

  create(data: Partial<SavingsGoal>) { return this.http.post(this.apiUrl, data); }
  getById(id: string) { return this.http.get(`${this.apiUrl}/${id}`); }
  update(id: string, data: Partial<SavingsGoal>) { return this.http.put(`${this.apiUrl}/${id}`, data); }
  delete(id: string) { return this.http.delete(`${this.apiUrl}/${id}`); }
  contribute(id: string, payload: { personalFinanceId?: string, monto: number }) {
    return this.http.post(`${this.apiUrl}/${id}/contribute`, payload);
  }
}
