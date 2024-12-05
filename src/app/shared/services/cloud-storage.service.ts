import { inject, Injectable } from '@angular/core';
import { ref, Storage, uploadBytesResumable } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class CloudStorageService {
  cloud = inject(Storage)

  constructor() { }

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
