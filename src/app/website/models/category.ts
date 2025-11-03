export class Addcategory{
    _id: number;
    name: string;
    image: string;
}
export interface Categoryinfo {
    _id?: string;
    name: string;
    slug: string;
    image: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface Productinfo {
  _id: '',
    title: string,
    slug: '',
    description: '',
    price: '',
    priceAfterDiscount: '',
    originalQuantity: '',
    quantity: '',
    imageCover: string,
    images: any[],
    size: string[]; // ✅ حدد أن `size` هو مصفوفة نصوص
    category: { _id: string }
  };


  
  export interface ProductResponse {
    data: Productinfo[];
  }
export interface CategoryResponse {
    data: Categoryinfo[];
}
export interface Contact {
  name: string;
  email: string;
  phone: string;
  termsAccepted: boolean;
  message: string;
}
export interface Order {
  fullName: string;
  country: string;
  streetAddress: string;
  state: string;
  phone: string;
  email: string;
  shippingAddress: boolean;
  orderNotes?: string;
  localStorge: any[]; 
}
export class Clientinfo{
    constructor(public _id: number,
    public name: string,
){}
    
}
export class Clientlogin{
    public email: string ;
    public password : string;
}
interface ClientLoginn {
    email: string;
    password: string;
  }