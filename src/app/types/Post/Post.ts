export interface User {
  id: string
  firstName?: string
  lastName?: string
  avatar?: string
}

export interface PostImage {
  id: string
  imageUrl: string
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
  user: User
  postImages?: PostImage[]
  isLikedByCurrentUser?: boolean
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