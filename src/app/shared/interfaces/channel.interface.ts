export interface ChannelInterface {
  name: string,
  description: string,
  users: string[],
  owner: string,
  posts?: {}[],
  id?: string
}
