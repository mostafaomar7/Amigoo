import { Component, OnInit } from '@angular/core';
import { ApifunctionService } from '../../services/apifunction.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sweat',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sweat.component.html',
  styleUrls: ['./sweat.component.css']
})
export class SweatComponent implements OnInit {

  alldata :[];
  constructor(private serv : ApifunctionService) { }
  getdata(){
    this.serv.getdata().subscribe((data:any)=>{
      this.alldata=data;
      console.log(this.alldata);

    }, error=>{
      alert(error)
    })
  }
  ngOnInit(): void {
    this.getdata()
  }

}
