import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, doc, getDoc, getDocs, getFirestore, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { UserInterface } from '../interfaces/user.interface';
import { ChannelInterface } from '../interfaces/channel.interface';
import { PostInterface } from '../interfaces/post.interface';

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {
  firestore: Firestore = inject(Firestore);

  user: UserInterface[] = [];
  channel: ChannelInterface[] = [];
  currentUser: UserInterface = { name: '', email: '', avatar: '', status: '', dm: [], id: '' };

  unsubUsers;
  unsubChannels;

  constructor() {
    this.unsubChannels = this.getChannelCollection();
    this.unsubUsers = this.getUserCollection();
    this.getCurrentUser();
  }


  async getCurrentUser() {
    const authUid = localStorage.getItem("authUid") || 'oYhCXFUTy11sm1uKLK4l';
    if (authUid) {
      const docRef = await getDoc(doc(this.firestore, "user", authUid));
      if (docRef.exists()) {
        let userData = docRef.data() as UserInterface;
        userData.id = docRef.id;
        this.currentUser = userData;
      } else {
        return;
      }
    } else {
      return;
    }
  }


  async getUserCollection() {
    return onSnapshot(collection(this.firestore, "user"), (snapshot) => {
      this.user = [];
      snapshot.forEach((doc) => {
        const userData = doc.data() as UserInterface;
        userData.id = doc.id;
        this.user.push(userData);
        console.log(this.user);
        console.log(this.currentUser);
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
        console.log(this.channel);
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
    let currentUser = this.user[this.user.findIndex(user => user.id === userId)];
    let newDm = currentUser.dm[currentUser.dm.findIndex(dm => dm.contact === contact)];
    if (newDm) {
      await updateDoc(doc(this.firestore, "user", userId), {
        dm: [
          ...currentUser.dm,
          {
            contact: contact,
            posts: newDm.posts,
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
