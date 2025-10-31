import { PostData } from '@/app/types/Post/Post';

export const mockPosts: PostData[] = [
  {
    id: '1',
    content: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    totalLiked: 1200,
    totalComment: 200,
    createdAt: '2024-10-30T08:00:00Z',
    userId: 'user1',
    user: {
      id: 'user1',
      firstName: 'John',
      lastName: 'Carter',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    postImages: [
      {
        id: 'img1',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop'
      }
    ],
    isLikedByCurrentUser: false
  },
  {
    id: '2',
    content: 'Beautiful sunset at the mountains! Nature never fails to amaze me. 🌅',
    totalLiked: 856,
    totalComment: 134,
    createdAt: '2024-10-30T06:30:00Z',
    userId: 'user2',
    user: {
      id: 'user2',
      firstName: 'Sarah',
      lastName: 'Wilson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    postImages: [
      {
        id: 'img2',
        imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop'
      }
    ],
    isLikedByCurrentUser: true
  },
  {
    id: '3',
    content: 'Just finished reading an amazing book about space exploration. Highly recommend it! 📚🚀',
    totalLiked: 423,
    totalComment: 67,
    createdAt: '2024-10-30T05:15:00Z',
    userId: 'user3',
    user: {
      id: 'user3',
      firstName: 'Michael',
      lastName: 'Johnson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    postImages: [],
    isLikedByCurrentUser: false
  }
];