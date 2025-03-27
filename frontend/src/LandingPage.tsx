import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import backgroundImage from './assets/study-bg.jpg';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container" style={{ 
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div className="overlay"></div>
      <nav className="landing-nav">
        <div className="nav-logo">StudyBuds</div>
        <button className="try-now-btn" onClick={() => navigate('/app')}>
          Try Now
        </button>
      </nav>
      
      <main className="landing-main">
        <div className="hero-section">
          <h1>Your Personal Study Companion</h1>
          <p>Transform your study habits with AI-powered assistance, smart timers, and personalized study plans.</p>
          <button className="cta-button" onClick={() => navigate('/app')}>
            Get Started
          </button>
        </div>

        <div className="features-section">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>AI Study Assistant</h3>
            <p>Get instant help with your studies and personalized guidance</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏱️</div>
            <h3>Smart Timer</h3>
            <p>Stay focused with our Pomodoro timer and break reminders</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Task Manager</h3>
            <p>Organize your study tasks and track your progress</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage; 