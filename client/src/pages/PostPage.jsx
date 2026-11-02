import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils';
import ConfirmModal from '../components/ConfirmModal';

export default function PostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    api.get(`/posts/${id}`)
      .then((d) => { if (!ignore) setPost(d.post); })
      .catch((e) => { if (!ignore) setError(e.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [id, user?.id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/posts/${id}`);
      navigate('/');
    } catch (e) {
      setError(e.message);
      setConfirm(false);
      setDeleting(false);
    }
  };

  if (loading) return <main className="max-w-4xl mx-auto px-4 py-12"><div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" /></main>;

  if (!post) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-2xl p-12 border border-dashed border-gray-200">
          <h1 className="text-xl font-bold text-gray-800 mb-2">{error || 'Post not found'}</h1>
          <Link to="/" className="text-sm font-bold text-maroon underline">← Back to feed</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <article className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <header className="border-b border-gray-100 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${post.isPublic ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              {post.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-3 break-words">{post.title}</h1>
          <p className="text-sm font-medium text-maroon">
            {post.author.username} <span className="text-gray-400">· {formatDate(post.createdAt)}</span>
          </p>
        </header>

        {/* {post.content} is escaped by React, so <script> in a post is shown as text, not run */}
        <section className="text-base sm:text-lg text-gray-700 font-medium whitespace-pre-wrap break-words">
          {post.content}
        </section>

        <footer className="border-t border-gray-100 pt-8 flex flex-wrap items-center gap-3">
          {post.isOwner && (
            <>
              <Link to={`/edit/${post._id}`} className="px-4 py-2 border border-maroon/20 hover:border-maroon/40 text-maroon text-xs font-bold rounded-xl bg-maroon/5 transition-colors">
                Edit Post
              </Link>
              <button onClick={() => setConfirm(true)} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors">
                Delete
              </button>
            </>
          )}
          <Link to="/" className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-500 text-xs font-bold rounded-xl bg-gray-50 transition-colors">
            Back to Feed
          </Link>
        </footer>
      </article>

      <ConfirmModal
        open={confirm}
        title="Delete Publication"
        message={`Are you sure you want to delete "${post.title}"? This will permanently delete it.`}
        confirmLabel="Confirm Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(false)}
      />
    </main>
  );
}