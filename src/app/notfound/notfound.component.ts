import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notfound',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './notfound.component.html',
  styleUrls: ['./notfound.component.css']
})
export class NotfoundComponent implements OnInit {
  backgroundImageUrl = 'assets/img/404/404.png';

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  goBack(): void {
    window.history.back();
  }

}
