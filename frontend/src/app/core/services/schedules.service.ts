import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Schedule {
  _id?: string;
  titulo: string;
  monto: number;
  frecuencia: string;
  fechaInicio: string;
  activa?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SchedulesService {
  private apiUrl = environment.apiUrl + '/personal-finance/schedules';
  constructor(private http: HttpClient) {}

  getAll(): Observable<{success: boolean, data: Schedule[]}> { return this.http.get<{success: boolean, data: Schedule[]}>(this.apiUrl); }
  create(data: Partial<Schedule>) { return this.http.post(this.apiUrl, data); }
  getById(id: string) { return this.http.get(`${this.apiUrl}/${id}`); }
  update(id: string, data: Partial<Schedule>) { return this.http.put(`${this.apiUrl}/${id}`, data); }
  delete(id: string) { return this.http.delete(`${this.apiUrl}/${id}`); }
  execute(id: string) { return this.http.post(`${this.apiUrl}/${id}/execute`, {}); }
}
