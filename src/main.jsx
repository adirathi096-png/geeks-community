import React, { useMemo, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import AuthPage from './components/AuthPage';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import GroupZones from './components/GroupZones';
import PostSection from './components/PostSection';
import IdeaSection from './components/IdeaSection';
import FeaturedStudents from './components/FeaturedStudents';
import StreakSection from './components/StreakSection';
import AdminPanel from './components/AdminPanel';
import { supabase } from './lib/supabaseClient';



function App() {
  const [theme, setTheme] = useState('dark');
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [groups, setGroups] = useState([]);
  const [featuredStudents, setFeaturedStudents] = useState([]);
  const [streak, setStreak] = useState({ current_streak: 0, total_posts: 0, last_post_at: null });
  const [loading, setLoading] = useState(true);
  const [preselectedGroupId, setPreselectedGroupId] = useState("");

  const isAdmin = currentUser?.role === 'admin';

  async function fetchProfile(userId) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setCurrentUser(null);
      } else {
        const formattedProfile = {
          ...profile,
          role: profile.is_admin ? 'admin' : 'student'
        };
        setCurrentUser(formattedProfile);
        // Fetch community data once user profile is verified
        fetchGroups();
        fetchPosts();
        fetchIdeas();
        fetchFeaturedStudents();
        fetchStreak(userId, formattedProfile);
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGroups() {
    const { data, error } = await supabase
      .from('community_groups')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      console.error('Error fetching groups:', error);
    } else if (data) {
      setGroups(data);
    }
  }

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        tag,
        image_url,
        created_at,
        user_id,
        group_id,
        profiles (
          full_name,
          email
        ),
        community_groups (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
    } else if (data) {
      const formatted = data.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        tag: post.tag,
        imageUrl: post.image_url,
        user_id: post.user_id,
        user_email: post.profiles?.email || null,
        author_email: post.profiles?.email || null,
        group_id: post.group_id,
        studentName: post.profiles?.full_name || 'Unknown',
        groupName: post.community_groups?.name || 'General',
        time: new Date(post.created_at).toLocaleString()
      }));
      setPosts(formatted);
    }
  }

  async function fetchIdeas() {
    const { data, error } = await supabase
      .from('ideas')
      .select(`
        id,
        title,
        description,
        suggested_group,
        created_at,
        user_id,
        profiles (
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ideas:', error);
    } else if (data) {
      const formatted = data.map((idea) => ({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        suggested_group: idea.suggested_group,
        user_id: idea.user_id,
        studentName: idea.profiles?.full_name || 'Unknown',
        time: new Date(idea.created_at).toLocaleString()
      }));
      setIdeas(formatted);
    }
  }

  async function fetchFeaturedStudents() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, roll_number, branch, passing_year, email, featured_award, featured_description, featured_image_url')
      .eq('is_featured', true);

    if (error) {
      console.error('Error fetching featured students:', error);
    } else {
      setFeaturedStudents(data || []);
    }
  }

  async function fetchStreak(userId, profile) {
    if (!profile || !profile.email) return;

    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_email', profile.email)
        .maybeSingle();

      if (error) {
        console.error('Error fetching streak:', error);
        return;
      }

      if (!data) {
        const defaultName = profile.full_name || profile.name || '';
        const newStreak = {
          user_id: userId,
          user_email: profile.email,
          full_name: defaultName,
          current_streak: 0,
          total_posts: 0,
          last_post_at: null
        };
        const { data: inserted, error: insertError } = await supabase
          .from('streaks')
          .insert(newStreak)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating streak:', insertError);
        } else if (inserted) {
          setStreak(inserted);
        }
      } else {
        // Reset current_streak to 0 if last_post_at is older than 24 hours
        if (data.last_post_at) {
          const lastPostTime = new Date(data.last_post_at).getTime();
          const diffMs = Date.now() - lastPostTime;
          if (diffMs > 24 * 60 * 60 * 1000 && data.current_streak > 0) {
            const { data: updated, error: updateError } = await supabase
              .from('streaks')
              .update({
                current_streak: 0,
                updated_at: new Date().toISOString()
              })
              .eq('user_email', profile.email)
              .select()
              .single();

            if (updateError) {
              console.error('Error resetting broken streak:', updateError);
              setStreak(data);
            } else if (updated) {
              setStreak(updated);
            }
          } else {
            setStreak(data);
          }
        } else {
          setStreak(data);
        }
      }
    } catch (err) {
      console.error('fetchStreak error:', err);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }

  async function addPost(postData) {
    if (!currentUser) return;

    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: currentUser.id,
        group_id: postData.groupId,
        title: postData.title,
        content: postData.content,
        tag: postData.tag,
        image_url: postData.imageUrl || null
      });

    if (error) {
      console.error('Error adding post:', error);
      alert('Failed to submit post: ' + error.message);
      throw error;
    } else {
      fetchPosts();
      updateStreak();
    }
  }

  async function updateStreak() {
    if (!currentUser || !currentUser.email) return;

    try {
      const { data: currentStreakData, error: fetchErr } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_email', currentUser.email)
        .maybeSingle();

      if (fetchErr) {
        console.error('Error fetching streak for update:', fetchErr);
        return;
      }

      let streakRow = currentStreakData;

      if (!streakRow) {
        const defaultName = currentUser.full_name || currentUser.name || '';
        const newStreak = {
          user_id: currentUser.id,
          user_email: currentUser.email,
          full_name: defaultName,
          current_streak: 0,
          total_posts: 0,
          last_post_at: null
        };
        const { data: inserted, error: insertError } = await supabase
          .from('streaks')
          .insert(newStreak)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default streak in updateStreak:', insertError);
          return;
        }
        streakRow = inserted;
      }

      const now = new Date();
      const newTotalPosts = streakRow.total_posts + 1;
      let newCurrentStreak = 0;

      if (!streakRow.last_post_at) {
        newCurrentStreak = 1;
      } else {
        const lastPostDate = new Date(streakRow.last_post_at);
        const diffMs = now.getTime() - lastPostDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        const isSameCalendarDay = 
          lastPostDate.getFullYear() === now.getFullYear() &&
          lastPostDate.getMonth() === now.getMonth() &&
          lastPostDate.getDate() === now.getDate();

        if (diffHours <= 24) {
          if (isSameCalendarDay) {
            newCurrentStreak = streakRow.current_streak;
          } else {
            newCurrentStreak = streakRow.current_streak + 1;
          }
        } else {
          newCurrentStreak = 1;
        }
      }

      const updateData = {
        current_streak: newCurrentStreak,
        total_posts: newTotalPosts,
        last_post_at: now.toISOString(),
        updated_at: now.toISOString(),
        full_name: currentUser.full_name || currentUser.name || streakRow.full_name || ''
      };

      const { data: updated, error } = await supabase
        .from('streaks')
        .update(updateData)
        .eq('user_email', currentUser.email)
        .select()
        .single();

      if (error) {
        console.error('Error updating streak:', error);
      } else if (updated) {
        setStreak(updated);
      }
    } catch (err) {
      console.error('updateStreak catch error:', err);
    }
  }

  async function deletePost(postId) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post: ' + error.message);
    } else {
      fetchPosts();
    }
  }

  async function addIdea(ideaData) {
    if (!currentUser) return;
    const { error } = await supabase
      .from('ideas')
      .insert({
        user_id: currentUser.id,
        title: ideaData.title,
        description: ideaData.description,
        suggested_group: ideaData.suggestedGroup
      });

    if (error) {
      console.error('Error adding idea:', error);
      alert('Failed to submit idea: ' + error.message);
    } else {
      fetchIdeas();
    }
  }

  async function deleteIdea(ideaId) {
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', ideaId);

    if (error) {
      console.error('Error deleting idea:', error);
      alert('Failed to remove idea: ' + error.message);
    } else {
      fetchIdeas();
    }
  }

  const zoneEmojis = {
    'Creative Zone': '🎨',
    'Brain Zone': '🧠',
    'Tech & Future Zone': '🚀',
    'Fun Zone': '😄'
  };

  const formattedZones = useMemo(() => {
    const zonesMap = {};
    groups.forEach((group) => {
      const zoneName = group.zone;
      if (!zonesMap[zoneName]) {
        zonesMap[zoneName] = {
          zone: zoneName,
          emoji: zoneEmojis[zoneName] || '🌐',
          groups: []
        };
      }
      zonesMap[zoneName].groups.push(group);
    });
    return Object.values(zonesMap);
  }, [groups]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading Geeks Community...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <main className={`app ${theme}`}>
        <AuthPage theme={theme} setTheme={setTheme} />
      </main>
    );
  }

  return (
    <main className={`app ${theme}`}>
      <Navbar user={currentUser} theme={theme} setTheme={setTheme} onLogout={handleLogout} isAdmin={isAdmin} />
      <Dashboard />
      <GroupZones zones={formattedZones} onPreselectGroup={(id) => {
        setPreselectedGroupId(id);
        document.getElementById('posts')?.scrollIntoView({ behavior: 'smooth' });
      }} />
      <PostSection 
        groups={groups} 
        posts={posts} 
        onAddPost={addPost} 
        onDeletePost={deletePost} 
        isAdmin={isAdmin} 
        currentUser={currentUser} 
        preselectedGroupId={preselectedGroupId}
        setPreselectedGroupId={setPreselectedGroupId}
      />
      <IdeaSection ideas={ideas} onAddIdea={addIdea} onDeleteIdea={deleteIdea} isAdmin={isAdmin} currentUser={currentUser} />
      <FeaturedStudents featuredStudents={featuredStudents} />
      <StreakSection streak={streak} posts={posts} />
      {isAdmin && (
        <AdminPanel
          posts={posts}
          ideas={ideas}
          groups={groups}
          onRefreshGroups={fetchGroups}
          onRefreshFeatured={fetchFeaturedStudents}
          onDeletePost={deletePost}
          onDeleteIdea={deleteIdea}
        />
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
