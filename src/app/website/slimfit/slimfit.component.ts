import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar.component';

@Component({
  selector: 'app-slimfit',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './slimfit.component.html',
  styleUrls: ['./slimfit.component.css']
})
export class SlimfitComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
