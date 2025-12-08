import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const AppRedirectPage = () => {
  const [searchParams] = useSearchParams();
  const [showFallback, setShowFallback] = useState(false);

  // Read "tab" from the query params
  const tabParam = searchParams.get('tab') || '';

  // Configure dynamic URLs
  const appDeepLink = `mycarbuddy://?tab=${encodeURIComponent(tabParam)}`;
  const apkDownloadLink = 'https://mycarbuddy.in/assets/apk/MycarbuddyApp.apk';
  
  // Web app link with conditional routing based on tab parameter
  const getWebAppLink = () => {
    if (tabParam === 'ServiceList') {
      return 'https://mycarbuddy.in/profile?tab=mybookings';
    }
    return 'https://mycarbuddy.in';
  };
  
  const webAppLink = getWebAppLink();

  const isMobile = () => {
    return /android|iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
  };

  const openApp = () => {
    if (isMobile()) {
      const start = Date.now();
      window.location.href = appDeepLink;

      setTimeout(() => {
        const end = Date.now();
        if (end - start < 2000) {
          setShowFallback(true);
        }
      }, 1500);
    } else {
      setShowFallback(true);
    }
  };

  const downloadApp = () => {
    window.open(apkDownloadLink, '_blank');
  };

  const openWebApp = () => {
    window.open(webAppLink, '_blank');
  };

  useEffect(() => {
    openApp();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.logoContainer}>
          <img 
            src="/assets/img/MyCarBuddy-Logo1.webp" 
            alt="MyCarBuddy Logo" 
            style={styles.logo}
          />
        </div>
        
        {/* <h1 style={styles.title}>MyCarBuddy</h1> */}
        
        {!showFallback ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <h2 style={styles.subtitle}>Redirecting to My Car Buddy App...</h2>
            <p style={styles.description}>
              Please wait while we redirect you to the My Car Buddy mobile app.
            </p>
          </div>
        ) : (
          <div style={styles.fallbackContainer}>
            <h2 style={styles.subtitle}>Choose Your Option</h2>
            <p style={styles.description}>
              The app didn't open automatically. Please choose one of the options below:
            </p>
            
            <div style={styles.buttonContainer}>
              {isMobile() && (
                <button 
                  className='btn btn-primary btn-lg' 
                  onClick={downloadApp} 
                  style={styles.primaryButton}
                >
                  <i className="fas fa-download" style={styles.buttonIcon}></i>
                  Download App
                </button>
              )}
              
              <button 
                className='btn btn-outline-primary btn-lg' 
                onClick={openWebApp} 
                style={styles.secondaryButton}
              >
                <i className="fas fa-globe" style={styles.buttonIcon}></i>
                Open in Browser
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Inline styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #116d6e 0%,rgb(7, 149, 152) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: '20px',
    boxSizing: 'border-box'
  },
  content: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%',
    position: 'relative',
    overflow: 'hidden'
  },
  logoContainer: {
    marginBottom: '20px'
  },
  logo: {
    height: '80px',
    width: 'auto',
    objectFit: 'contain'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#2c3e50',
    margin: '0 0 30px 0',
    background: 'linear-gradient(135deg, #116d6e 0%,rgb(78, 175, 176) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  loadingContainer: {
    padding: '20px 0'
  },
  fallbackContainer: {
    padding: '20px 0'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 30px auto'
  },
  subtitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 15px 0'
  },
  description: {
    fontSize: '1rem',
    color: '#7f8c8d',
    lineHeight: '1.6',
    margin: '0 0 30px 0'
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    alignItems: 'center'
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #116d6e 0%, rgb(43, 158, 160) 100%)',
    border: 'none',
    borderRadius: '12px',
    padding: '15px 30px',
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '200px',
    justifyContent: 'center',
    boxShadow: '0 4px 15px #116d6e'
  },
  secondaryButton: {
    background: 'transparent',
    border: '2px solid #116d6e',
    borderRadius: '12px',
    padding: '15px 30px',
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#116d6e',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '200px',
    justifyContent: 'center'
  },
  buttonIcon: {
    fontSize: '1.2rem'
  }
};

// Add CSS animation for spinner
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .btn:hover {
    // transform: translateY(-2px);
    box-shadow: 0 6px 6px #116d6e8f !important;
}
  
  .btn-outline-primary:hover {
    background: #116d6e !important;
    color: white !important;
  }
`;
document.head.appendChild(styleSheet);

export default AppRedirectPage;
