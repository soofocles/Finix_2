import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FinanceRecord {
  _id?: string;
  tipo: 'ingreso' | 'gasto';
  monto: number;
  categoria: string;
  fecha: string;
  descripcion?: string;
}

export interface FinanceAnalysis {
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  categoriaMayorGasto?: string;
  gastoPorCategoria?: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private apiUrl = environment.apiUrl + '/personal-finance';

  constructor(private http: HttpClient) {}

  getFinances(page: number = 1, limit: number = 10): Observable<{success: boolean, data: FinanceRecord[]}> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<{success: boolean, data: FinanceRecord[]}>(this.apiUrl, { params });
  }

  createFinance(data: FinanceRecord): Observable<{success: boolean}> {
    return this.http.post<{success: boolean}>(this.apiUrl, data);
  }

  getAnalysis(): Observable<{success: boolean, data: FinanceAnalysis}> {
    return this.http.get<{success: boolean, data: FinanceAnalysis}>(`${this.apiUrl}/analysis`);
  }

  updateFinance(id: string, data: FinanceRecord): Observable<{success: boolean}> {
    return this.http.put<{success: boolean}>(`${this.apiUrl}/${id}`, data);
  }

  deleteFinance(id: string): Observable<{success: boolean}> {
    return this.http.delete<{success: boolean}>(`${this.apiUrl}/${id}`);
  }
}
