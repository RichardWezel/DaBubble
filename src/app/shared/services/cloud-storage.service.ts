import { inject, Injectable } from '@angular/core';
import { ref, Storage, uploadBytesResumable, getDownloadURL, StorageReference } from '@angular/fire/storage';
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


  /**
   * Uploads selected files from an input element as attachments to a specified channel.
   * @param input - The input element containing the selected files.
   * @param channelId - The ID of the channel.
   * @returns - A promise that resolves to an array of objects, each containing the 'name' and 'url' of the uploaded files.
   */
  async uploadAsAttachment(input: HTMLInputElement, channelId: string = this.storage.currentUser.currentChannel || ''): Promise<{ name: string; url: string }[]> {
    if (!input.files) return [];
    const files: FileList = input.files;
    const uploadedUrls: { name: string; url: string }[] = await this.getUploadUrls(files, channelId);
    return uploadedUrls;
  }


  /**
   * Uploads a list of files and returns their corresponding URLs after succesful upload.
   * @param files - A list of files selected for upload.
   * @param channelId - The ID of the channel to which the files will be uploaded.
   * @returns - A promise that resolves to an array of objects.
   */
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



  /**
   * Generates a new file name, uploads the file, and appends the file details to the uploaded URLs array.
   * @param file - The file to be uploaded.
   * @param channelId - The ID of the channel where the file wiill be uploaded.
   * @param uploadedUrls - The array of uploaded file details to which new file info will be added.
   * @returns - A promise that resolves to an updated arrray of uploaded file details.
   */
  async generateAppendixNameAndUpload(file: File, channelId: string, uploadedUrls: { name: string; url: string }[]) {
    const newFileName = this.getAppendixNewFileName(file);
    const storageRef = this.getAppendixStorageRef(newFileName, channelId);
    uploadedUrls = await this.uploadAppendixFile(storageRef, file, uploadedUrls, newFileName);
    return uploadedUrls;
  }


  /**
   * Uploads a file to the specified storage reference and appends the file's download URL to the uploaded URLs array.
   * @param storageRef - The reference to the storage location where the file will be uploaded.
   * @param file - The file to be uploaded.
   * @param uploadedUrls - An array containing details of previously uploaded files.
   * @param newFileName The new file name to be assigned to the uploaded file.
   * @returns - A promise that resolves to an updated array of uploaded file details.
   */
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


  /**
   * Generates a storage reference for uploading a file to a specific path within a channel.
   * @param newFileName - The new name to be assigned to the file during the upload.
   * @param channelId - The ID of the channel where the file will be stored.
   * @returns - A reference to the storage location where the file will be uploaded.
   */
  getAppendixStorageRef(newFileName: string, channelId: string): StorageReference {
    const storageRef = ref(this.cloud, `appendix/${channelId}/${newFileName}`);
    return storageRef;
  }


  /**
   * Generates a new file name based on the current timestamp and the original file's extension.
   * @param file - the file for which a new name will be generated.
   * @returns - The newly generated file name with the format 'timestamp.extension'.
   */
  getAppendixNewFileName(file: File): string {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    const extension = file.name.split('.').pop();
    const newFileName = `${timestamp}.${extension}`;
    return newFileName;
  }


  /**
   * Loads an image from a given URL and processes.
   * @param url -The URL of the image to be opened.
   * @returns - The URL of the image that was opened.
   */
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


  /**
   * Updates the image URLs in the uploaded line by processing each one sequentially.
   */
  async updateUrl() {
    this.isUpdating = true;
    while (this.uploadLine.length > 0) {
      await this.getGoogleImage();
    }
    this.isUpdating = false;
  }


  /**
   * Fetches an image from a URL in the upload line and processes it.
   * The method retrieves the image as a blob and if a user with a matching avatar URL is found,
   * the image is copied to storage.
   * @returns - A promise that resolves when the image is usccessfully fetched and processed, or silently fails if an error occurs.
   */
  async getGoogleImage(): Promise<void> {
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


  /**
   * Uploads an image blob to the storage and updates the user's avatar with the uploaded image's URL.
   * @param blob - The image blob to be uploaded.
   * @param user - The user whose avatar will be upadated with the uploaded image URL.
   * @returns - A promise that resolves when the image is uploaded an the user's avatar is updated.
   */
  async copyGoogleImageToStorage(blob: Blob, user: UserInterface): Promise<void> {
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


  /**
   * Generates a storage reference for the user's profile picture.
   * @param user - The user for whom the profile picture storage reference is being generated.
   * @param contentType - The content type of the image, used to extract the file extension.
   * @returns - A reference to the storage location for the user's profile picture.
   */
  getProfilePicStorageRef(user: UserInterface, contentType: string): StorageReference {
    const extension = contentType.split('/')[1];
    const fileName = `${user.id}.${extension}`;
    const storageRef = ref(this.cloud, `profilePic/${user.id}/${fileName}`);
    return storageRef;
  }


  /**
   * Uploads a profile picture to the cloud storage and returns the download URL.
   * @param uid - The unique identifier for the user.
   * @param file - The profile picture file to upload.
   * @returns - The download URL of the uploaded profile picture.
   */
  async uploadProfilePicture(uid: string, file: File): Promise<string> {
    const contentType = file.type;
    const extension = contentType.split('/')[1];
    const fileName = `${uid}.${extension}`;
    const storageRef = ref(this.cloud, `profilePic/${uid}/${fileName}`);
    const uploadTaskSnapshot = await uploadBytesResumable(storageRef, file);
    const downloadURL = await getDownloadURL(uploadTaskSnapshot.ref);
    return downloadURL;
  }
}
