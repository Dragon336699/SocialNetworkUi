import { PostData } from '../Post/Post'
import { UserDto } from '../User/user.dto'

export enum GroupRole {
  User = 'User',
  Administrator = 'Administrator',
  SuperAdministrator = 'SuperAdministrator',
  Pending = 'Pending',
  Inviting = 'Inviting'
}

export interface GroupDto {
  id: string
  name: string
  description: string
  isPublic: boolean
  memberCount: number
  postCount: number
  imageUrl: string
  createdBy?: string
  groupUsers?: GroupUserDto[]
  posts?: PostData[]
}

export interface GroupUserDto {
  userId: string
  groupId: string
  roleName: string
  joinedAt: string
  user?: UserDto
}

export interface GroupInvitationDto {
  groupId: string
  groupName: string
  groupDescription: string
  groupImageUrl: string
  isPublic: boolean
  memberCount: number
  invitedAt: string
}
