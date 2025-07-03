import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { AuthContext } from '../context/AuthContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";

const CommentForm = ({ onSubmit, loading, isReply, user }) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || (!user && !name.trim())) return;
    onSubmit({ name: user ? undefined : name, content });
    setContent('');
    if (!user) setName('');
  };

  return (
    <form onSubmit={handleSubmit} className={`flex ${isReply ? 'mt-2 mb-2' : 'mt-4 mb-4'} gap-2 items-center`}>
      {!user && (
        <Input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-32"
        />
      )}
      <Input
        type="text"
        placeholder={isReply ? "Write a reply..." : "Write a comment..."}
        value={content}
        onChange={e => setContent(e.target.value)}
        required
        className="flex-1"
      />
      <Button type="submit" disabled={loading} className="min-w-[90px]">{loading ? 'Posting...' : isReply ? 'Reply' : 'Comment'}</Button>
    </form>
  );
};

const PostDetail = () => {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const { data: post, error, loading, request } = useApi();
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // commentId being replied to
  const [replyLoading, setReplyLoading] = useState(null); // commentId being replied to

  useEffect(() => {
    request({ endpoint: `/api/posts/${id}` });
  }, [id, request]);

  const handleAddComment = async ({ name, content }) => {
    setCommentLoading(true);
    try {
      await fetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content }),
      });
      await request({ endpoint: `/api/posts/${id}` }); // Refresh post
      setShowCommentForm(false);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddReply = async (commentId, { name, content }) => {
    setReplyLoading(commentId);
    try {
      await fetch(`/api/posts/${id}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content }),
      });
      await request({ endpoint: `/api/posts/${id}` }); // Refresh post
      setReplyingTo(null);
    } finally {
      setReplyLoading(null);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.href = '/';
    } catch (err) {
      alert('Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await fetch(`/api/posts/${id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await request({ endpoint: `/api/posts/${id}` });
    } catch (err) {
      alert('Failed to delete comment');
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      await fetch(`/api/posts/${id}/comments/${commentId}/replies/${replyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await request({ endpoint: `/api/posts/${id}` });
    } catch (err) {
      alert('Failed to delete reply');
    }
  };

  if (loading) return <div className="text-center py-8">Loading post...</div>;
  if (error) return <Alert variant="destructive" className="my-4">Error: {error}</Alert>;
  if (!post) return <div className="text-center py-8">Post not found.</div>;

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start mt-8 max-w-4xl mx-auto">
      {/* Left: Image and meta */}
      <div className="flex flex-col items-center w-full md:w-80 max-w-xs">
        {post.featuredImage && (
          <img src={`http://localhost:5000${post.featuredImage}`} alt={post.title} className="w-full max-h-[400px] object-cover rounded-lg mb-4" />
        )}
        <div className="w-full bg-card rounded-lg p-4 shadow-sm">
          <h2 className="text-xl font-bold mb-2">{post.title}</h2>
          <div className="text-sm text-muted-foreground mb-1">
            <span><b>Category:</b> {post.category?.name || post.category}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span><b>Author:</b> {post.author?.username || post.author}</span>
          </div>
        </div>
      </div>
      {/* Right: Content and actions */}
      <Card className="flex-1 min-w-[250px] w-full">
        <CardHeader>
          <CardTitle className="hidden md:block">Post Content</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base mb-4 leading-relaxed">{post.content}</p>
          <Link to={`/edit/${post._id}`} className="text-blue-600 hover:underline">Edit Post</Link>
          {user && (user.id === (post.author?._id || post.author)) && (
            <Button
              variant="destructive"
              className="ml-4"
              onClick={handleDeletePost}
            >
              Delete Post
            </Button>
          )}
          {/* Comments Section */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-lg">Comments</span>
              <Button
                variant="outline"
                size="icon"
                title="Add a comment"
                onClick={() => setShowCommentForm(v => !v)}
              >
                💬
              </Button>
            </div>
            {showCommentForm && (
              <CommentForm onSubmit={handleAddComment} loading={commentLoading} user={user} />
            )}
            <div className="mt-4 space-y-6">
              {post.comments && post.comments.length === 0 && <div>No comments yet.</div>}
              {post.comments && post.comments.map(comment => (
                <Card key={comment._id} className="p-4">
                  <div className="font-semibold text-base flex items-center">
                    {comment.user ? (comment.user.username || 'User') : comment.name || 'Guest'}
                    <span className="font-normal text-xs text-muted-foreground ml-2">{new Date(comment.createdAt).toLocaleString()}</span>
                    {user && (user.id === (post.author?._id || post.author)) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="ml-3"
                        onClick={() => handleDeleteComment(comment._id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                  <div className="my-2">{comment.content}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 px-2 py-1"
                    onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                  >
                    Reply
                  </Button>
                  {replyingTo === comment._id && (
                    <CommentForm
                      onSubmit={data => handleAddReply(comment._id, data)}
                      loading={replyLoading === comment._id}
                      isReply
                      user={user}
                    />
                  )}
                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-6 mt-3 space-y-3">
                      {comment.replies.map(reply => (
                        <Card key={reply._id || reply.createdAt} className="p-3 border-l-4 border-muted-foreground/20">
                          <div className="font-semibold text-sm flex items-center">
                            {reply.user ? (reply.user.username || 'User') : reply.name || 'Guest'}
                            <span className="font-normal text-xs text-muted-foreground ml-2">{new Date(reply.createdAt).toLocaleString()}</span>
                            {user && (user.id === (post.author?._id || post.author)) && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="ml-2"
                                onClick={() => handleDeleteReply(comment._id, reply._id)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                          <div>{reply.content}</div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostDetail; 