import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

const PostForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);

  // useApi for categories
  const { data: categories, error: catError, loading: catLoading, request: fetchCategories } = useApi();
  // useApi for fetching post (edit mode)
  const { data: post, error: postError, loading: postLoading, request: fetchPost } = useApi();
  // useApi for submitting post
  const { loading: submitLoading, error: submitError, request: submitPost } = useApi();

  useEffect(() => {
    fetchCategories({ endpoint: '/api/categories' });
  }, [fetchCategories]);

  useEffect(() => {
    if (isEdit) {
      fetchPost({ endpoint: `/api/posts/${id}` });
    }
  }, [id, isEdit, fetchPost]);

  useEffect(() => {
    if (isEdit && post) {
      setTitle(post.title);
      setContent(post.content);
      setCategory(post.category?._id || post.category);
      setImagePreview(post.featuredImage ? post.featuredImage : null);
    }
  }, [isEdit, post]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `/api/posts/${id}` : '/api/posts';
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    formData.append('author', user?.id);
    if (image) {
      formData.append('image', image);
    }
    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to save post');
      const data = await res.json();
      navigate(`/posts/${data._id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (catLoading || (isEdit && postLoading)) return <div>Loading...</div>;
  if (catError) return <div style={{ color: 'red' }}>Error: {catError}</div>;
  if (isEdit && postError) return <div style={{ color: 'red' }}>Error: {postError}</div>;

  return (
    <Card className="max-w-xl mx-auto mt-10">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Post' : 'Create Post'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 font-medium">Title:</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block mb-1 font-medium">Content:</label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} required />
          </div>
          <div>
            <label className="block mb-1 font-medium">Category:</label>
            <select value={category} onChange={e => setCategory(e.target.value)} required className="w-full border rounded-md px-3 py-2">
              <option value="">Select a category</option>
              {categories && categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Featured Image:</label>
            <Input type="file" accept="image/*" onChange={handleImageChange} />
            {imagePreview && (
              <div className="mt-2">
                <img src={imagePreview} alt="Preview" className="max-w-[200px] max-h-[200px] rounded-md" />
              </div>
            )}
          </div>
          {(error || submitError) && <Alert variant="destructive">{error || submitError}</Alert>}
          <Button type="submit" disabled={submitLoading} className="w-full">{submitLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PostForm; 