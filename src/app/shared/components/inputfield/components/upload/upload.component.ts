import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { InputfieldComponent } from '../../inputfield.component';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss'
})
export class UploadComponent {
  inputfield: InputfieldComponent = inject(InputfieldComponent);
  @ViewChild('upload') uploadElement!: ElementRef<HTMLInputElement>;

  constructor() { }

  getUploadedFiles(input: HTMLInputElement) {
    if (!input.files || !input.files.length) return [];
    return Array.from(input.files);
  }


  handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.toggleDropZone(false);
    if (!event.dataTransfer || !event.dataTransfer.files?.length || !this.uploadElement.nativeElement) return;
    const inputElement = this.uploadElement.nativeElement;
    const dataTransfer = new DataTransfer();
    if (inputElement.files) {
      Array.from(inputElement.files).forEach(file => {
        if (!this.isFileInList(file, dataTransfer.files)) dataTransfer.items.add(file);
      });
    }
    Array.from(event.dataTransfer.files).forEach(file => {
      if (!this.isFileInList(file, dataTransfer.files)) dataTransfer.items.add(file);
    });
    inputElement.files = dataTransfer.files;
  }


  isFileInList(file: File, fileList: FileList): boolean {
    for (let i = 0; i < fileList.length; i++) {
      const existingFile = fileList[i];
      if (existingFile.name === file.name && existingFile.size === file.size) return true;
    }
    return false;
  }

  handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.toggleDropZone(true);
  }

  handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.toggleDropZone(false);
  }

  toggleDropZone(active: boolean) {
    const uploadElement = this.uploadElement.nativeElement.closest('.upload');
    if (uploadElement) {
      uploadElement.classList.toggle('dropzone', active);
    }
  }


  async uploadFiles() {
    const inputElement = this.uploadElement.nativeElement;

    if (!inputElement.files || inputElement.files.length === 0) {
      console.error("Keine Dateien zum Hochladen ausgewählt.");
      return;
    }

    try {
      const uploadedUrls = await this.inputfield.cloud.uploadAsAttachment(inputElement, this.inputfield.storage.currentUser.currentChannel);
      this.uploadElement.nativeElement.value = '';

      const message = this.inputfield.elementRef.nativeElement.classList.contains('message-content')
        ? this.inputfield.elementRef.nativeElement
        : this.inputfield.elementRef.nativeElement.querySelector('.message-content');

      if (uploadedUrls.length > 0) {
        uploadedUrls.forEach(url => {
          const fileExtension = url.name.split('.').pop()?.toLowerCase();

          let thumbnailHtml = '';
          if (!fileExtension) {
            console.error('Ungültige Dateiendung:', url.name);
            return;
          }
          if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
            // Thumbnail für Bild
            thumbnailHtml = `<div class="file-thumbnail image-thumbnail">
                               <img src="${url.url}" alt="Image Thumbnail" class="thumbnail-image">
                             </div>`;
          } else if (fileExtension === 'pdf') {
            // Thumbnail für PDF
            thumbnailHtml = `<div class="file-thumbnail pdf-thumbnail">
                               <img src="pdf-icon.png" alt="PDF Thumbnail" class="thumbnail-image">
                               <a href="${url.url}" target="_blank" class="pdf-link">PDF anzeigen</a>
                             </div>`;
          } else {
            // Default Thumbnail für andere Dateitypen
            thumbnailHtml = `<div class="file-thumbnail other-thumbnail">
                               <img src="default-icon.png" alt="File Thumbnail" class="thumbnail-image">
                               <a href="${url.url}" target="_blank" class="file-link">Datei herunterladen</a>
                             </div>`;
          }
          message.innerHTML += thumbnailHtml;
        });
      }

      message.innerHTML = message.innerHTML.replaceAll('<br>', '');
      this.inputfield.startInput = true;
      this.inputfield.showUpload = false;
      this.inputfield.sendMessage();
    } catch (error) {
      console.error("Fehler beim Hochladen der Dateien:", error);
    }
  }



}
