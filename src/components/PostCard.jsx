import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function PostCard({ post, onDeletePost, isAdmin, currentUser }) {
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchLikes();
    fetchComments();
  }, [post.id]);

  async function fetchLikes() {
    try {
      const { data, error } = await supabase
        .from('post_interactions')
        .select('id, user_id, user_email, interaction_type')
        .eq('post_id', post.id)
        .eq('interaction_type', 'like');

      if (error) {
        console.error('Error fetching likes:', error);
        return;
      }

      setLikesCount(data ? data.length : 0);

      if (currentUser && data) {
        const userLiked = data.some((like) => like.user_email === currentUser.email);
        setIsLiked(userLiked);
      }
    } catch (err) {
      console.error('Error fetching likes catch:', err);
    }
  }

  async function fetchComments() {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (!error) setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  }

  async function handleToggleLike() {
    if (!currentUser) return;
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('post_interactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_email', currentUser.email)
          .eq('interaction_type', 'like');

        if (error) throw error;
        setLikesCount((prev) => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        const { error } = await supabase
          .from('post_interactions')
          .insert({
            post_id: post.id,
            user_id: currentUser.id || null,
            user_email: currentUser.email,
            interaction_type: 'like'
          });

        if (error) throw error;
        setLikesCount((prev) => prev + 1);
        setIsLiked(true);
      }
    } catch (err) {
      console.error('Like toggle error:', err);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser) return;
    setSubmittingComment(true);

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: currentUser.id,
          author_name: currentUser.full_name || currentUser.fullName || 'Student',
          content: newCommentText.trim()
        })
        .select()
        .single();

      if (error) throw error;
      setComments((prev) => [...prev, data]);
      setNewCommentText('');
    } catch (err) {
      console.error('Comment submission error:', err);
      alert('Failed to submit comment: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  }

  const canDeletePost = isAdmin || (currentUser && post.user_id === currentUser.id);

  return (
    <article className="feed-card glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="feed-meta">
        <strong>{post.studentName}</strong>
        <span>{post.groupName}</span>
        <span>{post.time}</span>
      </div>
      <h3 style={{ margin: '4px 0 8px' }}>{post.title}</h3>

      {post.imageUrl && (
        <div className="natural-post-image-wrapper">
          <img
            src={post.imageUrl}
            alt={post.title || "Post image"}
            className="natural-post-image"
            loading="lazy"
          />
        </div>
      )}

      <p style={{ margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{post.content}</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span className="tag-pill">#{post.tag}</span>
        {canDeletePost && (
          <button className="danger-btn small-btn" style={{ marginTop: 0 }} onClick={() => onDeletePost(post.id)}>
            Delete Post
          </button>
        )}
      </div>

      <hr style={{ border: '0', borderTop: '1px solid var(--card-border)', margin: '8px 0' }} />

      {/* ACTIONS */}
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <button
          onClick={handleToggleLike}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.9rem',
            color: isLiked ? '#ef4444' : 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 12px',
            borderRadius: '12px',
            backgroundColor: isLiked ? 'rgba(239, 68, 68, 0.1)' : 'var(--input)',
            border: '1px solid var(--card-border)',
            transition: 'background-color 0.2s, transform 0.1s'
          }}
        >
          {isLiked ? '❤️' : '🤍'} {isLiked ? 'Liked' : 'Like'} ({likesCount})
        </button>
        <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          💬 {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </span>
      </div>

      {/* COMMENTS FEED */}
      <div className="comments-section" style={{ marginTop: '10px' }}>
        {comments.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '10px',
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            marginBottom: '10px'
          }}>
            {comments.map((comment) => {
              const canDeleteComment = isAdmin || (currentUser && comment.user_id === currentUser.id);
              return (
                <div key={comment.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  fontSize: '0.85rem',
                  paddingBottom: '6px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ flex: 1, paddingRight: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                      <strong>{comment.author_name}</strong>
                      <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ margin: 0, opacity: 0.9 }}>{comment.content}</p>
                  </div>
                  {canDeleteComment && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: '2px 5px'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* INPUT FORM */}
        <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Write a comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            disabled={submittingComment}
            required
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: '0.88rem',
              borderRadius: '12px',
              margin: 0
            }}
          />
          <button
            type="submit"
            className="primary-btn small-btn"
            disabled={submittingComment || !newCommentText.trim()}
            style={{ padding: '8px 14px', borderRadius: '12px', whiteSpace: 'nowrap' }}
          >
            {submittingComment ? 'Sending...' : 'Comment'}
          </button>
        </form>
      </div>
    </article>
  );
}
