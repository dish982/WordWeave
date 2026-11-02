import { Link } from 'react-router-dom';
import { formatDate } from '../utils';

export default function PostCard({ post, onDelete }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1.5 flex-1 min-w-0">
        <Link to={`/post/${post._id}`} className="text-lg font-bold text-gray-900 hover:text-maroon block transition-colors truncate">
          {post.title}
        </Link>
        <p className="text-xs font-medium text-maroon">
          {post.author.username} <span className="text-gray-400">· {formatDate(post.createdAt)}</span>
        </p>
      </div>

      {post.isPublic ? (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-100 whitespace-nowrap self-start sm:self-center">Public</span>
      ) : (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap self-start sm:self-center">Private</span>
      )}

      <div className="flex items-center gap-2.5 self-end sm:self-center">
        <Link to={`/post/${post._id}`} className="px-3.5 py-2 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 text-xs font-bold rounded-xl bg-gray-50/50 transition-colors">
          View
        </Link>
        {post.isOwner && (
          <>
            <Link to={`/edit/${post._id}`} className="px-3.5 py-2 border border-maroon/20 hover:border-maroon/40 text-maroon text-xs font-bold rounded-xl bg-maroon/5 transition-colors">
              Edit
            </Link>
            <button onClick={() => onDelete(post)} className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors">
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}