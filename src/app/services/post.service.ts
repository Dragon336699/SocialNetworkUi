import { PostData } from '@/app/types/Post/Post';
import { mockPosts } from '../data/mockPosts';

export const postService = {
  async getPosts(): Promise<PostData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return [...mockPosts];
  },

  async toggleLikePost(postId: string): Promise<{ isLiked: boolean; totalLikes: number }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const post = mockPosts.find(p => p.id === postId);
    if (post) {
      const wasLiked = post.isLikedByCurrentUser;
      post.isLikedByCurrentUser = !wasLiked;
      post.totalLiked += wasLiked ? -1 : 1;
      
      return {
        isLiked: post.isLikedByCurrentUser,
        totalLikes: post.totalLiked
      };
    }
    
    throw new Error('Post not found');
  }
};