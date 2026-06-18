import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel({
  posts,
  ideas,
  groups,
  onRefreshGroups,
  onRefreshFeatured,
  onDeletePost,
  onDeleteIdea
}) {
  const [activeTab, setActiveTab] = useState('groups');
  const [students, setStudents] = useState([]);
  
  // States for updating WhatsApp group links
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroupLink, setNewGroupLink] = useState('');

  // States for editing student featured details
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editFeaturedAward, setEditFeaturedAward] = useState('');
  const [editFeaturedDescription, setEditFeaturedDescription] = useState('');
  const [editFeaturedImageUrl, setEditFeaturedImageUrl] = useState('');

  async function fetchStudents() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching students:', error);
      } else {
        setStudents(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  async function handleUpdateGroupLink(groupId) {
    if (!newGroupLink.trim()) {
      window.showToast('Please enter a valid WhatsApp link.', 'warning');
      return;
    }
    try {
      const { error } = await supabase
        .from('community_groups')
        .update({ whatsapp_link: newGroupLink.trim() })
        .eq('id', groupId);

      if (error) {
        window.showToast('Failed to update group link: ' + error.message, 'error');
      } else {
        window.showToast('WhatsApp link updated!', 'success');
        setEditingGroup(null);
        setNewGroupLink('');
        if (onRefreshGroups) onRefreshGroups();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpdateStudentFeatured(studentId) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_featured: editIsFeatured,
          featured_award: editFeaturedAward.trim() || null,
          featured_description: editFeaturedDescription.trim() || null,
          featured_image_url: editFeaturedImageUrl.trim() || null
        })
        .eq('id', studentId);

      if (error) {
        window.showToast('Failed to update student featured details: ' + error.message, 'error');
      } else {
        window.showToast('Student featured status updated successfully!', 'success');
        setEditingStudentId(null);
        fetchStudents();
        if (onRefreshFeatured) onRefreshFeatured();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function startEditingStudent(student) {
    setEditingStudentId(student.id);
    setEditIsFeatured(!!student.is_featured);
    setEditFeaturedAward(student.featured_award || '');
    setEditFeaturedDescription(student.featured_description || '');
    setEditFeaturedImageUrl(student.featured_image_url || '');
  }

  return (
    <section id="admin" className="section-shell admin-section">
      <div className="section-heading">
        <span>Admin Portal</span>
        <h2>Admin Control Panel</h2>
        <p>Manage community database resources: WhatsApp group links, student spotlights, posts, and ideas.</p>
      </div>

      <div className="admin-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          className={`secondary-btn ${activeTab === 'groups' ? 'primary-btn' : ''}`} 
          onClick={() => setActiveTab('groups')}
        >
          Group Links ({groups.length})
        </button>
        <button 
          className={`secondary-btn ${activeTab === 'students' ? 'primary-btn' : ''}`} 
          onClick={() => { setActiveTab('students'); fetchStudents(); }}
        >
          Students ({students.length})
        </button>
        <button 
          className={`secondary-btn ${activeTab === 'posts' ? 'primary-btn' : ''}`} 
          onClick={() => setActiveTab('posts')}
        >
          Posts ({posts.length})
        </button>
        <button 
          className={`secondary-btn ${activeTab === 'ideas' ? 'primary-btn' : ''}`} 
          onClick={() => setActiveTab('ideas')}
        >
          Ideas ({ideas.length})
        </button>
      </div>

      <div className="admin-content glass-card" style={{ padding: '20px', minHeight: '300px' }}>

        {/* GROUP LINKS TAB */}
        {activeTab === 'groups' && (
          <div>
            <h3>Manage Group WhatsApp Links</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {groups.map((group) => (
                <div key={group.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <strong>{group.name}</strong> <span style={{ opacity: 0.6, fontSize: '0.85rem' }}>({group.zone})</span>
                    <div style={{ fontSize: '0.85rem', color: '#00e676', wordBreak: 'break-all' }}>
                      Link: {group.whatsapp_link}
                    </div>
                  </div>
                  <div>
                    {editingGroup === group.id ? (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input 
                          type="text" 
                          placeholder="Enter WhatsApp link" 
                          value={newGroupLink} 
                          onChange={(e) => setNewGroupLink(e.target.value)}
                          style={{ margin: 0, padding: '5px' }}
                        />
                        <button className="primary-btn small-btn" onClick={() => handleUpdateGroupLink(group.id)}>Save</button>
                        <button className="secondary-btn small-btn" onClick={() => setEditingGroup(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button 
                        className="secondary-btn small-btn" 
                        onClick={() => {
                          setEditingGroup(group.id);
                          setNewGroupLink(group.whatsapp_link);
                        }}
                      >
                        Edit Link
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div>
            <h3>Manage Student Recognition</h3>
            <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '20px' }}>
              Toggle is_featured and update awards directly for any registered student.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '10px' }}>Student</th>
                    <th style={{ padding: '10px' }}>Roll / Contact</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px' }}>Featured Info</th>
                    <th style={{ padding: '10px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const isEditing = editingStudentId === student.id;
                    return (
                      <React.Fragment key={student.id}>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'top' }}>
                          <td style={{ padding: '10px' }}>
                            <strong>{student.full_name}</strong>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{student.branch} ({student.passing_year})</div>
                          </td>
                          <td style={{ padding: '10px' }}>
                            <div>{student.roll_number}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{student.email}</div>
                          </td>
                          <td style={{ padding: '10px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              backgroundColor: student.is_featured ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.05)',
                              color: student.is_featured ? '#00e676' : 'var(--muted)'
                            }}>
                              {student.is_featured ? 'Featured' : 'Standard'}
                            </span>
                          </td>
                          <td style={{ padding: '10px', maxWidth: '300px' }}>
                            {student.is_featured ? (
                              <div>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#00e676' }}>🏆 {student.featured_award}</div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '4px' }}>{student.featured_description}</div>
                                {student.featured_image_url && (
                                  <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '4px', wordBreak: 'break-all' }}>Image: {student.featured_image_url}</div>
                                )}
                              </div>
                            ) : (
                              <span style={{ opacity: 0.5 }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '10px' }}>
                            {!isEditing && (
                              <button 
                                className="secondary-btn small-btn"
                                onClick={() => startEditingStudent(student)}
                              >
                                Edit Recognition
                              </button>
                            )}
                          </td>
                        </tr>
                        {isEditing && (
                          <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <td colSpan="5" style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <div style={{ display: 'grid', gap: '10px' }}>
                                <h4 style={{ margin: '0 0 5px 0' }}>Update Spotlight Details for {student.full_name}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                    <input 
                                      type="checkbox" 
                                      checked={editIsFeatured} 
                                      onChange={(e) => setEditIsFeatured(e.target.checked)}
                                      style={{ width: 'auto', margin: 0 }}
                                    />
                                    <strong>Feature this student on Dashboard</strong>
                                  </label>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                  <div>
                                    <label style={{ fontSize: '0.85rem', opacity: 0.8 }}>Featured Award / Title</label>
                                    <input 
                                      placeholder="e.g. Best Photographer of the Week" 
                                      value={editFeaturedAward} 
                                      onChange={(e) => setEditFeaturedAward(e.target.value)} 
                                      style={{ padding: '8px', marginTop: '4px' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '0.85rem', opacity: 0.8 }}>Featured Image URL (Optional)</label>
                                    <input 
                                      placeholder="https://example.com/image.jpg" 
                                      value={editFeaturedImageUrl} 
                                      onChange={(e) => setEditFeaturedImageUrl(e.target.value)} 
                                      style={{ padding: '8px', marginTop: '4px' }}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label style={{ fontSize: '0.85rem', opacity: 0.8 }}>Featured Description / Achievement Details</label>
                                  <textarea 
                                    placeholder="Describe their contribution..." 
                                    value={editFeaturedDescription} 
                                    onChange={(e) => setEditFeaturedDescription(e.target.value)} 
                                    rows="2"
                                    style={{ padding: '8px', marginTop: '4px' }}
                                  />
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                  <button className="primary-btn small-btn" onClick={() => handleUpdateStudentFeatured(student.id)}>
                                    Save Changes
                                  </button>
                                  <button className="secondary-btn small-btn" onClick={() => setEditingStudentId(null)}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          <div>
            <h3>Recent Student Posts</h3>
            {posts.length === 0 ? (
              <p>No posts to manage.</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {posts.map((post) => (
                  <div key={post.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <div>
                      <strong>{post.title}</strong> by {post.studentName}
                      <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: '0.9rem' }}>{post.content.substring(0, 100)}...</p>
                    </div>
                    <button className="danger-btn small-btn" onClick={() => onDeletePost(post.id)}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* IDEAS TAB */}
        {activeTab === 'ideas' && (
          <div>
            <h3>Submitted Ideas & Suggestions</h3>
            {ideas.length === 0 ? (
              <p>No ideas to view.</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {ideas.map((idea) => (
                  <div key={idea.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <div>
                      <strong>{idea.title}</strong> by {idea.studentName}
                      <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: '0.9rem' }}>{idea.description.substring(0, 100)}...</p>
                    </div>
                    <button className="danger-btn small-btn" onClick={() => onDeleteIdea(idea.id)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
