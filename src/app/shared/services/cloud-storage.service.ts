import { inject, Injectable } from '@angular/core';
import { ref, Storage, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { FirebaseStorageService } from './firebase-storage.service';

@Injectable({
  providedIn: 'root'
})
export class CloudStorageService {
  cloud = inject(Storage)
  storage = inject(FirebaseStorageService);

  uploadLine: string[] = [];
  private isUpdating: boolean = false; // Kontroll-Flag

  constructor() { }


  async uploadAsAttachment(
    input: HTMLInputElement,
    channelId: string = this.storage.currentUser.currentChannel || ''
  ): Promise<{ name: string; url: string }[]> {
    if (!input.files) return [];

    const files: FileList = input.files;
    const uploadedUrls: { name: string; url: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (!file) continue;

      // 1. Datei auf Größe prüfen
      if (file.size > 1.91 * 1024 * 1024) {
        console.error(`Datei ${file.name} überschreitet die maximal zulässige Größe.`);
        continue;
      }

      // 2. Neuen Dateinamen generieren
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
      const extension = file.name.split('.').pop();
      const newFileName = `${timestamp}.${extension}`;

      // 3. Referenz erstellen
      const storageRef = ref(this.cloud, `appendix/${channelId}/${newFileName}`);

      try {
        // 4. Datei hochladen
        const uploadTaskSnapshot = await uploadBytesResumable(storageRef, file);
        console.log(`Datei ${newFileName} erfolgreich hochgeladen.`);

        // 5. URL abrufen
        const downloadURL = await getDownloadURL(uploadTaskSnapshot.ref);
        console.log(`Download-URL: ${downloadURL}`);
        uploadedUrls.push({ name: newFileName, url: downloadURL });
      } catch (error) {
        console.error(`Fehler beim Hochladen von ${file.name}:`, error);
      }
    }

    console.log('Alle Dateien hochgeladen:', uploadedUrls);
    return uploadedUrls;
  }




  uploadFile(input: HTMLInputElement) {
    if (!input.files) return

    const files: FileList = input.files;

    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (file) {
        const storageRef = ref(this.cloud, file.name);
        uploadBytesResumable(storageRef, file);
      }
    }
  }


  openImage(url: string): string {
    const img = new Image();
    if (url.includes('googleusercontent')) {
      if (!this.uploadLine.includes(url)) {
        this.uploadLine.push(url);
        console.log(this.uploadLine);

        // updateUrl nur starten, wenn es nicht bereits läuft
        if (!this.isUpdating) {
          this.updateUrl();
        }
      }
    }
    img.src = url;
    return img.src;
  }


  async updateUrl() {
    this.isUpdating = true; // Update wird gestartet
    while (this.uploadLine.length > 0) {
      const url = this.uploadLine[0]; // Aktuelle URL holen
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Failed to fetch image: ${url}`);
          this.uploadLine.shift(); // URL aus der Warteschlange entfernen
          continue;
        }
        const blob = await response.blob();
        const user = this.storage.user.find(u => u.avatar === url);

        if (user) {
          try {
            // Den MIME-Typ des Bildes analysieren
            const contentType = blob.type;
            const extension = contentType.split('/')[1];

            // Speicherreferenz erstellen (Cloud Storage Pfad)
            const fileName = `${user.id}.${extension}`;
            const storageRef = ref(this.cloud, `profilePic/${user.id}/${fileName}`);

            // Hochladen des Blob in den Cloud Storage
            const uploadTaskSnapshot = await uploadBytesResumable(storageRef, blob, {
              contentType,
            });

            console.log(`Image uploaded successfully: ${fileName}`);

            // URL für die heruntergeladene Datei abrufen
            const downloadURL = await getDownloadURL(uploadTaskSnapshot.ref);

            // Avatar-URL im User-Objekt aktualisieren
            user.avatar = downloadURL;

            await this.storage.updateUser(user.id!, user);

            console.log('Updated user avatar URL:', downloadURL);
          } catch (error) {
            console.error('Error uploading image:', error);
          }
        }
      } catch (error) {
        console.error(`Error fetching or processing image: ${url}`, error);
      } finally {
        this.uploadLine.shift(); // URL aus der Warteschlange entfernen
      }
    }
    this.isUpdating = false; // Update abgeschlossen
  }

}
