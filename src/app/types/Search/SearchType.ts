import { UserDto } from '../User/user.dto'
import { GroupDto } from '../Group/group.dto'
import { PostData } from '../Post/Post'

export enum SearchType {
  All = 'All',
  Users = 'Users',
  Groups = 'Groups',
  Posts = 'Posts'
}

export interface SearchRequest {
  keyword: string
  type?: SearchType
  skip?: number
  take?: number
}

export interface SearchResultDto {
  users?: UserDto[]
  groups?: GroupDto[]
  posts?: PostData[]
  totalUsersCount: number
  totalGroupsCount: number
  totalPostsCount: number
}

export interface SearchHistoryDto {
  id: string
  content?: string
  searchedUserId?: string
  searchedUserName?: string
  searchedUserAvatar?: string
  groupId?: string
  groupName?: string
  groupImageUrl?: string
  createdAt: string
}