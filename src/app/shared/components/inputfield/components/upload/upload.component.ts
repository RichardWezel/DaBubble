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


  /**
   * When the channel changes, cancel the current upload.
   * This is needed because the input field is not recreated when the channel changes.
   * @memberof UploadComponent
   */
  ngOnInit() {
    this.subscription = this.navigationService.channelChanged.subscribe((channelId) => {
      this.cancelUpload();
    });
  }


  /**
   * When the input field is hidden, cancel the current upload.
   * This is needed because the input field is not recreated when the channel changes.
   * @memberof UploadComponent
   */
  ngOnChanges(): void {
    if (!this.inputfield.showUpload) {
      this.cancelUpload();
    }
  }


  /**
   * Retrieves the list of files from an HTML input element.
   * 
   * @param {HTMLInputElement} input - The input element containing the files.
   * @returns {File[]} An array of files from the input element, or an empty array if no files are present.
   */
  getUploadedFiles(input: HTMLInputElement) {
    if (!input.files || !input.files.length) return [];
    return Array.from(input.files);
  }


  /**
   * Handles the drop event from the drag-and-drop event.
   * @param {DragEvent} event The event object from the drag-and-drop event.
   * @returns {void}
   * @description
   * This function is called when the user drops files onto the input field.
   * It will prevent the default behavior (opening the files in the browser),
   * and add the dropped files to the list of files in the input field.
   * If the files are already in the list, they will not be added again.
   * @example
   * <input type="file" (drop)="handleDrop($event)" />
   */
  handleDrop(event: DragEvent) {
    this.handleDragLeave(event);
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


  /**
   * Checks if a file is in a FileList.
   * @param {File} file The file to check.
   * @param {FileList} fileList The list of files to check against.
   * @returns {boolean} True if the file is in the list, otherwise false.
   * @description
   * This function checks if a file is in a FileList.
   * It does this by iterating over the FileList and comparing each file with the given file.
   * If the names and sizes of the two files are equal, the function returns true.
   * If no match is found, the function returns false.
   */
  isFileInList(file: File, fileList: FileList): boolean {
    for (let i = 0; i < fileList.length; i++) {
      const existingFile = fileList[i];
      if (existingFile.name === file.name && existingFile.size === file.size) return true;
    }
    return false;
  }


  /**
   * Handles the dragover event.
   * @param {DragEvent} event The event that triggered this function.
   * @description
   * This function prevents the default behavior of the dragover event and stops the event from propagating.
   * It then toggles the drop zone on.
   */
  handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.toggleDropZone(true);
  }


  /**
   * Handles the dragleave event.
   * @param {DragEvent} event The event that triggered this function.
   * @description
   * This function prevents the default behavior of the dragleave event and stops the event from propagating.
   * It then toggles the drop zone off.
   */

  handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.toggleDropZone(false);
  }


  /**
   * Toggles the drop zone on or off.
   * @param {boolean} active If true, the drop zone is toggled on, otherwise off.
   * @description
   * This function finds the closest parent element with the class '.upload' of the upload element and toggles the 'dropzone' class on or off.
   * If the element is not found, nothing happens.
   */
  toggleDropZone(active: boolean) {
    const uploadElement = this.uploadElement.nativeElement.closest('.upload');
    if (uploadElement) {
      uploadElement.classList.toggle('dropzone', active);
    }
  }


  /**
   * Uploads the selected files and generates a message containing the uploaded files.
   * @description
   * This function retrieves the selected files from the input element and uploads them to the current channel.
   * It then generates a message containing the uploaded files and adds it to the input field.
   * If any errors occur during the upload or message generation, they are logged to the console.
   */
  async uploadFiles() {
    const inputElement = this.uploadElement.nativeElement;
    try {
      await this.generateMessageWithFiles(inputElement);
    } catch (error) {
      console.error("Fehler beim Hochladen der Dateien:", error);
    }
  }


  /**
   * Uploads the selected files and generates a message containing the uploaded files.
   * @param {HTMLInputElement} inputElement The input element containing the selected files.
   * @description
   * This function retrieves the selected files from the input element and uploads them to the current channel.
   * It then generates a message containing the uploaded files and adds it to the input field.
   * If any errors occur during the upload or message generation, they are logged to the console.
   */
  async generateMessageWithFiles(inputElement: HTMLInputElement) {
    const uploadedUrls = await this.inputfield.cloud.uploadAsAttachment(inputElement, this.inputfield.storage.currentUser.currentChannel);
    this.uploadElement.nativeElement.value = '';
    let message = this.inputfield.elementRef.nativeElement.classList.contains('message-content')
      ? this.inputfield.elementRef.nativeElement
      : this.inputfield.elementRef.nativeElement.querySelector('.message-content');
    if (uploadedUrls.length > 0) message = this.generateHtmlForFiles(message, uploadedUrls);
    this.sendMessageWithFiles(message);
  }


  /**
   * Generates HTML code for displaying the uploaded files.
   * @param {HTMLElement} message The HTML element where the generated HTML should be appended.
   * @param {Array<{ name: string; url: string }>} uploadedUrls The list of uploaded files with their names and URLs.
   * @returns {HTMLElement} The given message element with the appended HTML code.
   * @description
   * This function generates HTML code for displaying the uploaded files.
   * It iterates over the given list of uploaded files and checks the file extension of each file.
   * Depending on the file extension, it generates a thumbnail with the corresponding HTML template.
   * The generated HTML code is then appended to the given message element.
   * If any errors occur during the generation of the HTML code, they are logged to the console.
   */
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


  /**
   * Sends the message with the uploaded files.
   * @param {HTMLElement} message The HTML element containing the message and the uploaded files.
   * @description
   * This function sends the message with the uploaded files.
   * It removes any line breaks from the message, sets the startInput flag to true,
   * hides the upload box, calls the sendMessage method of the input field and
   * focuses the tag search input field.
   */
  sendMessageWithFiles(message: HTMLElement) {
    message.innerHTML = message.innerHTML.replaceAll('<br>', '');
    this.inputfield.startInput = true;
    this.inputfield.showUpload = false;
    this.inputfield.sendMessage();
    this.inputfield.setFocus();
  }


  /**
   * Removes a file from the list of files to be uploaded.
   * @param {number} index The index of the file to be removed in the list of files.
   * @description
   * This function removes a file from the list of files to be uploaded.
   * It creates a new DataTransfer object, adds all the files from the list except the one at the given index and sets the files property of the input element to the new DataTransfer object.
   * If the given index is out of range, nothing is done.
   */
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


  /**
   * Cancels the upload process.
   * @description
   * This function cancels the upload process by resetting the input element's value and hiding the upload box.
   */
  cancelUpload() {
    const inputElement = this.uploadElement.nativeElement;
    if (inputElement.files && inputElement.files.length > 0) {
      inputElement.value = '';
    }
    this.inputfield.showUpload = false;
    console.log('Upload abgebrochen');
  }
}
