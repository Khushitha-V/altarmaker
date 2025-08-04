import React from "react";
import "./Welcome.css";

const Welcome = ({ onLogin, onRegister }) => {
  return (
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

        <div className="cta-section">
          <h2>Ready to Create Your Altar?</h2>
          <p>Join thousands of users who have created beautiful sacred spaces</p>
        </div>
      </main>
    </div>
  );
};

export default Welcome; 