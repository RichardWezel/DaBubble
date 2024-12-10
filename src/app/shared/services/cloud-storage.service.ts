import { inject, Injectable } from '@angular/core';
import { ref, Storage, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { FirebaseStorageService } from './firebase-storage.service';
import { UserInterface } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class CloudStorageService {
  cloud = inject(Storage)
  storage = inject(FirebaseStorageService);

  uploadLine: string[] = [];
  private isUpdating: boolean = false; // Kontroll-Flag

  constructor() { }


  async uploadAsAttachment(input: HTMLInputElement, channelId: string = this.storage.currentUser.currentChannel || ''): Promise<{ name: string; url: string }[]> {
    if (!input.files) return [];
    const files: FileList = input.files;
    const uploadedUrls: { name: string; url: string }[] = await this.getUploadUrls(files, channelId);
    return uploadedUrls;
  }


  async getUploadUrls(files: FileList, channelId: string): Promise<{ name: string; url: string }[]> {
    let uploadedUrls: { name: string; url: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (!file) continue;
      if (file.size > 1.91 * 1024 * 1024) {
        console.error('Dateigröße überschritten');
        continue;
      }
      uploadedUrls = await this.generateAppendixNameAndUpload(file, channelId, uploadedUrls);
    }
    return uploadedUrls;
  }


  async generateAppendixNameAndUpload(file: File, channelId: string, uploadedUrls: { name: string; url: string }[]) {
    const newFileName = this.getAppendixNewFileName(file);
    const storageRef = this.getAppendixStorageRef(newFileName, channelId);
    uploadedUrls = await this.uploadAppendixFile(storageRef, file, uploadedUrls, newFileName);
    return uploadedUrls;
  }


  async uploadAppendixFile(storageRef: any, file: File, uploadedUrls: { name: string; url: string }[], newFileName: string) {
    try {
      const uploadTaskSnapshot = await uploadBytesResumable(storageRef, file);
      const downloadURL = await getDownloadURL(uploadTaskSnapshot.ref);
      uploadedUrls.push({ name: newFileName, url: downloadURL });
      return uploadedUrls;
    } catch (error) {
      console.error(`Fehler beim Hochladen von ${file.name}:`, error);
      return uploadedUrls;
    }
  }


  getAppendixStorageRef(newFileName: string, channelId: string) {
    const storageRef = ref(this.cloud, `appendix/${channelId}/${newFileName}`);
    return storageRef;
  }


  getAppendixNewFileName(file: File) {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    const extension = file.name.split('.').pop();
    const newFileName = `${timestamp}.${extension}`;
    return newFileName;
  }


  openImage(url: string): string {
    const img = new Image();
    if (url.includes('googleusercontent')) {
      if (!this.uploadLine.includes(url)) {
        this.uploadLine.push(url);
        if (!this.isUpdating) this.updateUrl();
      }
    }
    img.src = url;
    return img.src;
  }


  async updateUrl() {
    this.isUpdating = true;
    while (this.uploadLine.length > 0) {
      await this.getGoogleImage();
    }
    this.isUpdating = false;
  }


  async getGoogleImage() {
    const url = this.uploadLine[0];
    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const blob = await response.blob();
      const user = this.storage.user.find(u => u.avatar === url);
      if (user) await this.copyGoogleImageToStorage(blob, user);
      this.uploadLine.shift();
    } catch (error) {
      return;
    }
  }


  async copyGoogleImageToStorage(blob: Blob, user: UserInterface) {
    try {
      const contentType = blob.type;
      const storageRef = this.getProfilePicStorageRef(user, contentType);
      const uploadTaskSnapshot = await uploadBytesResumable(storageRef, blob, {
        contentType,
      });
      const downloadURL = await getDownloadURL(uploadTaskSnapshot.ref);
      user.avatar = downloadURL;
      await this.storage.updateUser(user.id!, user);
    } catch (error) {
      return;
    }
  }


  getProfilePicStorageRef(user: UserInterface, contentType: string) {
    const extension = contentType.split('/')[1];
    const fileName = `${user.id}.${extension}`;
    const storageRef = ref(this.cloud, `profilePic/${user.id}/${fileName}`);
    return storageRef;
  }
}
