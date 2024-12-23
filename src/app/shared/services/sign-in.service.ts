import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SignInService {
  signInData = {
    name: "",
    email: "",
    password: "",
    checkboxChecked: false,
    img: ""
  }
  
  constructor() { }


  /**
   * Resets the signInData.
   */
  resetSignInData() {
    this.signInData = {
      name: "",
      email: "",
      password: "",
      checkboxChecked: false,
      img: ""
    }
  }

}
