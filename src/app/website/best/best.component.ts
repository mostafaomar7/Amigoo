import { Component, OnInit } from '@angular/core';
import { ApifunctionService } from '../../services/apifunction.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-best',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './best.component.html',
  styleUrls: ['./best.component.css']
})
export class BestComponent implements OnInit {

  alldata = {};
  quantity;
  id:any;
  data : any ={}
    constructor(private serv : ApifunctionService , private route:ActivatedRoute) {

    }
    getdata(){
      this.serv.getdata().subscribe((data:any)=>{
        this.alldata=data;
        this.alldata = Object.values(this.alldata);  // تحويل الكائن إلى مصفوفة
        console.log(this.alldata);

      }, error=>{
        alert(error)
      })
    }

    // getValueAtIndex2(): string {
    //   return this.alldata[2];
    // }
  ngOnInit(): void {
    this.getdata()
  }


}
