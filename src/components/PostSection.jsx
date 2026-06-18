import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import PostCard from './PostCard';

export default function PostSection({
  groups,
  posts,
  onAddPost,
  onDeletePost,
  isAdmin,
  currentUser,
  preselectedGroupId,
  setPreselectedGroupId
}) {
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Sync the local selection state when preselectedGroupId changes externally
  useEffect(() => {
    if (preselectedGroupId) {
      setSelectedGroupId(preselectedGroupId);
    }
  }, [preselectedGroupId]);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }

  function handleRemoveImage() {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    
    if (!selectedGroupId) {
      window.showToast("Please select a group", "warning");
      return;
    }

    const form = new FormData(event.currentTarget);
    const postData = {
      title: form.get('title').trim(),
      content: form.get('content').trim(),
      tag: form.get('tag').trim()
    };

    if (!postData.title || !postData.content || !postData.tag) return;

    setSubmitting(true);
    let imageUrl = null;

    try {
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Attempt upload to 'content-images' bucket
        const { data, error: uploadError } = await supabase.storage
          .from('content-images')
          .upload(filePath, selectedImage);

        if (uploadError) {
          if (
            uploadError.message && 
            (uploadError.message.toLowerCase().includes('bucket not found') || 
             uploadError.error === 'Bucket not found')
          ) {
            throw new Error("The 'content-images' storage bucket was not found. Please create a public bucket named 'content-images' in your Supabase dashboard > Storage, configure its policies, and try again.");
          }
          throw uploadError;
        }

        // Retrieve public URL
        const { data: urlData } = supabase.storage
          .from('content-images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      await onAddPost({ ...postData, groupId: selectedGroupId, imageUrl });

      event.target.reset();
      handleRemoveImage();
      setSelectedGroupId("");
      if (setPreselectedGroupId) setPreselectedGroupId("");
    } catch (err) {
      console.error('Post submission error:', err);
      window.showToast(err.message || 'An error occurred while uploading the post.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="posts" className="section-shell">
      <div className="section-heading">
        <span>Student Posts</span>
        <h2>Create and share posts</h2>
        <p>Students can post in every group. Admin or owners can delete posts.</p>
      </div>

      <div className="split-layout">
        <form className="glass-card form-card" onSubmit={handleSubmit}>
          <select 
            name="groupId" 
            value={selectedGroupId} 
            onChange={(e) => setSelectedGroupId(e.target.value)}
            required
            disabled={submitting}
            className="bg-white text-zinc-900 dark:bg-zinc-800 dark:text-white border border-zinc-300 dark:border-zinc-700"
          >
            <option value="" disabled>Select Group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
          <input name="title" placeholder="Post Title" required disabled={submitting} />
          <textarea name="content" placeholder="Post Content" rows="5" required disabled={submitting} />
          <input name="tag" placeholder="Category / Tag" required disabled={submitting} />
          
          <div style={{ marginTop: '12px' }}>
            <input 
              id="post-image-upload"
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleImageChange}
              disabled={submitting}
              style={{ display: 'none' }}
            />
            
            {imagePreview ? (
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span style={{ opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                    Selected: <strong>{selectedImage?.name}</strong>
                  </span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label htmlFor="post-image-upload" style={{ cursor: 'pointer', color: '#60a5fa', textDecoration: 'underline', fontSize: '0.8rem' }}>
                      Change
                    </label>
                    <span style={{ opacity: 0.2 }}>|</span>
                    <button 
                      type="button" 
                      onClick={handleRemoveImage}
                      className="remove-image-btn"
                      style={{ marginTop: 0, padding: '4px 10px', fontSize: '0.8rem' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="upload-preview">
                  <img src={imagePreview} alt="Upload preview" />
                </div>
              </div>
            ) : (
              <label htmlFor="post-image-upload" className="custom-upload-box">
                <div className="upload-icon">📷</div>
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>Upload Image (Optional)</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', opacity: 0.7 }}>PNG, JPG, WEBP supported</p>
                </div>
              </label>
            )}
          </div>

          <button className="primary-btn" disabled={submitting}>
            {submitting ? 'Uploading & Posting...' : 'Submit Post'}
          </button>
        </form>

        <div className="feed-list">
          {posts.length === 0 && (
            <div className="empty-card glass-card">No posts yet. Create the first community post.</div>
          )}
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onDeletePost={onDeletePost} 
              isAdmin={isAdmin} 
              currentUser={currentUser} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}
