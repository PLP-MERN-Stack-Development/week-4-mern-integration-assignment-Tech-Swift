import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { AuthContext } from '../context/AuthContext.jsx';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

const POSTS_PER_PAGE = 5;

const PostsList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const { data, error, loading, request } = useApi();
  const { user, token } = useContext(AuthContext);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  // Debounce the search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 800);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    let endpoint = `/api/posts?page=${page}&limit=${POSTS_PER_PAGE}`;
    if (debouncedSearch) endpoint += `&search=${encodeURIComponent(debouncedSearch)}`;
    if (categoryFilter) endpoint += `&category=${encodeURIComponent(categoryFilter)}`;
    request({ endpoint });
  }, [page, debouncedSearch, categoryFilter, request]);

  const posts = data?.posts || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pages) {
      setPage(newPage);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    setPage(1);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      request({ endpoint: `/api/posts?page=${page}&limit=${POSTS_PER_PAGE}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}${categoryFilter ? `&category=${encodeURIComponent(categoryFilter)}` : ''}` });
    } catch (err) {
      alert('Failed to delete post');
    }
  };

  if (loading) return <div className="text-center py-8">Loading posts...</div>;
  if (error) return <Alert variant="destructive" className="my-4">Error: {error}</Alert>;
  if (!posts || posts.length === 0) return <div className="text-center py-8">No posts found.</div>;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100 pb-20">
      {/* Hero Section */}
      <div className="max-w-3xl mx-auto pt-12 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-3 drop-shadow-lg">Welcome to the Blog Vibes</h1>
        <p className="text-lg text-muted-foreground mb-8">Discover, share, and discuss amazing stories from our community.</p>
        <div className="flex gap-4 mb-6 justify-center">
          <Input
            type="text"
            placeholder="Search by title, category, or author..."
            value={search}
            onChange={handleSearchChange}
            className="flex-1 max-w-xs shadow-md"
          />
          <select value={categoryFilter} onChange={handleCategoryChange} className="border rounded-md px-3 py-2 bg-white shadow-md">
            <option value="">All Categories</option>
            {categories && categories.map(cat => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Posts List */}
      <ul className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-2 md:px-6">
        {posts.map(post => (
          <li key={post._id} className="h-full">
            <Card className="flex flex-col md:flex-row items-center gap-8 p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white/90 border-0 h-full min-w-[320px] md:min-w-[420px]">
              {post.featuredImage && (
                <img src={`http://localhost:5000${post.featuredImage}`} alt={post.title} className="w-40 h-40 object-cover rounded-2xl border-4 border-white shadow-md" />
              )}
              <CardContent className="flex-1 p-0 w-full">
                <h3 className="text-2xl font-bold mb-2 text-blue-700 hover:text-pink-600 transition-colors duration-200">
                  <Link to={`/posts/${post._id}`}>{post.title}</Link>
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium"><b>Category:</b> {post.category?.name || post.category}</span>
                  <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-medium"><b>Author:</b> {post.author?.username || post.author}</span>
                </div>
                <div className="line-clamp-3 text-base text-gray-700 mb-2">{post.content}</div>
              </CardContent>
              {user && (user.id === (post.author?._id || post.author)) && (
                <Button
                  variant="destructive"
                  className="ml-auto"
                  onClick={() => handleDelete(post._id)}
                >
                  Delete
                </Button>
              )}
            </Card>
          </li>
        ))}
      </ul>
      {/* Pagination Controls */}
      <div className="flex gap-2 justify-center mt-12">
        <Button onClick={() => handlePageChange(page - 1)} disabled={page === 1} variant="outline">&laquo; Prev</Button>
        {Array.from({ length: pages }, (_, i) => (
          <Button
            key={i + 1}
            onClick={() => handlePageChange(i + 1)}
            variant={page === i + 1 ? "default" : "outline"}
          >
            {i + 1}
          </Button>
        ))}
        <Button onClick={() => handlePageChange(page + 1)} disabled={page === pages} variant="outline">Next &raquo;</Button>
      </div>
    </div>
  );
};

export default PostsList; 