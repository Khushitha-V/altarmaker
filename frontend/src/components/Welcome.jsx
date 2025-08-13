import React, { useState, useEffect } from "react";
import "./Welcome.css";

const Welcome = ({ onLogin, onRegister }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentReviewPage, setCurrentReviewPage] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [feedback, setFeedback] = useState({
    name: '',
    email: '',
    rating: 0,
    message: ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackList, setFeedbackList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const reviewsPerPage = 3;
  const totalReviewPages = Math.ceil(feedbackList.length / reviewsPerPage);
  
  const nextReviewPage = () => {
    setCurrentReviewPage(prev => (prev === totalReviewPages - 1 ? 0 : prev + 1));
  };
  
  const prevReviewPage = () => {
    setCurrentReviewPage(prev => (prev === 0 ? totalReviewPages - 1 : prev - 1));
  };
  
  const goToReviewPage = (index) => {
    setCurrentReviewPage(index);
  };
  
  const slides = [
    {
      id: 1,
      image: "/welcomeimages/altar1.png",
      alt: "Traditional Altar Design",
      title: "Traditional Altar Design"
    },
    {
      id: 2,
      image: "/welcomeimages/altar2.png",
      alt: "Modern Altar Design",
      title: "Modern Altar Design"
    },
    {
      id: 3,
      image: "/welcomeimages/altar3.png",
      alt: "Minimalist Altar Design",
      title: "Minimalist Altar Design"
    }
  ];

  const goToSlide = (index) => {
    setCurrentSlide(index);
    // Reset autoplay timer when manually changing slides
    if (isAutoPlay) {
      setIsAutoPlay(false);
      setTimeout(() => setIsAutoPlay(true), 8000);
    }
  };

  const goToPrevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1));
    if (isAutoPlay) {
      setIsAutoPlay(false);
      setTimeout(() => setIsAutoPlay(true), 8000);
    }
  };

  const goToNextSlide = () => {
    setCurrentSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
    if (isAutoPlay) {
      setIsAutoPlay(false);
      setTimeout(() => setIsAutoPlay(true), 8000);
    }
  };

  // Fetch feedback from the backend
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/feedback');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setFeedbackList(result.data);
          } else {
            console.error('Failed to fetch feedback:', result.error);
          }
        } else {
          throw new Error('Failed to fetch feedback');
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
      }
    };

    fetchFeedback();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.name || !feedback.email || !feedback.message || feedback.rating === 0) {
      alert('Please fill in all fields and provide a rating');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: feedback.name,
          email: feedback.email,
          message: feedback.message,
          rating: feedback.rating
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setFeedbackList([result.data, ...feedbackList]);
        setFeedback({
          name: '',
          email: '',
          rating: 0,
          message: ''
        });
        alert('Thank you for your feedback!');
      } else {
        throw new Error(result.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlay) return;
    
    const timer = setTimeout(() => {
      goToNextSlide();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [currentSlide, isAutoPlay]);
  
  // Pause autoplay when hovering over the carousel
  const handleMouseEnter = () => {
    setIsAutoPlay(false);
  };
  
  const handleMouseLeave = () => {
    setIsAutoPlay(true);
  };
  
  // Auto-hide controls state is now managed at the top with other states

  return (
    <div className="welcome-page">
      <div className="welcome-container">
        {/* Header */}
        <header className="welcome-header">
        <div className="header-left">
          <div className="logo-container">
            <img 
              src="/logo/logo.png" 
              alt="Logo" 
              className="logo-image"
            />
          </div>
          <div className="app-name">
            <span className="app-name-a">A</span>
            <span className="app-name-ltar">ltar</span>
            <span className="app-name-m">M</span>
            <span className="app-name-aker">aker</span>
          </div>
        </div>
        
        <div className="header-right">
          <button className="get-started-btn" onClick={onLogin}>
            🚀 Get Started
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="welcome-content">
        <div className="hero-section">
          <h1 className="hero-title">
            Create Beautiful Altar Designs !
          </h1>
          <p className="hero-subtitle">
            Design and customize your sacred spaces with our intuitive 3D altar maker
          </p>
        </div>

        <div className="features-section">
          <h2 className="features-title">" What You Can Do ! "</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏠</div>
              <h3>3D Room Design</h3>
              <p>Create and visualize your altar in realistic 3D space. Choose from different room types and customize dimensions.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🧱</div>
              <h3>Wall Customization</h3>
              <p>Design each wall individually with beautiful wallpapers, frames, and decorative elements.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Rich Decoration Library</h3>
              <p>Access hundreds of stickers, frames, and decorative items to personalize your altar design.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <h3>Save & Share</h3>
              <p>Save your designs and create multiple sessions. Download your completed altar designs as images.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Easy Editing</h3>
              <p>Drag, resize, and position elements with ease. Real-time preview of your changes.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Responsive Design</h3>
              <p>Works perfectly on desktop, tablet, and mobile devices for design on the go.</p>
            </div>
          </div>
        </div>

        <div className="altar-showcase">
          <h2 className="altar-showcase-title">See AltarMaker in Action</h2>
          <p className="altar-showcase-subtitle">Explore beautiful altar designs created by our community</p>
          
          <div 
            className="showcase-container"
            onMouseEnter={() => {
              handleMouseEnter();
              setShowControls(true);
            }}
            onMouseLeave={() => {
              handleMouseLeave();
              setShowControls(false);
            }}
          >
            <button 
              className={`nav-arrow left-arrow ${showControls ? 'visible' : ''}`} 
              onClick={goToPrevSlide}
              aria-label="Previous slide"
            >
              ❮
            </button>
            
            {slides.map((slide, index) => (
              <div 
                key={slide.id}
                className={`showcase-slide ${index === currentSlide ? 'active' : ''}`}
              >
                <img 
                  src={slide.image} 
                  alt={slide.alt} 
                  loading={index === currentSlide ? 'eager' : 'lazy'}
                />
                <div className="slide-caption">{slide.title}</div>
              </div>
            ))}
            
            <button 
              className={`nav-arrow right-arrow ${showControls ? 'visible' : ''}`} 
              onClick={goToNextSlide}
              aria-label="Next slide"
            >
              ❯
            </button>
          </div>
          
          <div className={`showcase-dots ${showControls ? 'visible' : ''}`}>
            {slides.map((_, index) => (
              <span 
                key={index}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                onKeyDown={(e) => e.key === 'Enter' && goToSlide(index)}
                role="button"
                tabIndex={0}
                aria-label={`Go to slide ${index + 1}`}
              ></span>
            ))}
          </div>
        </div>

        <div className="how-it-works">
          <h2 className="how-it-works-title">How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Choose Your Space</h3>
              <p>Select room type and set dimensions for your altar space</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Design Walls</h3>
              <p>Add wallpapers, frames, and decorative elements to each wall</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Preview & Save</h3>
              <p>View your design in 3D and save your completed altar</p>
            </div>
          </div>
        </div>
        {/* Feedback Form Section */}
        <div className="feedback-section">
          <div className="feedback-container">
            <h2 className="section-title">Share Your Experience</h2>
            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="form-row">
                <div className="form-group half-width">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={feedback.name}
                    onChange={(e) => setFeedback({...feedback, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group half-width">
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={feedback.email}
                    onChange={(e) => setFeedback({...feedback, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="rating-container">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= feedback.rating ? 'active' : ''}`}
                      onClick={() => setFeedback({...feedback, rating: star})}
                    >
                      ★
                    </span>
                  ))}
                  <span className="rating-text">
                    {feedback.rating > 0 ? `${feedback.rating} Star${feedback.rating > 1 ? 's' : ''}` : 'Rate your experience'}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <textarea
                  placeholder="Your Feedback"
                  value={feedback.message}
                  onChange={(e) => setFeedback({...feedback, message: e.target.value})}
                  required
                  rows="4"
                ></textarea>
              </div>
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <h2 className="section-title">What Our Users Say</h2>
          {feedbackList.length > 0 ? (
            <div className="reviews-carousel">
              <button 
                className="carousel-arrow left"
                onClick={prevReviewPage}
                aria-label="Previous reviews"
              >
                ❮
              </button>
              
              <div className="reviews-slide-container">
                <div 
                  className="reviews-grid"
                  style={{
                    transform: `translateX(-${currentReviewPage * 100}%)`,
                    width: `${totalReviewPages * 100}%`
                  }}
                >
                  {feedbackList.map((item, index) => (
                    <div key={index} className="review-card">
                      <div className="review-content">
                        "{item.message}"
                      </div>
                      <div className="review-author">
                        <div className="author-avatar">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="author-info">
                          <h4>{item.name}</h4>
                          <div className="review-stars">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < item.rating ? 'active' : ''}>★</span>
                            ))}
                          </div>
                          <div className="review-date">
                            {item.date ? new Date(item.date).toLocaleDateString() : 'Just now'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button 
                className="carousel-arrow right"
                onClick={nextReviewPage}
                aria-label="Next reviews"
              >
                ❯
              </button>
              
              {totalReviewPages > 1 && (
                <div className="carousel-dots">
                  {[...Array(totalReviewPages)].map((_, index) => (
                    <button
                      key={index}
                      className={`carousel-dot ${index === currentReviewPage ? 'active' : ''}`}
                      onClick={() => goToReviewPage(index)}
                      aria-label={`Go to review page ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="no-feedback">
              <p>No reviews yet. Be the first to share your experience!</p>
            </div>
          )}
        </div>
        <div className="cta-section">
          <h2>Ready to Create Your Altar?</h2>
          <p>Join thousands of users who have created beautiful sacred spaces</p>
          <button 
            className="get-started-btn" 
            onClick={onLogin}
            style={{
              marginTop: '20px',
              padding: '12px 30px',
              fontSize: '1.2rem'
            }}
          >
            🚀 Get Started
          </button>
        </div>

      </main>
      </div>
    </div>
  );
};

export default Welcome; 