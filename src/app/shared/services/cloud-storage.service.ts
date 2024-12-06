import { inject, Injectable } from '@angular/core';
import { ref, Storage, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { FirebaseStorageService } from './firebase-storage.service';

@Injectable({
  providedIn: 'root'
})
export class CloudStorageService {
  cloud = inject(Storage)
  storage = inject(FirebaseStorageService)

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
}
