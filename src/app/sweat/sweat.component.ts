import { Component, OnInit } from '@angular/core';
import { ApifunctionService } from '../sharedservice/apifunction.service';

@Component({
  selector: 'app-sweat',
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
