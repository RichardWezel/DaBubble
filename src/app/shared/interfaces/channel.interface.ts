export interface ChannelInterface {
  name: string,
  description: string,
  users: string[],
  owner: string,
  status?: string,
  posts?: {}[],
  id?: string
}
