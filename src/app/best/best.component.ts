import { Component, OnInit } from '@angular/core';
import { ApifunctionService } from '../sharedservice/apifunction.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-best',
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
