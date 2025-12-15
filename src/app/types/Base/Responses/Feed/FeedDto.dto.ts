import { PostData } from '@/app/types/Post/Post'

export interface FeedDto {
  feedId: string
  createdAt: Date
  post: PostData
}
