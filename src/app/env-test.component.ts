import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-env-test',
  standalone: true,
  template: ''
})
export class EnvTestComponent implements OnInit {
  ngOnInit() {
    try {
      console.log('Testing import.meta.env:', (import.meta as any).env);
    } catch (e) {
      console.log('import.meta.env not available');
    }
  }
}
