import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import ConfirmModal from '../components/ConfirmModal';

export default function FeedPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const search = params.get('search') || '';

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Refetch whenever the search term or the logged-in user changes
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    api.get(`/posts?search=${encodeURIComponent(search)}`)
      .then((d) => { if (!ignore) setPosts(d.posts); })
      .catch((e) => { if (!ignore) setError(e.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [search, user?.id]);

  const handleCreate = async (form) => {
    const d = await api.post('/posts', form);
    setPosts((prev) => [d.post, ...prev]);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/posts/${toDelete._id}`);
      setPosts((prev) => prev.filter((p) => p._id !== toDelete._id));
      setToDelete(null);
    } catch (e) {
      setError(e.message);
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 lg:sticky lg:top-24">
          {user ? (
            <>
              <h2 className="text-xl font-extrabold text-gray-900 mb-1">Weave a New Story</h2>
              <p className="text-xs text-gray-500 font-medium mb-5">Share your insights, logs, or ideas with the ecosystem instantly.</p>
              <PostForm onSubmit={handleCreate} submitLabel="Publish Story" resetOnSuccess />
            </>
          ) : (
            <>
              <h2 className="text-xl font-extrabold text-gray-900 mb-1">You're browsing as a guest</h2>
              <p className="text-sm text-gray-500 font-medium mb-5">
                Public stories are open to read. Sign in to write your own and keep private drafts.
              </p>
              <Link to="/auth" className="block text-center py-3 bg-maroon text-white font-bold rounded-xl hover:bg-maroon-hover transition-colors text-sm shadow-md shadow-maroon/10">
                Sign in or create an account
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
            {search ? `Results for "${search}"` : 'Recent Publications'}
          </h3>
          {!loading && (
            <span className="text-xs font-bold text-gray-400 uppercase bg-gray-100 px-2.5 py-1 rounded-md">
              {posts.length} Posts Found
            </span>
          )}
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">{error}</div>}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200 shadow-sm">
            <h4 className="text-base font-bold text-gray-800 mb-1">No stories match your criteria</h4>
            <p className="text-sm text-gray-500">Try a different search, or write the first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {posts.map((p) => <PostCard key={p._id} post={p} onDelete={setToDelete} />)}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!toDelete}
        title="Delete Publication"
        message={`Are you sure you want to delete "${toDelete?.title}"? This will permanently delete it.`}
        confirmLabel="Confirm Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </main>
  );
}