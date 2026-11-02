import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import PostForm from '../components/PostForm';

export default function EditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/posts/${id}`)
      .then((d) => setPost(d.post))
      .catch((e) => setError(e.message));
  }, [id]);

  const handleUpdate = async (form) => {
    await api.put(`/posts/${id}`, form);
    navigate(`/post/${id}`);
  };

  if (error) return <main className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-600 font-semibold">{error}</main>;
  if (!post) return <main className="max-w-2xl mx-auto px-4 py-12"><div className="h-64 bg-white rounded-2xl animate-pulse" /></main>;
  if (!post.isOwner) return <main className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-600 font-semibold">You can only edit your own posts.</main>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
        <h1 className="text-2xl font-extrabold text-maroon mb-1">Edit Post</h1>
        <p className="text-xs text-gray-500 font-medium mb-6">Update your story or change who can see it.</p>
        <PostForm
          initial={{ title: post.title, content: post.content, isPublic: post.isPublic }}
          onSubmit={handleUpdate}
          submitLabel="Update"
          rows={10}
        >
          <Link to={`/post/${id}`} className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-center transition-colors text-sm border border-gray-200">
            Cancel
          </Link>
        </PostForm>
      </div>
    </main>
  );
}