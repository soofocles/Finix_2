import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports {
  hasData = false;
}
