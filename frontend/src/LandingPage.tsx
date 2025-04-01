import './LandingPage.css';
import backgroundImage from './assets/study-bg.jpg';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { ArrowRight, BookOpen, Brain, Calendar, Clock, Compass, Lightbulb, Target, Users } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate('/app');
    } else {
      navigate('/sign-in');
    }
  };

  const toggleAccordion = (index: number) => {
    setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  // Updated features for student learning
  const features = [
    {
      icon: <BookOpen size={32} />,
      title: "Personalized Learning Paths",
      description: "AI-powered study plans tailored to your learning style, goals, and schedule."
    },
    {
      icon: <Brain size={32} />,
      title: "Spaced Repetition System",
      description: "Scientifically proven memory techniques to help you retain information longer."
    },
    {
      icon: <Target size={32} />,
      title: "Progress Tracking",
      description: "Visualize your improvement with detailed analytics and achievement milestones."
    },
    {
      icon: <Users size={32} />,
      title: "Collaborative Study Groups",
      description: "Connect with peers in your field to share notes, discuss topics, and solve problems together."
    }
  ];

  // Updated how it works section
  const howItWorks = [
    {
      icon: <Compass size={32} />,
      title: "Create Your Profile",
      description: "Tell us about your academic goals, learning preferences, and study schedule."
    },
    {
      icon: <Lightbulb size={32} />,
      title: "Get Personalized Plans",
      description: "Receive customized study plans and resources based on your unique learning needs."
    },
    {
      icon: <Calendar size={32} />,
      title: "Study Smarter",
      description: "Follow your optimized study schedule with built-in breaks and focus sessions."
    },
    {
      icon: <Clock size={32} />,
      title: "Track Progress",
      description: "Monitor your improvement, identify knowledge gaps, and celebrate achievements."
    }
  ];

  // Updated testimonials
  const testimonials = [
    {
      image: "/api/placeholder/60/60",
      author: "Alex Johnson",
      role: "Medical Student",
      company: "Harvard University",
      quote: "This platform completely transformed how I prepare for exams. The spaced repetition system helped me retain complex medical terminology that I previously struggled with."
    },
    {
      image: "/api/placeholder/60/60",
      author: "Sophia Chen",
      role: "Computer Science Major",
      company: "Stanford University",
      quote: "The personalized learning paths helped me master data structures and algorithms at my own pace. I've improved my GPA significantly since using this platform."
    },
    {
      image: "/api/placeholder/60/60",
      author: "Marcus Williams",
      role: "High School Student",
      company: "Phillips Academy",
      quote: "I used to procrastinate constantly, but the focused study sessions and progress tracking keep me motivated. My parents are amazed at how my study habits have improved."
    }
  ];

  // Updated FAQs
  const faqs = [
    {
      question: "How does the personalized learning system work?",
      answer: "Our AI analyzes your learning style, academic goals, and performance data to create customized study plans. The system adapts as you progress, focusing more on areas where you need additional practice."
    },
    {
      question: "Can I use this platform for any subject?",
      answer: "Yes! Our platform supports all major academic subjects from high school through graduate-level courses. We have specialized resources for STEM fields, humanities, languages, and professional certifications."
    },
    {
      question: "How much time do I need to commit?",
      answer: "The platform is designed to work with your schedule. You can use it for as little as 15 minutes a day or integrate it into longer study sessions. Our algorithm will optimize your study plan based on your available time."
    },
    {
      question: "Is there a mobile app available?",
      answer: "Yes, we have iOS and Android apps that sync with your account. You can study on any device and your progress will be tracked consistently across platforms."
    },
    {
      question: "Can I connect with other students?",
      answer: "Absolutely! Our collaborative features allow you to join study groups, participate in discussion forums, and even find study partners in your area or institution."
    }
  ];

  return (
    <div className="landing-container" style={{
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div className="overlay"></div>

      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-title">Learn Smarter, Not Harder</h1>
              <p className="hero-subtitle">
                Boost your academic performance with AI-powered study plans, proven memory techniques, and personalized learning paths designed for students.
              </p>
              <div className="hero-button-container">
                <button className="cta-button" onClick={handleGetStarted}>
                  Start Learning Effectively
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-item">
                <h3>20+</h3>
                <p>Academic Subjects</p>
              </div>
              <div className="stat-item">
                <h3>500,000+</h3>
                <p>Active Students</p>
              </div>
              <div className="stat-item">
                <h3>87%</h3>
                <p>Grade Improvement</p>
              </div>
              <div className="stat-item">
                <h3>24/7</h3>
                <p>Study Support</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="how-it-works">
          <div className="container">
            <div className="section-header">
              <h2>How It Works</h2>
              <p>Four simple steps to transform your learning experience</p>
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

        {/* Testimonials Section */}
        <section className="testimonials-section">
          <div className="container">
            <h2 className="section-title">What Our Students Say</h2>
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

        {/* FAQ Section */}
        <section className="faq-section">
          <div className="container">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">
              Find answers to common questions about our learning platform
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

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-container">
            <div className="cta-content">
              <h2 className="cta-title">Ready to Transform Your Learning?</h2>
              <p className="cta-text">
                Join thousands of students who are achieving their academic goals with our science-backed learning platform.
              </p>
              <button className="cta-button-1 bounce" onClick={handleGetStarted}>
                Begin Your Learning Journey <ArrowRight className="cta-icon" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;