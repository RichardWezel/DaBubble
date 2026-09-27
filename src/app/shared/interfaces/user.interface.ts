export interface UserInterface {
  type: 'user',
  name: string,
  email: string,
  avatar: string,
  online: boolean,
  id?: string,
  isSeed?: boolean,
}
