import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Debt {
  _id?: string;
  acreedor: string;
  descripcion?: string;
  principal: number;
  saldo: number;
}

@Injectable({ providedIn: 'root' })
export class DebtsService {
  private apiUrl = environment.apiUrl + '/personal-finance/debts';
  constructor(private http: HttpClient) {}

  getAll(): Observable<{success: boolean, data: Debt[]}> { return this.http.get<{success: boolean, data: Debt[]}>(this.apiUrl); }
  create(data: Partial<Debt>) { return this.http.post(this.apiUrl, data); }
  getById(id: string) { return this.http.get(`${this.apiUrl}/${id}`); }
  update(id: string, data: Partial<Debt>) { return this.http.put(`${this.apiUrl}/${id}`, data); }
  delete(id: string) { return this.http.delete(`${this.apiUrl}/${id}`); }
  pay(id: string, payload: { personalFinanceId?: string, monto: number }) { return this.http.post(`${this.apiUrl}/${id}/pay`, payload); }
}
