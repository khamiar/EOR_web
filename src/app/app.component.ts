import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {
  title = 'eo-reporter';

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    // Initialize theme system - the service will automatically load the saved theme
    // and apply it to the entire application
    this.themeService.watchSystemTheme();
  }
}
