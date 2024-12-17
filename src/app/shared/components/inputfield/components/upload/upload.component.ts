import { Component, ElementRef, inject, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { InputfieldComponent } from '../../inputfield.component';
import { htmlTemplatesImage, htmlTemplatesPdf, htmlTemplatesOther } from './templates/htmlTemplates';
import { Subscription } from 'rxjs';
import { NavigationService } from '../../../../services/navigation.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss'
})
export class UploadComponent implements OnChanges, OnInit {
  inputfield: InputfieldComponent = inject(InputfieldComponent);
  navigationService = inject(NavigationService);

  @ViewChild('upload') uploadElement!: ElementRef<HTMLInputElement>;

  private subscription!: Subscription;


  constructor() { }


  ngOnInit() {
    this.subscription = this.navigationService.channelChanged.subscribe((channelId) => {
      this.cancelUpload();
    });
  }


  ngOnChanges(): void {
    if (!this.inputfield.showUpload) {
      this.cancelUpload();
    }
  }


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
    try {
      await this.generateMessageWithFiles(inputElement);
    } catch (error) {
      console.error("Fehler beim Hochladen der Dateien:", error);
    }
  }


  async generateMessageWithFiles(inputElement: HTMLInputElement) {
    const uploadedUrls = await this.inputfield.cloud.uploadAsAttachment(inputElement, this.inputfield.storage.currentUser.currentChannel);
    this.uploadElement.nativeElement.value = '';
    let message = this.inputfield.elementRef.nativeElement.classList.contains('message-content')
      ? this.inputfield.elementRef.nativeElement
      : this.inputfield.elementRef.nativeElement.querySelector('.message-content');
    if (uploadedUrls.length > 0) message = this.generateHtmlForFiles(message, uploadedUrls);
    this.sendMessageWithFiles(message);
  }


  generateHtmlForFiles(message: HTMLElement, uploadedUrls: { name: string; url: string }[]) {
    uploadedUrls.forEach(url => {
      const fileExtension = url.name.split('.').pop()?.toLowerCase();
      let thumbnailHtml = '';
      if (!fileExtension) {
        console.error('Ungültige Dateiendung:', url.name);
        return;
      }
      if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) thumbnailHtml = htmlTemplatesImage(url);
      else if (fileExtension === 'pdf') thumbnailHtml = htmlTemplatesPdf(url);
      else thumbnailHtml = htmlTemplatesOther(url);
      message.innerHTML += thumbnailHtml;
    });
    return message;
  }


  sendMessageWithFiles(message: HTMLElement) {
    message.innerHTML = message.innerHTML.replaceAll('<br>', '');
    this.inputfield.startInput = true;
    this.inputfield.showUpload = false;
    this.inputfield.sendMessage();
    this.inputfield.setFocus();
  }


  removeFile(index: number) {
    const inputElement = this.uploadElement.nativeElement;
    if (inputElement.files && inputElement.files.length > index) {
      const dataTransfer = new DataTransfer();
      for (let i = 0; i < inputElement.files.length; i++) {
        if (i !== index) {
          dataTransfer.items.add(inputElement.files[i]);
        }
      }
      inputElement.files = dataTransfer.files;
    }
  }


  cancelUpload() {
    const inputElement = this.uploadElement.nativeElement;
    if (inputElement.files && inputElement.files.length > 0) {
      inputElement.value = '';
    }
    this.inputfield.showUpload = false;
  }
}
