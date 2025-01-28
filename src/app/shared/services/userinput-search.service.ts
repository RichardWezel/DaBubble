import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserinputSearchService {

   // BehaviorSubject hält den aktuellen Wert und gibt ihn an neue Abonnenten weiter
   private userInputSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  
   // Observable für andere Komponenten zum Abonnieren
   public userInput$: Observable<string> = this.userInputSubject.asObservable();
   
   constructor() { }
   
   /**
    * Setzt den aktuellen Benutzerinput und benachrichtigt alle Abonnenten.
    * @param input - Der neue Benutzerinput.
    */
   setUserInput(input: string): void {
     this.userInputSubject.next(input);
   }
   
   /**
    * Gibt den aktuellen Wert des Benutzerinputs zurück.
    * @returns Der aktuelle Benutzerinput.
    */
   getUserInput(): string {
     return this.userInputSubject.value;
   }
}
