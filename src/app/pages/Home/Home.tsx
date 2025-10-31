import React, { useState, useEffect } from 'react';
import CreatePost from '@/components/CreatePost';
import Post from '@/components/Post/Post';
import { PostData } from '@/app/types/Post/Post';
import { postService } from '@/app/services/post.service';

const Home = () => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await postService.getPosts();
      setPosts(data);
    } catch (err) {
      setError('Không thể tải bài đăng. Vui lòng thử lại.');
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const result = await postService.toggleLikePost(postId);
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              totalLiked: result.totalLikes,
              isLikedByCurrentUser: result.isLiked
            }
          : post
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleNewPost = (newPost: PostData) => {
    setPosts(prev => [newPost, ...prev]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto py-6 px-4">
          <CreatePost />
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto py-6 px-4">
          <CreatePost />
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={loadPosts}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-6 px-4">
        <CreatePost />
        
        <div className="space-y-4 mt-6">
          {posts.length > 0 ? (
            posts.map(post => (
              <Post 
                key={post.id} 
                {...post} 
                onToggleLike={handleToggleLike}
              />
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <p className="text-gray-600">Chưa có bài đăng nào</p>
              <p className="text-gray-500 text-sm mt-1">Hãy tạo bài đăng đầu tiên của bạn!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
