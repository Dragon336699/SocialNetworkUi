import React, { useState } from 'react';
import { PostData } from '@/app/types/Post/Post';

interface PostProps extends PostData {
  onToggleLike?: (postId: string) => void;
}

const Post: React.FC<PostProps> = ({
  id,
  content,
  totalLiked,
  totalComment,
  createdAt,
  user,
  postImages,
  isLikedByCurrentUser = false,
  onToggleLike
}) => {
  const [commentText, setCommentText] = useState('');
  
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const postTime = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ngày trước`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center space-x-3">
          <img 
            src={user.avatar || '/default-avatar.png'} 
            alt={fullName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h4 className="font-semibold text-blue-600 text-sm hover:underline cursor-pointer">
              {fullName}
            </h4>
            <span className="text-xs text-gray-500">{getTimeAgo(createdAt)}</span>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        <p className="text-gray-800 text-sm leading-relaxed">{content}</p>
      </div>

      {/* Images */}
      {postImages && postImages.length > 0 && (
        <div className="px-4 pb-3">
          <img 
            src={postImages[0].imageUrl} 
            alt="Post content"
            className="w-full h-64 md:h-80 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center space-x-6 mb-3">
          <button 
            onClick={() => onToggleLike?.(id)}
            className={`flex items-center space-x-2 text-sm transition-colors ${
              isLikedByCurrentUser 
                ? 'text-red-500' 
                : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <svg className="w-5 h-5" fill={isLikedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="font-medium">{totalLiked}</span>
          </button>

          <button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-medium">{totalComment}</span>
          </button>

          <button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-green-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span className="font-medium">17</span>
          </button>
        </div>

        {/* Comment Input */}
        <div className="flex items-center space-x-2">
          <img 
            src={user.avatar || '/default-avatar.png'}
            alt="Your avatar" 
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1 flex items-center bg-gray-50 rounded-full px-4 py-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment"
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-500"
            />
            <button className="ml-2 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="ml-1 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Post;