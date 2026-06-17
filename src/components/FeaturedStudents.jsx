import React from 'react';

export default function FeaturedStudents({ featuredStudents }) {
  return (
    <section id="featured" className="section-shell">
      <div className="section-heading">
        <span>Recognition System</span>
        <h2>Featured Students</h2>
        <p>Celebrate active students and keep the community motivated.</p>
      </div>

      <div className="cards-grid featured-grid" style={{ display: featuredStudents.length === 0 ? 'block' : 'grid' }}>
        {featuredStudents.length === 0 ? (
          <div className="empty-card glass-card" style={{ textAlign: 'center', padding: '45px 20px', color: 'var(--muted)', fontSize: '1.05rem' }}>
            No featured students yet.
          </div>
        ) : (
          featuredStudents.map((student) => {
            const initials = student.full_name
              ? student.full_name
                  .split(' ')
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
              : '?';

            return (
              <article className="featured-card glass-card" key={student.id} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {student.featured_image_url ? (
                    <img 
                      src={student.featured_image_url} 
                      alt={student.full_name} 
                      style={{ 
                        width: '50px', 
                        height: '50px', 
                        borderRadius: '50%', 
                        objectFit: 'cover', 
                        border: '2px solid rgba(125, 211, 252, 0.4)' 
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      border: '2px solid rgba(125, 211, 252, 0.2)'
                    }}>
                      {initials}
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text)' }}>{student.full_name}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>Roll: {student.roll_number}</p>
                  </div>
                </div>

                <div>
                  <span className="achievement-badge" style={{ marginBottom: '10px', display: 'inline-flex' }}>
                    🏆 Awarded: {student.featured_award}
                  </span>
                  <p style={{ margin: '8px 0 16px 0', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    <strong>Reason:</strong> {student.featured_description}
                  </p>
                </div>
                
                <div style={{ 
                  marginTop: 'auto', 
                  borderTop: '1px solid var(--card-border)', 
                  paddingTop: '10px', 
                  fontSize: '0.8rem', 
                  color: 'var(--muted)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '2px' 
                }}>
                  <div><strong>Branch:</strong> {student.branch} ({student.passing_year})</div>
                  <div><strong>Email:</strong> {student.email}</div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}


