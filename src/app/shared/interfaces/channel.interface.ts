export interface ChannelInterface {
  name: string,
  description: string,
  user: string[],
  owner: string,
  status?: string,
  posts?: {}[],
  id?: string
}
