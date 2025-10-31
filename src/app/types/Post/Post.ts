export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface PostImage {
  id: string;
  imageUrl: string;
}

export interface PostData {
  id: string;
  content: string;
  totalLiked: number;
  totalComment: number;
  createdAt: string;
  userId: string;
  user: User;
  postImages?: PostImage[];
  isLikedByCurrentUser?: boolean;
}