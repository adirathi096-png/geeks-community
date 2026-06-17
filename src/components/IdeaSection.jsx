import React from 'react';

export default function IdeaSection({
  ideas,
  onAddIdea,
  onDeleteIdea,
  isAdmin,
  currentUser
}) {
  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const idea = {
      title: form.get('title').trim(),
      description: form.get('description').trim(),
      suggestedGroup: form.get('suggestedGroup').trim() || 'General Community Idea'
    };

    if (!idea.title || !idea.description) return;
    onAddIdea(idea);
    event.currentTarget.reset();
  }

  return (
    <section id="ideas" className="section-shell">
      <div className="section-heading">
        <span>Ideas & Suggestions</span>
        <h2>Share Your Idea</h2>
        <p>Suggest changes, new groups, improvements, or events for Geeks Community.</p>
      </div>

      <div className="split-layout">
        <form className="glass-card form-card" onSubmit={handleSubmit}>
          <input name="title" placeholder="Idea Title" required />
          <textarea name="description" placeholder="Idea Description" rows="5" required />
          <input name="suggestedGroup" placeholder="Suggested Group Name (optional)" />
          <button className="primary-btn">Submit Idea</button>
        </form>

        <div className="feed-list">
          {ideas.length === 0 && (
            <div className="empty-card glass-card">No ideas yet. Suggest something powerful for the community.</div>
          )}
          {ideas.map((idea) => {
            const canDelete = isAdmin || (currentUser && idea.user_id === currentUser.id);
            return (
              <article className="feed-card glass-card" key={idea.id}>
                <div className="feed-meta">
                  <strong>{idea.studentName}</strong>
                  <span>{idea.suggested_group}</span>
                  <span>{idea.time}</span>
                </div>
                <h3>{idea.title}</h3>
                <p>{idea.description}</p>
                {canDelete && (
                  <button className="danger-btn" onClick={() => onDeleteIdea(idea.id)}>
                    Remove Idea
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
