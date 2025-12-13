import { BaseResponse } from '../Base/Responses/baseResponse'
import { UserDto } from '../User/user.dto'
export interface User {
  id: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
}

export interface PostImage {
  id: string
  imageUrl: string
}

export interface PostGroup {
  id: string
  name: string
  imageUrl?: string
  isPublic: boolean
}

export interface PostData {
  id: string
  content: string
  totalLiked: number
  totalComment: number
  createdAt: string
  updatedAt?: string
  userId: string
  groupId?: string
  postPrivacy: 'Public' | 'Friends' | 'Private'
  user: UserDto
  group?: PostGroup
  postImages?: PostImage[]
  postReactionUsers: PostReactionDto[]
}

export interface GetAllPostsResponse {
  message: string
  posts: PostData[]
  totalCount: number
}

export interface GetPostByIdResponse {
  message: string
  post: PostData
}

export interface UpdatePostResponse {
  message: string
  post: PostData
}

export interface DeletePostResponse {
  message: string
}

export interface PostReactionDto {
  id: string
  userId: string
  reaction: string
  user: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string
  }
}

export interface PostReactionResponse extends BaseResponse {
  data: PostReactionDto
}