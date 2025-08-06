// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { NgChartsModule } from '@ng-charts/ng-charts';
// import { ChartOptions, ChartType } from 'chart.js';

// @Component({
//   selector: 'app-reports',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     NgChartsModule,
//     MatProgressSpinnerModule
//   ],
//   templateUrl: './reports.component.html',
//   styleUrls: ['./reports.component.scss']
// })
// export class ReportsComponent implements OnInit {

//   // Chart 1: Outages by Region (dummy data)
//   barChartLabels: string[] = ['Mjini Magharibi', 'Kaskazini Unguja', 'Kusini Unguja', 'Kaskazini Pemba', 'Kusini Pemba'];
//   barChartData = [{ data: [15, 10, 7, 3, 5], label: 'Outages by Region' }];
//   barChartOptions: ChartOptions = {
//     responsive: true,
//     plugins: {
//       legend: { position: 'bottom' }
//     },
//     scales: {
//       y: {
//         beginAtZero: true
//       }
//     }
//   };
//   barChartType: ChartType = 'bar';

//   // Chart 2: Outages by Type (dummy data)
//   pieChartLabels: string[] = ['Transformer Fault', 'Line Cut', 'Overload', 'Unknown'];
//   pieChartData = [{ data: [12, 8, 4, 6] }];
//   pieChartOptions: ChartOptions = {
//     responsive: true,
//     plugins: {
//       legend: { position: 'bottom' }
//     }
//   };
//   pieChartType: ChartType = 'pie';

//   isLoading = false;

//   constructor() {}

//   ngOnInit(): void {
//     // For now, no backend loading, just display dummy stats
//   }
// }
