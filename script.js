/**
 * Codless Landing Page JavaScript
 * Clean, accessible, and performant interactions
 */

// ============================================================================
// Loading Screen Module
// ============================================================================

const LoadingScreen = {
  init() {
    this.loader = document.getElementById('loader');
    this.mainContent = document.getElementById('main-content');
    
    if (!this.loader || !this.mainContent) {
      console.warn('Loading screen elements not found');
      return;
    }

    // Initialize GSAP animations
    this.setupGSAPAnimations();
    this.startLoadingTimer();
  },

  setupGSAPAnimations() {
    // Animate the shapes during loading
    const shapes = this.loader.querySelectorAll('.hexagon, .circle');
    
    // Create a timeline for the loading animation
    this.loadingTimeline = gsap.timeline({ repeat: -1 });
    
    // Animate shapes with staggered rotation and scaling
    this.loadingTimeline
      .to(shapes, {
        rotation: 360,
        scale: 1.2,
        duration: 2,
        ease: "power2.inOut",
        stagger: 0.2
      })
      .to(shapes, {
        rotation: 0,
        scale: 1,
        duration: 2,
        ease: "power2.inOut",
        stagger: 0.2
      }, "-=1.5");
  },

  startLoadingTimer() {
    // Show loading screen for exactly 3 seconds
    setTimeout(() => {
      this.hideLoader();
    }, 3000);
  },

  hideLoader() {
    // Create timeline for hiding loader
    const hideTimeline = gsap.timeline();
    
    // Fade out the loader with GSAP
    hideTimeline
      .to(this.loader, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut"
      })
      .call(() => {
      this.loader.style.display = 'none';
      this.showMainContent();
      });
  },

  showMainContent() {
    // Show main content with GSAP fade in
    this.mainContent.style.display = 'block';
    
    // Show navbar
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.style.display = 'flex';
    }
    
    // Trigger reflow
    this.mainContent.offsetHeight;
    
    // Ensure body overflow is properly set for Lenis
    document.body.style.overflow = 'hidden';
    
    // Add loaded class for smooth animation
    this.mainContent.classList.add('loaded');
    
    // Animate main content entrance
    gsap.fromTo(this.mainContent, 
      { opacity: 0, y: 30 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.8, 
        ease: "power2.out",
        onComplete: () => {
          // Step 1: Remove overflow hidden from body
          document.body.style.overflow = '';
          
          // Step 2: Wait for hero video to load before initializing scroll system
          const heroVideo = document.querySelector('.hero-bg-video');
          let scrollSystemInitialized = false;

          const initScrollSystem = () => {
            if (scrollSystemInitialized) return;
            scrollSystemInitialized = true;
            // Step 3: Initialize Lenis smooth scrolling
            LenisSmoothScrolling.init();
            // Step 4: Initialize all ScrollTrigger instances
            this.initializeScrollTriggers();
            console.log('✅ Scroll system initialized after hero video loaded');
          };

          if (heroVideo) {
            if (heroVideo.readyState >= 2) {
              // Video is already loaded
              initScrollSystem();
            } else {
              // Wait for video to load
              heroVideo.addEventListener('loadedmetadata', () => {
                initScrollSystem();
              }, { once: true });
            }
          } else {
            // No hero video, just initialize
            initScrollSystem();
          }
        }
      }
    );
  },

  initializeScrollTriggers() {
    // Initialize all ScrollTrigger instances after Lenis is ready
    // This ensures they use the proxy-driven scrolling system
    if (typeof ScrollTrigger !== 'undefined') {
      // Wait a bit for Lenis to be fully ready
      setTimeout(() => {
        ScrollTrigger.refresh();
        console.log('🔄 ScrollTrigger refreshed with Lenis proxy');
      }, 100);
    }
  }
};

// ============================================================================
// Utility Functions
// ============================================================================


/**
 * Check if user prefers reduced motion
 * @returns {boolean} True if user prefers reduced motion
 */
const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Safely query DOM elements
 * @param {string} selector - CSS selector
 * @returns {Element|null} DOM element or null
 */
const safeQuerySelector = (selector) => {
  try {
    return document.querySelector(selector);
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error);
    return null;
  }
};

/**
 * Safely query all DOM elements
 * @param {string} selector - CSS selector
 * @returns {NodeList} NodeList of elements
 */
const safeQuerySelectorAll = (selector) => {
  try {
    return document.querySelectorAll(selector);
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error);
    return [];
  }
};

// ============================================================================
// Lenis Smooth Scrolling Module
// ============================================================================

const LenisSmoothScrolling = {
  lenis: null,
  
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupLenis());
    } else {
      this.setupLenis();
    }
  },

  setupLenis() {
    // Check if Lenis is available
    if (typeof Lenis === 'undefined') {
      console.warn('⚠️ Lenis not loaded, falling back to native scrolling');
      return;
    }

    try {
      // Step 1: Disable browser's native scroll restoration to prevent conflicts
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
        console.log('🔒 Disabled browser scroll restoration');
      }

      // Initialize Lenis with smooth scrolling
      this.lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth easing
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false, // Disable on touch devices for better UX
        touchMultiplier: 2,
        infinite: false,
      });

      // Step 2: Force immediate scroll to 0 to prevent any programmatic scroll on load
      this.lenis.scrollTo(0, { immediate: true });
      console.log('📍 Forced immediate scroll to 0');

      // Connect Lenis to GSAP ScrollTrigger
      this.lenis.on('scroll', ScrollTrigger.update);

      // Tell ScrollTrigger to use these proxy methods for the document.body element
      ScrollTrigger.scrollerProxy(document.body, {
        scrollTop(value) {
          if (arguments.length) {
            LenisSmoothScrolling.lenis.scrollTo(value, { immediate: true });
          }
          return LenisSmoothScrolling.lenis.scroll;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight
          };
        },
        pinType: document.body.style.transform ? "transform" : "fixed"
      });

      // Start the Lenis animation loop
      this.raf = (time) => {
        this.lenis.raf(time);
        requestAnimationFrame(this.raf);
      };
      requestAnimationFrame(this.raf);

      console.log('🎉 Lenis smooth scrolling initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Lenis:', error);
      // Fallback to native scrolling
      this.lenis = null;
    }

    // Clean up function
    this.cleanup = () => {
      if (this.lenis) {
        this.lenis.destroy();
      }
      if (this.raf) {
        cancelAnimationFrame(this.raf);
      }
    };
  },
};

// ============================================================================
// Navigation Module
// ============================================================================

const Navigation = {
  init() {
    this.navbar = safeQuerySelector('.navbar');
    this.hamburger = safeQuerySelector('.hamburger');
    this.navbarTabs = safeQuerySelectorAll('.navbar-tab');
    
    if (!this.navbar) {
      console.warn('Navigation element not found');
      return;
    }

    // Hide navbar during loading
    this.navbar.style.display = 'none';

    if (this.hamburger) {
      this.setupEventListeners();
    }
    this.setupKeyboardNavigation();
  },

  setupEventListeners() {
    // Hamburger menu toggle
    this.hamburger.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleToggleMobileMenu();
    });

    // Close mobile menu when clicking on nav links
    this.navbarTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.handleCloseMobileMenu();
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.navbar.contains(e.target) && this.hamburger.classList.contains('active')) {
        this.handleCloseMobileMenu();
      }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleCloseMobileMenu();
        this.hamburger.focus();
      }
    });
  },
  
  setupKeyboardNavigation() {
    // Handle keyboard navigation for nav links
    this.navbarTabs.forEach((tab, index) => {
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = (index + 1) % this.navbarTabs.length;
          this.navbarTabs[nextIndex].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = (index - 1 + this.navbarTabs.length) % this.navbarTabs.length;
          this.navbarTabs[prevIndex].focus();
        }
      });
    });
  },

  handleToggleMobileMenu() {
    const isActive = this.hamburger.classList.contains('active');
    
    if (isActive) {
      this.handleCloseMobileMenu();
    } else {
      this.handleOpenMobileMenu();
    }
  },

  handleOpenMobileMenu() {
    const navbarList = this.navbar.querySelector('.navbar-list');
    this.hamburger.classList.add('active');
    this.hamburger.setAttribute('aria-expanded', 'true');
    
    if (navbarList) {
      navbarList.classList.add('active');
    }
    
    // Focus first nav item for accessibility
    const firstNavItem = this.navbarTabs[0];
    if (firstNavItem) {
      firstNavItem.focus();
    }
  },

  handleCloseMobileMenu() {
    const navbarList = this.navbar.querySelector('.navbar-list');
    this.hamburger.classList.remove('active');
    this.hamburger.setAttribute('aria-expanded', 'false');
    
    if (navbarList) {
      navbarList.classList.remove('active');
    }
  }
};

// ============================================================================
// Form Handling Module
// ============================================================================

const FormHandling = {
  init() {
    this.setupNewsletterForm();
    this.setupContactButtons();
  },

  setupNewsletterForm() {
    const newsletterForm = safeQuerySelector('.newsletter-form');
    
    if (!newsletterForm) return;

    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleNewsletterSubmission(newsletterForm);
    });
  },

  setupContactButtons() {
    const contactButtons = safeQuerySelectorAll('.cta-button');
    
    contactButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleContactClick();
      });
    });
  },

  handleNewsletterSubmission(form) {
    const emailInput = form.querySelector('input[type="email"]');
    const errorElement = document.getElementById('newsletter-error');
    const email = emailInput?.value;
    
    // Clear previous errors
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.className = 'sr-only';
    }
    
    if (!email) {
      this.showFormError('Please enter an email address.', emailInput, errorElement);
      return;
    }
    
    if (!this.isValidEmail(email)) {
      this.showFormError('Please enter a valid email address.', emailInput, errorElement);
      return;
    }

    // Simulate API call
    this.showMessage('Thank you for subscribing!', 'success');
    form.reset();
    
    // Clear any error states
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.className = 'sr-only';
    }
  },

  showFormError(message, input, errorElement) {
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.className = 'form-error';
      errorElement.setAttribute('role', 'alert');
    }
    
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      input.focus();
    }
    
    this.showMessage(message, 'error');
  },

  handleContactClick() {
    // In a real implementation, this would open a contact form or calendar
    this.showMessage('Contact form would open here. Integration with calendly or contact form needed.', 'info');
  },

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  showMessage(message, type = 'info') {
    // Create and show a notification
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    
    // Add styles
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '1rem 1.5rem',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      zIndex: '10000',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
      backgroundColor: type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }
};

// ============================================================================
// FAQ Module
// ============================================================================

const FAQ = {
  init() {
    this.setupFAQAccordion();
  },

  setupFAQAccordion() {
    const faqQuestions = safeQuerySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
      question.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleToggleFAQ(question);
      });
      
      // Add keyboard support
      question.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleToggleFAQ(question);
        }
      });
    });
  },

  handleToggleFAQ(question) {
    const isExpanded = question.getAttribute('aria-expanded') === 'true';
    
    // Close all other FAQ items
    const allQuestions = safeQuerySelectorAll('.faq-question');
    allQuestions.forEach(q => {
      if (q !== question) {
        this.handleCloseFAQ(q);
      }
    });
    
    // Toggle current FAQ
    if (isExpanded) {
      this.handleCloseFAQ(question);
    } else {
      this.handleOpenFAQ(question);
    }
  },

  handleOpenFAQ(question) {
    const answer = document.getElementById(question.getAttribute('aria-controls'));
    const icon = question.querySelector('.faq-icon');
    
    question.setAttribute('aria-expanded', 'true');
    answer.setAttribute('aria-hidden', 'false');
    
    // Use GSAP for smooth accordion animation
    gsap.set(answer, { display: 'block', height: 0, opacity: 0 });
    gsap.to(answer, {
      height: 'auto',
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    });
    
    // Animate icon rotation with GSAP
    if (icon) {
      gsap.to(icon, {
        rotation: 45,
        duration: 0.3,
        ease: "power2.out"
      });
    }
    
    // Announce to screen readers
    this.announceToScreenReader(`FAQ expanded: ${question.querySelector('span').textContent}`);
  },

  handleCloseFAQ(question) {
    const answer = document.getElementById(question.getAttribute('aria-controls'));
    const icon = question.querySelector('.faq-icon');
    
    question.setAttribute('aria-expanded', 'false');
    answer.setAttribute('aria-hidden', 'true');
    
    // Use GSAP for smooth accordion animation
    gsap.to(answer, {
      height: 0,
      opacity: 0,
      duration: 0.4,
      ease: "power2.out",
      onComplete: () => {
        gsap.set(answer, { display: 'none' });
      }
    });
    
    // Reset icon rotation with GSAP
    if (icon) {
      gsap.to(icon, {
        rotation: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  },

  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      if (announcement.parentNode) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }
};

// ============================================================================
// Performance & Loading Module
// ============================================================================

const Performance = {
  init() {
    this.setupLazyLoading();
    this.optimizeImages();
  },

  setupLazyLoading() {
    const images = safeQuerySelectorAll('img[loading="lazy"]');
    
    if ('loading' in HTMLImageElement.prototype) {
      // Native lazy loading is supported
      return;
    }
    
    // Fallback for browsers without native lazy loading
    this.implementLazyLoading(images);
  },

  implementLazyLoading(images) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => {
      imageObserver.observe(img);
    });
  },

  optimizeImages() {
    const images = safeQuerySelectorAll('img');
    
    images.forEach(img => {
      // Add error handling for failed image loads
      img.addEventListener('error', () => {
        console.warn(`Failed to load image: ${img.src}`);
        img.style.display = 'none';
      });
      
      // Add load event for analytics/debugging
      img.addEventListener('load', () => {
        img.classList.add('loaded');
      });
    });
  }
};

// ============================================================================
// Accessibility Module
// ============================================================================

const Accessibility = {
  init() {
    this.setupFocusManagement();
    this.setupReducedMotion();
  },

  setupFocusManagement() {
    // Ensure focus is visible
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('using-keyboard');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('using-keyboard');
    });
  },

  setupReducedMotion() {
    if (prefersReducedMotion()) {
      document.body.classList.add('reduced-motion');
    }
  }
};

// ============================================================================
// Section Animations Module
// ============================================================================

const SectionAnimations = {
  init() {
    this.setupSectionAnimations();
  },

  setupSectionAnimations() {
    // Target all sections with animation classes
    const animatedSections = safeQuerySelectorAll(
      '.section-animate, .section-animate-left, .section-animate-right, .section-animate-scale, .section-animate-fade, .section-animate-stagger'
    );

    if (!animatedSections.length) {
      console.log('No animated sections found');
      return;
    }

    // Use ScrollTrigger.batch for performant, once-only appear-in animations
    ScrollTrigger.batch(animatedSections, {
      once: true,
      start: 'top 85%',
      onEnter: batch => {
        batch.forEach(section => {
          this.handleSectionAnimation(section);
        });
      },
      // Defensive: also animate if element re-enters (shouldn't happen with once: true)
      onEnterBack: batch => {
        batch.forEach(section => {
          this.handleSectionAnimation(section);
        });
      }
    });
  },

  handleSectionAnimation(section) {
    // Determine animation type based on class
    const animationType = this.getAnimationType(section);
    // Apply GSAP animation based on type
    this.applyGSAPAnimation(section, animationType);
    // Announce to screen readers if section has important content
    this.announceSectionToScreenReader(section);
  },

  getAnimationType(section) {
    if (section.classList.contains('section-animate-stagger')) return 'stagger';
    if (section.classList.contains('section-animate-left')) return 'left';
    if (section.classList.contains('section-animate-right')) return 'right';
    if (section.classList.contains('section-animate-scale')) return 'scale';
    if (section.classList.contains('section-animate-fade')) return 'fade';
    return 'default';
  },

  applyGSAPAnimation(section, type) {
    const elements = type === 'stagger' ? section.children : [section];
    switch (type) {
      case 'stagger':
        gsap.fromTo(elements, 
          { opacity: 0, y: 40 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.6, 
            ease: "power2.out",
            stagger: 0.1
          }
        );
        break;
      case 'left':
        gsap.fromTo(section, 
          { opacity: 0, x: -60 },
          { 
            opacity: 1, 
            x: 0, 
            duration: 0.8, 
            ease: "power2.out" 
          }
        );
        break;
      case 'right':
        gsap.fromTo(section, 
          { opacity: 0, x: 60 },
          { 
            opacity: 1, 
            x: 0, 
            duration: 0.8, 
            ease: "power2.out" 
          }
        );
        break;
      case 'scale':
        gsap.fromTo(section, 
          { opacity: 0, scale: 0.9 },
          { 
            opacity: 1, 
            scale: 1, 
            duration: 0.8, 
            ease: "power2.out" 
          }
        );
        break;
      case 'fade':
        gsap.fromTo(section, 
          { opacity: 0 },
          { 
            opacity: 1, 
            duration: 0.6, 
            ease: "power2.out" 
          }
        );
        break;
      default:
        gsap.fromTo(section, 
          { opacity: 0, y: 60 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.8, 
            ease: "power2.out" 
          }
        );
        break;
    }
  },

  announceSectionToScreenReader(section) {
    const sectionTitle = section.querySelector('h1, h2, h3');
    if (sectionTitle) {
      const title = sectionTitle.textContent.trim();
      this.announceToScreenReader(`Section entered: ${title}`);
    }
  },

  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => {
      if (announcement.parentNode) {
        document.body.removeChild(announcement);
      }
    }, 2000);
  },

  // Cleanup method
  cleanup() {
    // No need to disconnect batch triggers
  }
};

// ============================================================================
// Tools Section Animation Module
// ============================================================================

const ToolsAnimation = {
  init() {
    this.setupToolsAnimation();
  },

  setupToolsAnimation() {
    const toolMoons = safeQuerySelectorAll('.tool-moon');
    const toolsOrbit = safeQuerySelector('.tools-orbit');
    
    if (!toolMoons.length || !toolsOrbit) {
      console.log('Tools section elements not found');
      return;
    }

    // Keep the CSS animation for orbit motion (it was working)
    // Just enhance it with GSAP for hover effects

    // Enhanced hover animations
    toolMoons.forEach((moon) => {
      const icon = moon.querySelector('.tool-icon');
      const label = moon.querySelector('.tool-label');
      
      // Initial state
      gsap.set(label, { opacity: 0, scale: 0.8, y: 10 });
      
      moon.addEventListener('mouseenter', () => {
        // Pause the CSS animation on hover
        moon.style.animationPlayState = 'paused';
        
        gsap.to(icon, {
          scale: 1.3,
          rotation: 360,
          duration: 0.4,
          ease: "back.out(1.7)"
        });
        
        gsap.to(label, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.4,
          ease: "back.out(1.7)"
        });

        // Add glow effect
        gsap.to(moon, {
          filter: "brightness(1.2) drop-shadow(0 0 10px rgba(222, 107, 72, 0.5))",
          duration: 0.3,
          ease: "power2.out"
        });
      });
      
      moon.addEventListener('mouseleave', () => {
        // Resume the CSS animation
        moon.style.animationPlayState = 'running';
        
        gsap.to(icon, {
          scale: 1,
          rotation: 0,
          duration: 0.4,
          ease: "power2.out"
        });
        
        gsap.to(label, {
          opacity: 0,
          scale: 0.8,
          y: 10,
          duration: 0.4,
          ease: "power2.out"
        });

        // Remove glow effect
        gsap.to(moon, {
          filter: "brightness(1) drop-shadow(none)",
          duration: 0.3,
          ease: "power2.out"
        });
      });
    });
  }
};

// ============================================================================
// Error Handling & Analytics
// ============================================================================

const ErrorHandling = {
  init() {
    this.setupGlobalErrorHandling();
  },

  setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      // In production, send to error tracking service
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      // In production, send to error tracking service
    });
  }
};

// ============================================================================
// Scroll CTA Module
// ============================================================================

const ScrollCTA = {
  init() {
    this.setupScrollCTA();
  },

  setupScrollCTA() {
    const scrollCTA = document.getElementById('scroll-cta');
    if (!scrollCTA) return;

    const handleScroll = (e) => {
      // Handle both click and keyboard events
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      
      if (typeof LenisSmoothScrolling !== 'undefined' && LenisSmoothScrolling.lenis) {
        // If Lenis is available, use it for smooth scrolling
        LenisSmoothScrolling.lenis.scrollTo(window.innerHeight, {
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
      } else {
        // Fallback to native smooth scrolling
        window.scrollTo({
          top: window.innerHeight,
          behavior: prefersReducedMotion() ? 'auto' : 'smooth'
        });
      }
    };

    // Add both click and keyboard event listeners
    scrollCTA.addEventListener('click', handleScroll);
    scrollCTA.addEventListener('keydown', handleScroll);
  }
};


// ============================================================================
// Horizontal Scroll Module (FIXED)
// ============================================================================

const HorizontalScroll = {
  init() {
    // We must register the plugin to use it
    gsap.registerPlugin(ScrollTrigger);

    const container = document.querySelector(".horizontal-container");
    const wrapper = document.querySelector(".horizontal-wrapper");
    const horizontalSections = gsap.utils.toArray(".horizontal-card");

    if (!container || !wrapper || !horizontalSections.length) {
      console.warn("Horizontal scroll elements not found. Skipping initialization.");
      return;
    }

    // Main horizontal scroll tween
    const horizontalTween = gsap.to(wrapper, {
      x: () => `-${wrapper.scrollWidth - window.innerWidth}px`,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        pin: true,
        scrub: 1, // Smoothly scrubs the animation
        start: "top top",
        end: () => `+=${wrapper.scrollWidth - window.innerWidth}`,
        invalidateOnRefresh: true, // Recalculates values on window resize
        pinType: "transform",
      },
    });

    // Animate each card as it comes into view within the horizontal scroll
    horizontalSections.forEach(section => {
      gsap.from(section.querySelector('.step-container'), {
        y: 100,
        opacity: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          containerAnimation: horizontalTween, // Link to the main horizontal tween
          start: 'left 80%', // Start when the left of the card is 80% from the left of the viewport
          end: 'left 50%', // End when the left of the card is at the center
          scrub: true,
        },
      });
    });

    console.log("✅ Horizontal scroll initialized successfully.");
  }
};
// ============================================================================
// Main Application Initialization
// ============================================================================

class CodlessApp {
  constructor() {
    // REMOVED HorizontalScroll from here to initialize it later
    this.modules = [
      LoadingScreen,
      Navigation,
      FormHandling,
      FAQ,
      Performance,
      Accessibility,
      ErrorHandling,
      SectionAnimations,
      ToolsAnimation,
      CustomCursor,
      HeaderAnimations,
      TextAnimations,
      LenisSmoothScrolling,
      ScrollCTA
    ];
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeModules());
    } else {
      this.initializeModules();
    }
  }

  initializeModules() {
    this.modules.forEach(module => {
      try {
        if (module.init) {
            module.init();
        }
      } catch (error) {
        console.error(`Failed to initialize module:`, error);
      }
    });

    this.setupCleanup();
  }

  setupCleanup() {
    // Clean up when page is unloaded
    window.addEventListener('beforeunload', () => {
    
      // Clean up section animation observer
      if (SectionAnimations.cleanup) {
        SectionAnimations.cleanup();
      }

      // Clean up Lenis smooth scrolling
      if (LenisSmoothScrolling.cleanup) {
        LenisSmoothScrolling.cleanup();
      }
    });
  }
}

// ============================================================================
// Header Animations Module
// ============================================================================

const HeaderAnimations = {
  init() {
    this.setupScrollEffect();
    this.setupNavbarContrast();
    this.setupSpotlightAnimation();
    this.setupCTAGlitchAnimation();
  },

  splitHeaderForScroll(header) {
  if (!header.dataset.original) {
    header.dataset.original = header.textContent;
  }
  const original = header.dataset.original;
  header.innerHTML = '';
  
  // Trim leading and trailing spaces to prevent weird spacing
  const trimmedOriginal = original.trim();
  
  for (let i = 0; i < trimmedOriginal.length; i++) {
    const char = trimmedOriginal[i];
    
    if (char === ' ') {
      // Create a proper space span with consistent width
      const spaceSpan = document.createElement('span');
      spaceSpan.className = 'scroll-space';
      spaceSpan.innerHTML = ' '; // Use non-breaking space for consistent width
      header.appendChild(spaceSpan);
    } else {
      const span = document.createElement('span');
      span.textContent = char;
      span.setAttribute('data-char', char);
      span.classList.add('scroll-letter');
      span.style.transform = 'translateY(0)';
      header.appendChild(span);
    }
  }
  },
  
  animateHeroTitle(header) {
  const spans = Array.from(header.querySelectorAll('.scroll-letter'));
    
    // Create a beautiful multi-layered animation
    const tl = gsap.timeline();
    
    // Set initial state
    gsap.set(spans, {
      y: 80,
      opacity: 0,
      scale: 0.3,
      rotation: 25,
      color: 'var(--color-neutral-light)',
      filter: 'blur(4px)'
    });
    
    // Main reveal animation
    tl.to(spans, {
      y: 0,
      opacity: 1,
      scale: 1,
      rotation: 0,
      color: 'var(--color-primary)',
      filter: 'blur(0px)',
      duration: 1.2,
      ease: "elastic.out(1, 0.5)",
      stagger: {
        amount: 0.8,
        from: "random"
      }
    })
    .to(spans, {
      y: -5,
      scale: 1.05,
      duration: 0.4,
      ease: "power2.out",
      stagger: 0.02
    }, "-=0.6")
    .to(spans, {
      y: 0,
      scale: 1,
      duration: 0.4,
      ease: "power2.inOut"
    }, "-=0.2");

    // Mouse-following color radius effect
    let isHovering = false;
    let spotlightRadius = 80; // Radius of the color change area

  header.addEventListener('mouseenter', () => {
      isHovering = true;
      
      // Gentle scale effect on the entire header
      gsap.to(header, {
        scale: 1.02,
        duration: 0.6,
        ease: "power2.out"
      });
    });

    header.addEventListener('mouseleave', () => {
      isHovering = false;
      
      // Return all letters to primary color
      gsap.to(spans, {
        color: 'var(--color-primary)',
        duration: 0.8,
        ease: "power2.out"
      });

      // Return header scale
      gsap.to(header, {
        scale: 1,
        duration: 0.8,
        ease: "power2.out"
      });
    });

    // Mouse move handler for spotlight effect
    header.addEventListener('mousemove', (e) => {
      if (!isHovering) return;

      const rect = header.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Update each letter's color based on distance from mouse
      spans.forEach((span) => {
        const spanRect = span.getBoundingClientRect();
        const spanX = spanRect.left - rect.left + spanRect.width / 2;
        const spanY = spanRect.top - rect.top + spanRect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(mouseX - spanX, 2) + Math.pow(mouseY - spanY, 2)
        );

        // Calculate color intensity based on distance
        const intensity = Math.max(0, 1 - (distance / spotlightRadius));
        
        if (intensity > 0.1) {
          // Interpolate between primary and secondary color
          const secondaryColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-secondary').trim();
          
          // Create smooth color transition
          gsap.to(span, {
            color: secondaryColor,
            duration: 0.3,
            ease: "power2.out"
          });
        } else {
          // Return to primary color
          gsap.to(span, {
            color: 'var(--color-primary)',
            duration: 0.3,
            ease: "power2.out"
          });
        }
      });
    });

    // Water ripple effect on click
    header.addEventListener('click', (e) => {
      const rect = header.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Create ripple effect
      spans.forEach((span) => {
        const spanRect = span.getBoundingClientRect();
        const spanX = spanRect.left - rect.left + spanRect.width / 2;
        const spanY = spanRect.top - rect.top + spanRect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(clickX - spanX, 2) + Math.pow(clickY - spanY, 2)
        );
        
        // Calculate delay based on distance (ripple spreads outward)
        const delay = distance * 0.002; // 2ms per pixel
        const duration = 0.8;
        
        // Create wave effect with multiple properties
        gsap.timeline()
          .to(span, {
            y: -8,
            scale: 1.1,
            color: 'var(--color-secondary)',
            duration: duration * 0.4,
            delay: delay,
            ease: "power2.out"
          })
          .to(span, {
            y: 0,
            scale: 1,
            color: 'var(--color-primary)',
            duration: duration * 0.6,
            ease: "power2.inOut"
          }, delay + duration * 0.4);
      });
    });
  },

  setupScrollEffect() {
  // Target all headers with .section-animate-header
    const headers = safeQuerySelectorAll('.section-animate-header');
  headers.forEach(header => {
      const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
            this.splitHeaderForScroll(entry.target);
            this.animateHeroTitle(entry.target);
        }
      });
    }, { threshold: 0.5 });
    observer.observe(header);
  });
  },

  setupSpotlightAnimation() {
    const heroIntro = safeQuerySelector('.hero-intro');
    if (!heroIntro) return;

    const textReveal = heroIntro.querySelector('.text-reveal');
    if (!textReveal) return;

    // Wait for GSAP to be available
    const waitForGSAP = () => {
      if (typeof gsap !== 'undefined') {
        this.createSleekTextReveal(textReveal);
      } else {
        setTimeout(waitForGSAP, 100);
      }
    };
    waitForGSAP();
  },

  createSleekTextReveal(textReveal) {
    // Set initial state
    gsap.set(textReveal, {
      opacity: 1,
      backgroundPosition: '100% 0'
    });

    // Create simple continuous sweep animation
    gsap.to(textReveal, {
      backgroundPosition: '-100% 0',
      duration: 3,
      ease: "none",
      repeat: -1
    });
  },

  setupCTAGlitchAnimation() {
    const ctaText = safeQuerySelector('.cta-container .text');
    if (!ctaText) return;

    const mainText = ctaText.querySelector('.cta-text-main');
    const morphText = ctaText.querySelector('.cta-text-morph');
    
    if (!mainText || !morphText) return;

    // Wait for GSAP to be available
    const waitForGSAP = () => {
      if (typeof gsap !== 'undefined') {
        this.createCTAMorphEffect(mainText, morphText);
      } else {
        setTimeout(waitForGSAP, 100);
      }
    };
    waitForGSAP();
  },

  createCTAMorphEffect(mainText, morphText) {
    // Set initial states
    gsap.set(mainText, { opacity: 1 });
    gsap.set(morphText, { 
      opacity: 0,
      y: 20,
      scale: 0.8,
      backgroundPosition: "0% 50%"
    });

    // Create the morph timeline
    const morphTL = gsap.timeline({
      repeat: -1,
      repeatDelay: 3
    });

    // Phase 1: Morph in with gradient sweep
    morphTL.to(mainText, {
      opacity: 0,
      y: -10,
      scale: 0.9,
      duration: 0.4,
      ease: "power2.inOut"
    })
    .to(morphText, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.4")
    .to(morphText, {
      backgroundPosition: "100% 50%",
      duration: 0.6,
      ease: "power2.inOut"
    }, "-=0.2");

    // Phase 2: Stable display with subtle animation
    morphTL.to(morphText, {
      y: -2,
      duration: 0.5,
      ease: "power1.inOut",
      yoyo: true,
      repeat: 1
    })
    .to(morphText, {
      duration: 0.5,
      ease: "none"
    });

    // Phase 3: Morph back to original
    morphTL.to(morphText, {
      backgroundPosition: "0% 50%",
      duration: 0.4,
      ease: "power2.inOut"
    })
    .to(morphText, {
      opacity: 0,
      y: -20,
      scale: 0.8,
      duration: 0.4,
      ease: "power2.in"
    })
    .to(mainText, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.4");

    // Start the animation after a delay
    setTimeout(() => {
      morphTL.play();
    }, 3000);
  },

  setupNavbarContrast() {
    const navbar = safeQuerySelector('.navbar');
    const darkSections = safeQuerySelectorAll('.dark-bg');

  if (!navbar || !darkSections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      let isOverDark = false;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isOverDark = true;
        }
      });
      if (isOverDark) {
        navbar.classList.add('navbar-contrast');
      } else {
        navbar.classList.remove('navbar-contrast');
      }
    },
    {
      root: null,
      threshold: 0.1
    }
  );

  darkSections.forEach(section => observer.observe(section));
  }
};

// ============================================================================
// Text Animations Module
// ============================================================================

const TextAnimations = {
  init() {
    this.setupTypewriterOnView();
    this.setupMoveInSection();
  },

    setupTypewriterOnView() {
    const typewriterParas = safeQuerySelectorAll('.typewriter-text-inner');
    
    typewriterParas.forEach((typewriterPara) => {
      const originalHTML = typewriterPara.innerHTML;
  let hasAnimated = false;

      // Hide the element initially to prevent flash
      gsap.set(typewriterPara, { autoAlpha: 0 });

      const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAnimated) {
            hasAnimated = true;
            
            // Show the element and take control
            gsap.set(typewriterPara, { autoAlpha: 1 });
            
            // Create a temporary container to parse the original HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = originalHTML;
            
            // Function to split text using "words, chars" approach for proper spacing
            const splitTextWithWordsAndChars = (element) => {
              const walkDOM = (node) => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                  const text = node.textContent;
                  const words = text.split(/(\s+)/); // Split by whitespace but keep spaces
                  
                  // Replace text node with word containers
                  const fragment = document.createDocumentFragment();
                  words.forEach((word) => {
                    if (word.trim()) {
                      // Create word container
                      const wordContainer = document.createElement('span');
                      wordContainer.className = 'typewriter-word';
                      wordContainer.style.cssText = `
                        display: inline-block;
                        margin-right: 0.2em;
                      `;
                      
                      // Split word into characters
                      const chars = word.split('');
                      chars.forEach((char) => {
                        const charSpan = document.createElement('span');
                        charSpan.textContent = char;
                        charSpan.className = 'typewriter-char';
                        charSpan.style.cssText = `
                          opacity: 0;
                          transform: translateY(10px) scale(0.9);
                          display: inline-block;
                        `;
                        wordContainer.appendChild(charSpan);
                      });
                      
                      fragment.appendChild(wordContainer);
                    } else if (word) {
                      // Handle spaces - create space container
                      const spaceContainer = document.createElement('span');
                      spaceContainer.className = 'typewriter-space';
                      spaceContainer.innerHTML = ' ';
                      spaceContainer.style.cssText = `
                        display: inline-block;
                        opacity: 0;
                        transform: translateY(10px) scale(0.9);
                      `;
                      fragment.appendChild(spaceContainer);
                    }
                  });
                  
                  node.parentNode.replaceChild(fragment, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
                  // Recursively process child nodes
                  Array.from(node.childNodes).forEach(walkDOM);
                }
              };
              
              Array.from(element.childNodes).forEach(walkDOM);
            };
            
            // Split the text using the improved approach
            splitTextWithWordsAndChars(tempDiv);
            
            // Replace the original content with the split version
            typewriterPara.innerHTML = tempDiv.innerHTML;
            
            // Get all character spans and space spans
            const charSpans = typewriterPara.querySelectorAll('.typewriter-char');
            const spaceSpans = typewriterPara.querySelectorAll('.typewriter-space');
            const allSpans = [...charSpans, ...spaceSpans];
            let currentIndex = 0;
            
            // Create cursor element
            const cursor = document.createElement('span');
            cursor.className = 'typewriter-cursor';
            cursor.innerHTML = '|';
            cursor.style.cssText = `
              font-weight: bold;
              animation: blink-cursor 1s infinite;
              margin-left: 2px;
              opacity: 1;
              position: relative;
            `;
            
            // Position cursor at the beginning
            if (allSpans.length > 0) {
              allSpans[0].parentNode.insertBefore(cursor, allSpans[0]);
        } else {
              typewriterPara.appendChild(cursor);
            }

            const typeNextSpan = () => {
              if (currentIndex < allSpans.length) {
                const span = allSpans[currentIndex];
                const isSpace = span.classList.contains('typewriter-space');
                
                // Animate span appearance with GSAP
                gsap.to(span, {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  duration: 0.08 + Math.random() * 0.05,
                  ease: "power2.out",
                  onComplete: () => {
                    // Move cursor to the next position
                    if (currentIndex < allSpans.length - 1) {
                      const nextSpan = allSpans[currentIndex + 1];
                      
                      // Insert cursor before the next span
                      if (nextSpan.parentNode) {
                        nextSpan.parentNode.insertBefore(cursor, nextSpan);
                      }
                    }
                  }
                });

                currentIndex++;
                
                // Faster typing speed with minimal variation
                let nextDelay;
                if (isSpace) {
                  nextDelay = 30 + Math.random() * 20;
                } else {
                  const char = span.textContent;
                  if (char === '.' || char === '!' || char === '?' || char === ',') {
                    nextDelay = 60 + Math.random() * 40;
                  } else {
                    nextDelay = 15 + Math.random() * 15;
                  }
                }
                
                setTimeout(typeNextSpan, nextDelay);
              } else {
                // Animation complete - remove cursor
                gsap.to(cursor, {
                  opacity: 0,
                  duration: 0.2,
                  onComplete: () => {
                    cursor.remove();
                  }
                });
              }
            };
            
            // Start typing animation
            setTimeout(typeNextSpan, 200);
            
        observer.unobserve(typewriterPara);
      }
    });
  }, { threshold: 0.4 });
  observer.observe(typewriterPara);
});
  },

  setupMoveInSection() {
    const moveInSection = safeQuerySelector('.move-in-section');
  if (!moveInSection) return;
    
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
          // Use GSAP for move-in animation
          gsap.fromTo(moveInSection, 
            { 
              x: -100, 
              opacity: 0,
              scale: 0.95
            },
            { 
              x: 0, 
              opacity: 1, 
              scale: 1,
              duration: 1.2,
              ease: "power2.out"
            }
          );
          
        observer.unobserve(moveInSection);
      }
    });
  }, { threshold: 0.3 });
  observer.observe(moveInSection);
  }
};

// ============================================================================
// Custom Cursor and Interactions Module
// ============================================================================

const CustomCursor = {
  init() {
    this.cursor = safeQuerySelector('#custom-cursor');
    this.particlesContainer = safeQuerySelector('#cursor-particles');
    
    if (!this.cursor || !this.particlesContainer) {
      console.warn('Cursor elements not found');
      return;
    }

    this.isInitialized = false;
    this.setupCursorEvents();
  },

  setupCursorEvents() {
    // Mouse movement
    document.addEventListener('mousemove', (e) => this.handleMoveCursor(e));
    
    // Mouse enter/leave window
document.addEventListener('mouseleave', () => {
      gsap.to(this.cursor, { opacity: 0, duration: 0.2 });
});

document.addEventListener('mouseenter', () => {
      if (this.isInitialized) {
        gsap.to(this.cursor, { opacity: 1, duration: 0.2 });
      }
    });
  },

  handleMoveCursor(e) {
    const x = e.clientX;
    const y = e.clientY;
    
    // Initialize cursor position on first movement
    if (!this.isInitialized) {
      gsap.set(this.cursor, {
        x: x - 4, // Adjust for cursor size
        y: y - 4, // Adjust for cursor size
        opacity: 1
      });
      this.isInitialized = true;
      
      // Start cursor pulse animation
      gsap.to(this.cursor, {
        scale: 1.18,
        duration: 0.6,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });
    } else {
      // Use GSAP for smooth cursor movement
      gsap.to(this.cursor, {
        x: x - 4, // Adjust for cursor size
        y: y - 4, // Adjust for cursor size
        duration: 0.1,
        ease: "power2.out"
      });
    }
    
    this.handleSpawnParticle(x, y);
  },

  handleSpawnParticle(x, y) {
  const particle = document.createElement('div');
  particle.className = 'cursor-particle';
  particle.style.left = `${x - 4}px`;
  particle.style.top = `${y - 4}px`;
    this.particlesContainer.appendChild(particle);

    // Use GSAP for particle animation
    gsap.fromTo(particle, 
      { 
        opacity: 1, 
        scale: 1,
        rotation: 0
      },
      { 
        opacity: 0, 
        scale: 0.3,
        rotation: 180,
        duration: 0.7,
        ease: "power2.out",
        onComplete: () => {
    if (particle.parentNode) particle.parentNode.removeChild(particle);
}
      }
    );
  }
};

// Reversible scroll-triggered letter animation for all .animated-header elements
(() => {
  const animatedHeaders = document.querySelectorAll('.animated-header');
  animatedHeaders.forEach(header => {
    const letters = header.querySelectorAll('.letter');
    // Find the closest section or container for viewport detection
    let section = header.closest('section');
    if (!section) section = header.parentElement;
    if (!section) return;

    const getSectionScrollInfo = () => {
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top + window.scrollY;
      const sectionHeight = rect.height;
      return { sectionTop, sectionHeight };
    };

    const checkScroll = () => {
      const { sectionTop, sectionHeight } = getSectionScrollInfo();
      const scrollY = window.scrollY;
      // Only animate when section/container is in viewport
      if (scrollY + window.innerHeight < sectionTop || scrollY > sectionTop + sectionHeight) {
        // Section not in view, hide all
        letters.forEach(letter => letter.classList.remove('visible'));
        return;
      }
      const triggerInterval = sectionHeight / (letters.length - 1);
      const relativeScroll = Math.max(0, Math.min(scrollY + window.innerHeight - sectionTop, sectionHeight));
      letters.forEach((letter, index) => {
        const triggerPoint = index * triggerInterval;
        if (relativeScroll >= triggerPoint) {
          letter.classList.add('visible');
        } else {
          letter.classList.remove('visible');
        }
      });
    };

    window.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    document.addEventListener('DOMContentLoaded', checkScroll);
    checkScroll();
  });
})();

// Custom cursor color feedback for clickable elements
window.addEventListener('DOMContentLoaded', () => {
  const clickableSelectors = [
    'a', 'button', '.tool-moon', '.navbar-tab', '.faq-question', '.cta-button', '.clickable'
  ];
  const customCursor = document.getElementById('custom-cursor');
  if (!customCursor) return;
  document.querySelectorAll(clickableSelectors.join(',')).forEach(el => {
    el.addEventListener('mouseenter', () => {
      customCursor.style.setProperty('--cursor-color', 'var(--color-primary)');
    });
    el.addEventListener('mouseleave', () => {
      customCursor.style.setProperty('--cursor-color', 'var(--color-neutral-light)');
    });
  });
});

// Sound Bars Button: Toggle Hero Video Sound

document.addEventListener('DOMContentLoaded', () => {
  const soundBtn = document.querySelector('.sound-bars-btn');
  const heroVideo = document.querySelector('.hero-bg-video');
  if (!soundBtn || !heroVideo) return;

  const updateAria = () => {
    soundBtn.setAttribute('aria-label', heroVideo.muted ? 'Unmute hero video' : 'Mute hero video');
  };

  const toggleSound = () => {
    heroVideo.muted = !heroVideo.muted;
    if (!heroVideo.paused) heroVideo.play();
    updateAria();
    soundBtn.classList.toggle('sound-on', !heroVideo.muted);
  };

  soundBtn.addEventListener('click', toggleSound);
  soundBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSound();
    }
  });

  // Initial state
  updateAria();

  // Auto-mute when leaving hero section
  const heroSection = document.querySelector('.hero-section');
  if (heroSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          if (!heroVideo.muted) {
            heroVideo.muted = true;
            updateAria();
            soundBtn.classList.remove('sound-on');
          }
        }
      });
    }, { threshold: 0.01 });
    observer.observe(heroSection);
  }
});

// ============================================================================
// Navbar Show/Hide on Scroll (ScrollTrigger Integration)
// ============================================================================

const NavbarScrollBehavior = {
  navbar: null,
  scrollThreshold: 150, // Minimum scroll before hiding navbar
  isInitialized: false,
  
  init() {
    this.navbar = document.querySelector('.navbar');
    if (!this.navbar) {
      console.warn('❌ Navbar element not found');
      return;
    }
    
    // Ensure navbar is visible initially
    this.showNavbar();
    
    // Wait for ScrollTrigger to be ready
    this.waitForScrollTrigger();
  },
  
  waitForScrollTrigger() {
    if (typeof ScrollTrigger !== 'undefined') {
      this.setupScrollTriggerBehavior();
    } else {
      setTimeout(() => this.waitForScrollTrigger(), 100);
    }
  },
  
  setupScrollTriggerBehavior() {
    // Create a ScrollTrigger instance specifically for navbar behavior
    ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        this.handleScrollUpdate(self);
      }
    });
    
    this.isInitialized = true;
  },
  
  handleScrollUpdate(self) {
    if (!this.isInitialized) return;
    
    const currentScroll = self.scroll();
    const direction = self.direction;
    
    // Compound conditional logic: Only hide if scrolling down AND past threshold
    if (direction === 1 && currentScroll > this.scrollThreshold) {
      // Scrolling down and past threshold - hide navbar
      this.hideNavbar();
    } else if (direction === -1 || currentScroll <= this.scrollThreshold) {
      // Scrolling up OR at/near top - show navbar
      this.showNavbar();
    }
  },
  
  showNavbar() {
    if (this.navbar && this.navbar.classList.contains('navbar-hidden')) {
      this.navbar.classList.remove('navbar-hidden');
      this.navbar.setAttribute('aria-hidden', 'false');
    }
  },
  
  hideNavbar() {
    if (this.navbar && !this.navbar.classList.contains('navbar-hidden')) {
      this.navbar.classList.add('navbar-hidden');
      this.navbar.setAttribute('aria-hidden', 'true');
    }
  }
};

// ============================================================================
// App Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  const app = new CodlessApp();
  app.init();

  // Initialize NavbarScrollBehavior and HorizontalScroll after the page is fully loaded.
  window.addEventListener('load', () => {
    // A small delay ensures all elements are stable and Lenis is ready.
    setTimeout(() => {
        NavbarScrollBehavior.init();
        HorizontalScroll.init(); // <-- FIXED: Initialize after full page load.
    }, 500); 
  });
  
  // Final check for smooth scrolling readiness
  setTimeout(() => {
    if (LenisSmoothScrolling.lenis) {
      console.log('🚀 Website ready with smooth scrolling!');
      // Add a class to body for CSS optimizations
      document.body.classList.add('smooth-scroll-ready');
    } else {
      console.log('⚠️ Website ready with native scrolling');
      document.body.classList.add('native-scroll-ready');
    }
  }, 2000);
});