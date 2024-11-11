import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { UserInterface } from '../interfaces/user.interface';
import { ChannelInterface } from '../interfaces/channel.interface';
import { PostInterface } from '../interfaces/post.interface';
import { CurrentUserInterface } from '../interfaces/current-user-interface';
import { UidService } from './uid.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {
  firestore: Firestore = inject(Firestore);
  uid = inject(UidService);

  user: UserInterface[] = [];
  channel: ChannelInterface[] = [];
  currentUser: CurrentUserInterface = { name: '', email: '', avatar: '', status: '', dm: [], id: '' };
  authUid = localStorage.getItem("authUid") || 'oYhCXFUTy11sm1uKLK4l';


  unsubUsers;
  unsubChannels;
  unsubCurrentUser;

  constructor() {
    this.unsubChannels = this.getChannelCollection();
    this.unsubUsers = this.getUserCollection();
    this.unsubCurrentUser = this.getCurrentUser();
  }

  ngOnDestroy(): void {
    this.unsubUsers();
    this.unsubChannels();
    this.unsubCurrentUser();
  }

  getCurrentUser() {
    return onSnapshot(doc(this.firestore, "user", this.authUid), (snapshot) => {
      let userData = snapshot.data() as CurrentUserInterface;
      userData.id = snapshot.id;
      userData.currentChannel =
        this.channel.find(channel => channel.user.includes(snapshot.id))?.id
        ||
        userData.dm.find(dm => dm.contact.includes(snapshot.id))?.id;
      this.currentUser = userData;
    })
  }


  getUserCollection() {
    return onSnapshot(collection(this.firestore, "user"), (snapshot) => {
      this.user = [];
      snapshot.forEach((doc) => {
        const userData = doc.data() as UserInterface;
        userData.id = doc.id;
        this.user.push(userData);
      });
    });
  }


  getChannelCollection() {
    return onSnapshot(collection(this.firestore, "channel"), (snapshot) => {
      this.channel = [];
      snapshot.forEach((doc) => {
        const channelData = doc.data() as ChannelInterface;
        channelData.id = doc.id;
        this.channel.push(channelData);
      });
    });
  }

  // after Firebase Auth registration
  async addUser(authUid: string, userData: { name: string, email: string, avatar: string }) {
    await setDoc(doc(this.firestore, "user", authUid), {
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      status: '',
      dm: [{
        contact: authUid,
        id: this.uid.generateUid(),
        posts: [],
      },],
    } as UserInterface);
  }

  // after sending new channel form
  async addChannel(channelData: { name: string, description: string, owner: string }) {
    await setDoc(doc(this.firestore, "channel"), {
      name: channelData.name,
      description: channelData.description,
      owner: channelData.owner,
      user: [channelData.owner],
      posts: [],
    } as ChannelInterface);
  }


  // after sending edit user profile form
  async updateUser(userId: string, userData: UserInterface) {
    await updateDoc(doc(this.firestore, "user", userId), {
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      status: userData.status,
      dm: userData.dm
    })
  }


  // after sending edit channel form
  async updateChannel(channelId: string, channelData: ChannelInterface) {
    await updateDoc(doc(this.firestore, "channel", channelId), {
      name: channelData.name,
      description: channelData.description,
      owner: channelData.owner,
      user: channelData.user,
      posts: channelData.posts,
    })
  }


  async writeDm(userId: string, contact: string, newPost: PostInterface) {
    let sendUser = this.user[this.user.findIndex(user => user.id === userId)];
    let newDm = sendUser.dm[sendUser.dm.findIndex(dm => dm.contact === contact)];
    if (newDm) {
      await updateDoc(doc(this.firestore, "user", userId), {
        dm: [
          ...sendUser.dm,
          {
            contact: contact,
            id: this.uid.generateUid(),
            posts: [newPost],
          }
        ]
      });
    };
  }


  async writePosts(channelId: string, newPost: PostInterface) {
    let currentChannel = this.channel[this.channel.findIndex(channel => channel.id === channelId)];
    if (currentChannel) {
      await updateDoc(doc(this.firestore, "channel", channelId), {
        posts: [
          ...currentChannel.posts ?? [],
          newPost
        ]
      });
    };
  }


}
