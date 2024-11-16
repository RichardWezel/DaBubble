import { PostInterface } from "../interfaces/post.interface";
import { UserInterface } from "../interfaces/user.interface";

export class User implements UserInterface {
    name: string;
    email: string;
    avatar: string;
    online: boolean;
    dm: { contact: string, id: string, posts: PostInterface[] }[];
    id?: string;

    constructor(
        obj?: any
    ) {
        this.name = obj ? obj.name : '';
        this.email = obj ? obj.email : '';
        this.avatar = obj ? obj.avatar : '';
        this.online = obj ? obj.online : false;
        this.dm = obj ? obj.dm : [];
    }
}