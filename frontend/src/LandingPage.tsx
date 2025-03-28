import './LandingPage.css';
import backgroundImage from './assets/study-bg.jpg';
import HeroSection from './components/hero';
import { features } from "../data/features";
import { howItWorks } from "../data/howItWorks";
import { testimonials } from "../data/testimonials";
import { faqs } from "../data/faqs";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { ArrowRight } from 'lucide-react';

const LandingPage: React.FC = () => {
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
  };
  return (
    <div className="landing-container" style={{
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div className="overlay"></div>

      <main className="landing-main">
        <HeroSection />

        <section className="features-section">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </section>

        <section className="stats-section">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-item">
                <h3>50+</h3>
                <p>Industries Covered</p>
              </div>
              <div className="stat-item">
                <h3>1000+</h3>
                <p>Interviews Covered</p>
              </div>
              <div className="stat-item">
                <h3>95%</h3>
                <p>Success Rate</p>
              </div>
              <div className="stat-item">
                <h3>24/7</h3>
                <p>AI Support</p>
              </div>
            </div>
          </div>
        </section>

        <section className="how-it-works">
          <div className="container">
            <div className="section-header">
              <h2>How It Works</h2>
              <p>Four simple steps to accelerate your career path</p>
            </div>
            <div className="steps-grid">
              {howItWorks.map((item, index) => (
                <div key={index} className="step">
                  <div className="step-icon">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="testimonials-section">
          <div className="container">
            <h2 className="section-title">What Our Users Say</h2>
            <div className="testimonials-grid">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="testimonial-card">
                  <div className="testimonial-header">
                    <img src={testimonial.image} alt={testimonial.author} className="testimonial-image" />
                    <div>
                      <p className="testimonial-author">{testimonial.author}</p>
                      <p className="testimonial-role">{testimonial.role}</p>
                      <p className="testimonial-company">{testimonial.company}</p>
                    </div>
                  </div>
                  <blockquote className="testimonial-quote">"{testimonial.quote}"</blockquote>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="faq-section">
          <div className="container">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">
              Find answers to common questions about our platform
            </p>

            <div className="faq-container">
              {faqs.map((faq, index) => (
                <div key={index} className="faq-item">
                  <button
                    className={`faq-question ${activeIndex === index ? "active" : ""}`}
                    onClick={() => toggleAccordion(index)}>
                    {faq.question}
                    <span className="faq-icon">{activeIndex === index ? "−" : "+"}</span>
                  </button>
                  <div className={`faq-answer ${activeIndex === index ? "open" : ""}`}>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-container">
            <div className="cta-content">
              <h2 className="cta-title">Ready to Accelerate Your Career?</h2>
              <p className="cta-text">
                Join thousands of professionals who are advancing their careers with AI-powered guidance.
              </p>
                <button className="cta-button-1 bounce" onClick={handleGetStarted}>
                  Start Your Journey Today <ArrowRight className="cta-icon" />
                </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage; 