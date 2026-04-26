import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import axios from 'axios';

const badgeImages = import.meta.glob('../assets/BADGES/*.webp', { eager: true, import: 'default' });

const badgeDescriptions = {
  "FIRST STEP": "You studied your very first topic. Every expert started exactly here.",
  "3 DAY STREAK": "Three days of consistent study. The habit is beginning to form.",
  "WEEK WARRIOR": "Seven days straight. You've proven you can show up, even on hard days.",
  "FORTNIGHT": "Two solid weeks. You're not just studying — you're building discipline.",
  "MONTH MASTER": "30 days in a row. You are now in the top 1% of consistent learners.",
  "SHARP SHOOTER": "You scored 90% or above on your very first attempt at a topic quiz.",
  "QUIZ MASTER": "You've completed 10 quizzes. Practice is becoming your superpower.",
  "BOOKWORM": "50 topics marked as studied. Your syllabus doesn't intimidate you anymore.",
  "SPEED DEMON": "10 questions answered in under 15 seconds each. Your mind is sharp.",
  "MULTILINGUAL": "You switched the app to Hindi. Learning in your own language is power.",
  "COMEBACK KID": "You retook a quiz and improved your score by 30% or more. Resilience.",
  "SYLLABUS SLAYER": "Every single topic in a subject is ticked. You owned that subject.",
  "SYNC STAR": "You synced offline progress 3 times. You studied even without the internet.",
  "CAREER READY": "You completed your career guidance. You now know your path forward."
};

const Profile = () => {
  const { user, logout } = useAuth();
  const lang = user?.language || 'en';
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const { data } = await axios.get('/api/badges');
        setBadges(data.badges || []);
        // Mark unseen badges as seen
        for (const b of (data.unseen || [])) {
          axios.put('/api/badges/seen', { badgeId: b }).catch(() => {});
        }
      } catch (err) { console.error('Badges error:', err); }
    };
    fetchBadges();
  }, []);

  const g = user?.gamification || {};

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--section-gap)', gap: 'clamp(12px, 3vw, 24px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 24px)', minWidth: 0 }}>
          <div style={{ width: 'clamp(56px, 15vw, 80px)', height: 'clamp(56px, 15vw, 80px)', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 4vw, 1.5rem)', flexShrink: 0 }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</h1>
            <p style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="btn-secondary">{t('log_out', lang)}</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 'var(--section-gap)' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}>🔥 {g.current_streak || 0}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('streak', lang)}</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}>{g.longest_streak || 0}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('longest_streak', lang)}</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}>{g.total_topics_studied || 0}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('topics_studied', lang)}</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}>{g.total_quizzes_taken || 0}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('quizzes_taken', lang)}</div>
        </div>
      </div>

      <h2 style={{ marginBottom: '16px' }}>{t('badges', lang)}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(120px, 100%), 1fr))', gap: 'clamp(8px, 2vw, 16px)' }}>
        {badges.map(badge => {
          const badgePath = `../assets/BADGES/${badge.name.toUpperCase()}.webp`;
          const badgeImg = badgeImages[badgePath];
          const desc = badgeDescriptions[badge.name.toUpperCase()] || badge.description;
          
          return (
            <div 
              key={badge.id} 
              className="badge-card" 
              data-description={desc}
            >
              {!badge.earned && <div style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '12px', opacity: 0.4 }}>🔒</div>}
              <div style={{ marginBottom: '12px', height: 'clamp(48px, 12vw, 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: badge.earned ? 1 : 0.25, filter: badge.earned ? 'none' : 'grayscale(100%)' }}>
                {badgeImg ? (
                  <img src={badgeImg} alt={badge.name} style={{ maxWidth: 'clamp(56px, 14vw, 80px)', maxHeight: 'clamp(56px, 14vw, 80px)', objectFit: 'contain' }} />
                ) : (
                  <span className="badge-icon">{badge.icon}</span>
                )}
              </div>
              <div className={`badge-name ${!badge.earned ? 'unearned' : ''}`}>{badge.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Profile;
