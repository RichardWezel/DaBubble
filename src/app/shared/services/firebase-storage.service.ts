import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, doc, getDoc, getDocs, getFirestore, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { UserInterface } from '../interfaces/user.interface';
import { ChannelInterface } from '../interfaces/channel.interface';
import { findIndex } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {
  firestore: Firestore = inject(Firestore);

  user: UserInterface[] = [];
  channel: ChannelInterface[] = [];

  unsubUsers;
  unsubChannels;

  constructor() {
    this.unsubUsers = this.getUserCollection();
    this.unsubChannels = this.getChannelCollection();
  }


  async getUserCollection() {
    return onSnapshot(collection(this.firestore, "user"), (snapshot) => {
      this.user = [];
      snapshot.forEach((doc) => {
        const userData = doc.data() as UserInterface;
        userData.id = doc.id;
      });
    });
  }


  async getChannelCollection() {
    return onSnapshot(collection(this.firestore, "channel"), (snapshot) => {
      this.channel = [];
      snapshot.forEach((doc) => {
        const channelData = doc.data() as ChannelInterface;
        channelData.id = doc.id;
        this.channel.push(channelData);
      });
    });
  }


  async addUser(authUid: string, userData: { name: string, email: string, avatar: string }) {
    await setDoc(doc(this.firestore, "user", authUid), {
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      status: '',
      dm: [{
        contact: userData.name,
        posts: [],
      },],
    } as UserInterface);
  }


  async addChannel(channelData: { name: string, description: string, owner: string }) {
    await setDoc(doc(this.firestore, "channel"), {
      name: channelData.name,
      description: channelData.description,
      owner: channelData.owner,
      users: [channelData.owner],
      posts: [],
    } as ChannelInterface);
  }


  async updateUser(userId: string, userData: UserInterface) {
    await updateDoc(doc(this.firestore, "user", userId), {
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      status: userData.status,
      dm: userData.dm
    })
  }


  async updateChannel(channelId: string, channelData: ChannelInterface) {
    await updateDoc(doc(this.firestore, "channel", channelId), {
      name: channelData.name,
      description: channelData.description,
      owner: channelData.owner,
      users: channelData.users,
      posts: channelData.posts,
    })
  }


  async writeDm(userId: string, contact: string) {
    let user = this.user[this.user.findIndex(user => user.id === userId)];
    let dm = user.dm[user.dm.findIndex(dm => dm.contact === contact)];
    if (dm) {
      await updateDoc(doc(this.firestore, "user", userId), {
        dm: [
          ...user.dm,
          {
            contact: contact,
            posts: dm.posts,
          }
        ]
      });
    };
  }

}
