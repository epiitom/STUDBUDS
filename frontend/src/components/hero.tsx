import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  const { isSignedIn } = useAuth(); // Get user's authentication status from Clerk

  // Handle navigation based on authentication
  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate('/app'); // If logged in, go to /app
    } else {
      navigate('/sign-in'); // Otherwise, go to sign-in page first
    }
  };
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">Your Personal Study Companion</h1>
          <p className='hero-subtitle'>Transform your study habits with AI-powered assistance, smart timers, and personalized study plans.</p>
          <div className='hero-button-container'>
            <button className="cta-button" onClick={handleGetStarted}>
              Get Started
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection