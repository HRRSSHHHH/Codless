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
    this.hamburger = safeQuerySelector('.hamburger');
    this.overlay = safeQuerySelector('#mobile-nav-overlay');
    this.closeBtn = safeQuerySelector('#close-nav-btn');
    this.navTabs = safeQuerySelectorAll('.mobile-nav-tab');
    
    if (!this.hamburger || !this.overlay) {
      console.warn('Navigation elements for overlay menu not found');
      return;
    }

    this.setupEventListeners();
    this.assignStaggerIndexes();
  },

  // Assigns a CSS variable to each nav tab for staggered animation
  assignStaggerIndexes() {
    this.navTabs.forEach((tab, index) => {
      tab.style.setProperty('--i', index);
    });
  },

  setupEventListeners() {
    // Hamburger icon opens the menu
    this.hamburger.addEventListener('click', () => this.openMenu());

    // Close button closes the menu
    this.closeBtn.addEventListener('click', () => this.closeMenu());

    // Clicking any nav link closes the menu
    this.navTabs.forEach(tab => {
      tab.addEventListener('click', () => this.closeMenu());
    });

    // Pressing Escape key closes the menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.closeMenu();
      }
    });
  },
  
  openMenu() {
    if (LenisSmoothScrolling.lenis) {
      LenisSmoothScrolling.lenis.stop(); // Stop page scrolling
    }
    document.body.style.overflow = 'hidden'; // Fallback for no Lenis
    this.hamburger.classList.add('active');
    this.overlay.classList.add('active');
  },

  closeMenu() {
    if (LenisSmoothScrolling.lenis) {
      LenisSmoothScrolling.lenis.start(); // Resume page scrolling
    }
    document.body.style.overflow = ''; // Fallback for no Lenis
    this.hamburger.classList.remove('active');
    this.overlay.classList.remove('active');
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
// Tools Section Animation Module (Definitive Version)
// ============================================================================
const ToolsAnimation = {
  init() {
    const toolsSection = safeQuerySelector('.tools-section');
    const toolMoons = safeQuerySelectorAll('.tool-moon');
    if (!toolMoons.length || !toolsSection) {
      console.log('Tools section elements not found');
      return;
    }

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    let activeMoon = null;

    // --- Reusable Animation Functions ---

    // Activates the "wobble, rotate, and grow" effect
    const activateMoon = (moon) => {
      const icon = moon.querySelector('.tool-icon');
      const label = moon.querySelector('.tool-label');
      moon.style.animationPlayState = 'paused';
      gsap.to(icon, { scale: 1.3, rotation: 360, duration: 0.4, ease: "back.out(1.7)" });
      gsap.to(label, { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" });
      gsap.to(moon, { filter: "brightness(1.2) drop-shadow(0 0 10px rgba(222, 107, 72, 0.5))", duration: 0.3, ease: "power2.out" });
    };

    // Resets the moon to its default orbiting state
    const resetMoon = (moon) => {
      if (!moon) return;
      const icon = moon.querySelector('.tool-icon');
      const label = moon.querySelector('.tool-label');
      moon.style.animationPlayState = 'running';
      gsap.to(icon, { scale: 1, rotation: 0, duration: 0.4, ease: "power2.out" });
      gsap.to(label, { opacity: 0, scale: 0.8, y: 10, duration: 0.4, ease: "power2.out" });
      gsap.to(moon, { filter: "brightness(1) drop-shadow(none)", duration: 0.3, ease: "power2.out" });
    };

    // --- Intersection Observer for Performance ---
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          toolMoons.forEach(moon => {
            if (moon !== activeMoon) moon.style.animationPlayState = 'running';
          });
        } else {
          toolMoons.forEach(moon => {
            moon.style.animationPlayState = 'paused';
          });
        }
      });
    }, { threshold: 0.01 });
    observer.observe(toolsSection);

    // --- Device-Specific Event Listeners ---

    if (isTouchDevice) {
      // --- MOBILE: TAP LOGIC ---
      toolMoons.forEach(moon => {
        gsap.set(moon.querySelector('.tool-label'), { opacity: 0, scale: 0.8, y: 10 });
        moon.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation(); // Prevent the document click listener from firing
          
          if (activeMoon && activeMoon !== moon) {
            resetMoon(activeMoon);
          }
          
          if (activeMoon === moon) {
            resetMoon(moon);
            activeMoon = null;
          } else {
            activateMoon(moon);
            activeMoon = moon;
          }
        });
      });

      // Listener to tap outside to close
      document.addEventListener('click', () => {
        if (activeMoon) {
          resetMoon(activeMoon);
          activeMoon = null;
        }
      });

    } else {
      // --- DESKTOP: HOVER LOGIC ---
      toolMoons.forEach((moon) => {
        gsap.set(moon.querySelector('.tool-label'), { opacity: 0, scale: 0.8, y: 10 });
        moon.addEventListener('mouseenter', () => activateMoon(moon));
        moon.addEventListener('mouseleave', () => resetMoon(moon));
      });
    }
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
// Particle Globe Module (Corrected Performance Optimization)
// ============================================================================

const ParticleGlobe = {
  init() {
    this.container = safeQuerySelector('#particle-globe-container');
    if (!this.container) return;
    
    // --- THIS IS THE FIX ---
    // Assume the globe is visible on page load.
    this.isInView = true; 
    
    // (All other properties remain the same)
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.isRendered = false; 
    this.clickPoint = new THREE.Vector3();
    this.clickStrength = 0;
    this.noise = new SimplexNoise();
    this.clock = new THREE.Clock();
    this.NOISE_FREQUENCY = 0.3;
    this.NOISE_AMPLITUDE = 0.45;
    this.NOISE_SPEED = 0.03;
    this.baseColor = new THREE.Color('#508AA8'); 
    this.hotColor = new THREE.Color('#DE6B48');  
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.z = 9;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.PARTICLE_COUNT = 20000;
    this.PARTICLE_SIZE = 0.04;
    this.GLOBE_RADIUS = 5;
    this.MOUSE_INFLUENCE_RADIUS = 2;
    this.MOUSE_REPEL_STRENGTH = 8;
    this.mouse = new THREE.Vector2(-100, -100);
    this.raycaster = new THREE.Raycaster();

    this.setupGlobe();
    this.setupEventListeners();
    this.animate();
    this.setupIntersectionObserver();
  },

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            this.isInView = entry.isIntersecting;
        });
    }, { threshold: 0.01 });

    observer.observe(this.container);
  },
  
  animate() {
    requestAnimationFrame(this.animate.bind(this));

    if (!this.isInView) {
        return;
    }

    // (The rest of the animate() function remains the same)
    if (!this.isRendered && this.container.clientWidth > 0) {
      this.onWindowResize();
      this.isRendered = true;
    }
    const elapsedTime = this.clock.getElapsedTime();
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.intersectionSphere);
    const mouse3D = (intersects.length > 0) ? intersects[0].point : new THREE.Vector3();
    const positionAttribute = this.particles.geometry.attributes.position;
    const colorAttribute = this.particles.geometry.attributes.color;
    if (this.clickStrength > 0) { this.clickStrength *= 0.95; }
    if (this.clickStrength < 0.01) { this.clickStrength = 0; }
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const originalPos = new THREE.Vector3(this.originalPositions[i3], this.originalPositions[i3 + 1], this.originalPositions[i3 + 2]);
        const animatedPos = new THREE.Vector3(positionAttribute.getX(i), positionAttribute.getY(i), positionAttribute.getZ(i));
        const normal = originalPos.clone().normalize();
        const noiseValue = this.noise.noise3D(originalPos.x * this.NOISE_FREQUENCY, originalPos.y * this.NOISE_FREQUENCY, originalPos.z * this.NOISE_FREQUENCY + (elapsedTime * this.NOISE_SPEED));
        const shimmerOffset = normal.multiplyScalar(noiseValue * this.NOISE_AMPLITUDE);
        const shimmeringPos = originalPos.clone().add(shimmerOffset);
        const normalizedNoise = (noiseValue + 1) * 0.5;
        const currentColor = new THREE.Color();
        currentColor.copy(this.baseColor).lerp(this.hotColor, normalizedNoise);
        colorAttribute.setXYZ(i, currentColor.r, currentColor.g, currentColor.b);
        const worldShimmeringPos = shimmeringPos.clone().applyMatrix4(this.particles.matrixWorld);
        let totalDisplacement = new THREE.Vector3();
        const hoverDistance = worldShimmeringPos.distanceTo(mouse3D);
        if (hoverDistance < this.MOUSE_INFLUENCE_RADIUS && !this.isTouchDevice) {
            const hoverDirection = worldShimmeringPos.clone().sub(mouse3D).normalize();
            const hoverRepelStrength = ((this.MOUSE_INFLUENCE_RADIUS - hoverDistance) / this.MOUSE_INFLUENCE_RADIUS) * this.MOUSE_REPEL_STRENGTH;
            totalDisplacement.add(hoverDirection.multiplyScalar(hoverRepelStrength));
        }
        if (this.clickStrength > 0) {
            const clickDistance = worldShimmeringPos.distanceTo(this.clickPoint);
            const CLICK_INFLUENCE_RADIUS = 3;
            if (clickDistance < CLICK_INFLUENCE_RADIUS) {
                const clickDirection = worldShimmeringPos.clone().sub(this.clickPoint).normalize();
                const clickPushStrength = ((CLICK_INFLUENCE_RADIUS - clickDistance) / CLICK_INFLUENCE_RADIUS) * this.clickStrength;
                totalDisplacement.add(clickDirection.multiplyScalar(clickPushStrength));
            }
        }
        const worldTargetPos = worldShimmeringPos.clone().add(totalDisplacement);
        const targetPos = worldTargetPos.clone().applyMatrix4(this.particles.matrixWorld.clone().invert());
        animatedPos.lerp(targetPos, 0.08);
        positionAttribute.setXYZ(i, animatedPos.x, animatedPos.y, animatedPos.z);
    }
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  },

  // (The rest of the functions in this module remain the same)
  setupGlobe() {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 3;
    if (this.isTouchDevice) {
        this.controls.enableRotate = false;
    }
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.intersectionSphere = new THREE.Mesh(
        new THREE.SphereGeometry(this.GLOBE_RADIUS, 32, 32),
        new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    );
    this.scene.add(this.intersectionSphere);
    const positions = new Float32Array(this.PARTICLE_COUNT * 3);
    const colors = new Float32Array(this.PARTICLE_COUNT * 3);
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
        const u = Math.random(), v = Math.random();
        const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
        const x = this.GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
        const y = this.GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);
        const z = this.GLOBE_RADIUS * Math.cos(phi);
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        this.baseColor.toArray(colors, i * 3);
    }
    this.originalPositions = new Float32Array(positions);
    this.animatedPositions = new Float32Array(positions);
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.animatedPositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const texture = this.createParticleTexture();
    const particleMaterial = new THREE.PointsMaterial({
        size: this.PARTICLE_SIZE, map: texture,
        transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, sizeAttenuation: true,
        vertexColors: true
    });
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(this.particles);
  },
  createParticleTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 128; canvas.height = 128;
      const context = canvas.getContext('2d');
      const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.2, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.5, '#DE6B48');
      gradient.addColorStop(1, 'rgba(255,100,0,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(canvas);
  },
  setupEventListeners() {
    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize, false);
    if (this.isTouchDevice) {
        this.onTouchStart = this.onTouchStart.bind(this);
        this.container.addEventListener('touchstart', this.onTouchStart, { passive: false });
    } else {
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseClick = this.onMouseClick.bind(this);
        this.container.addEventListener('mousemove', this.onMouseMove, false);
        this.container.addEventListener('click', this.onMouseClick, false);
    }
  },
  onTouchStart(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.touches.length > 0) {
        const touch = event.touches[0];
        this.triggerDisperse(touch.clientX, touch.clientY);
    }
  },
  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  },
  onMouseMove(event) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  },
  onMouseClick(event) {
    this.triggerDisperse(event.clientX, event.clientY);
  },
  triggerDisperse(x, y) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.intersectionSphere);
    if (intersects.length > 0) {
      this.clickPoint.copy(intersects[0].point);
      this.clickStrength = 15;
    }
  },
};

// ============================================================================
// Horizontal Scroll Module (UPGRADED with 3D Fly-in)
// ============================================================================

const HorizontalScroll = {
  init() {
    gsap.registerPlugin(ScrollTrigger);

    const container = document.querySelector(".horizontal-container");
    const wrapper = document.querySelector(".horizontal-wrapper");
    const horizontalSections = gsap.utils.toArray(".horizontal-card");
    const scrollCue = document.querySelector(".horizontal-scroll-cue"); // Get the cue element

    if (!container || !wrapper || !horizontalSections.length) {
      console.warn("Horizontal scroll elements not found. Skipping initialization.");
      return;
    }

    // Check for mobile devices
    if (window.matchMedia("(max-width: 768px)").matches) {
      // --- MOBILE LOGIC ---
      container.style.overflowX = "scroll";
      wrapper.style.position = "static";
      wrapper.style.display = "flex";
      wrapper.style.width = `${horizontalSections.length * 100}vw`; // Set width explicitly

      // NEW: Dot indicator logic
      const dotsContainer = document.querySelector(".scroll-dots");
      if (dotsContainer) {
        // Create a dot for each section
        for (let i = 0; i < horizontalSections.length; i++) {
          const dot = document.createElement("div");
          dot.classList.add("dot");
          dotsContainer.appendChild(dot);
        }

        const dots = dotsContainer.querySelectorAll(".dot");
        dots[0]?.classList.add("active"); // Activate the first dot initially

        let currentActiveDot = 0;

        // Add a scroll event listener to the container
        container.addEventListener('scroll', () => {
          // Hide the "Swipe to continue" message on the first scroll
          if (scrollCue && !scrollCue.classList.contains('hidden')) {
            scrollCue.classList.add('hidden');
          }

          // Calculate which dot should be active
          const scrollLeft = container.scrollLeft;
          const sectionWidth = window.innerWidth;
          const activeIndex = Math.round(scrollLeft / sectionWidth);

          // Update dots only if the active one has changed
          if (activeIndex !== currentActiveDot) {
            dots[currentActiveDot]?.classList.remove("active");
            dots[activeIndex]?.classList.add("active");
            currentActiveDot = activeIndex;
          }
        });
      }

    } else {
      // --- DESKTOP LOGIC (Unchanged) ---
      const horizontalTween = gsap.to(wrapper, {
        x: () => `-${wrapper.scrollWidth - window.innerWidth}px`,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          pin: true,
          scrub: 1,
          end: () => `+=${wrapper.scrollWidth - window.innerWidth}`,
          invalidateOnRefresh: true,
          pinType: "transform",
        },
      });

      horizontalSections.forEach(section => {
        gsap.from(section, {
          x: 200,
          rotateY: -30,
          translateZ: -300,
          autoAlpha: 0,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            containerAnimation: horizontalTween,
            start: 'left 90%',
            end: 'left 60%',
            scrub: 1.5,
          },
        });
      });
    }
    console.log("✅ Horizontal scroll initialized successfully.");
  }
};

// ============================================================================
// Card Stack Animation Module (UPGRADED - 3D Perspective Fly-In)
// ============================================================================

const CardStackAnimation = {
    init() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP or ScrollTrigger not available for CardStackAnimation');
            return;
        }

        gsap.registerPlugin(ScrollTrigger);
        const sections = gsap.utils.toArray(".card-stack-container .step-section");

        if (!sections.length) {
            console.warn("Card stack elements for animation not found.");
            return;
        }

        // Set the z-index for each section to ensure they stack correctly.
        sections.forEach((section, i) => {
            gsap.set(section, { zIndex: i });
        });

        // Animate each section (except the first one) with a 3D effect.
        sections.forEach((section, i) => {
            if (i === 0) return; // Skip the first section.

            // Animate from a state of being rotated, distant, and transparent.
            gsap.from(section, {
                y: 150,                 // Start 150px down
                rotateX: -45,           // Rotate on the X-axis
                translateZ: -300,       // Start "further away" in 3D space
                autoAlpha: 0,           // Fade in (opacity + visibility)
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: section,
                    start: "top bottom", // Animation starts when section top hits viewport bottom
                    end: "top 30%",      // Animation completes when section top is 30% from viewport top
                    scrub: 1.5,
                }
            });
        });

        console.log("✅ 3D Perspective card stack animation initialized successfully.");
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
      ScrollCTA,
      ParticleGlobe
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
    
    // Disable custom cursor on mobile screens
    if (window.matchMedia('(max-width: 768px)').matches) {
      return;
    }

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
// App Initialization (REVISED)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  const app = new CodlessApp();
  app.init();

  // Initialize all scroll-dependent animations after the page is fully loaded.
  // This ensures layout is stable and all trigger points are calculated correctly.
  window.addEventListener('load', () => {
    setTimeout(() => {
        NavbarScrollBehavior.init();
        CardStackAnimation.init(); // <-- Initialize revised card stack here
        HorizontalScroll.init();   // <-- Initialize horizontal scroll here

        // A single refresh after all scroll-based modules are initialized
        ScrollTrigger.refresh();
        console.log("✅ All scroll-based animations initialized and refreshed.");
    }, 100); // A small timeout ensures everything has settled.
  });

  // Final check for smooth scrolling readiness
  setTimeout(() => {
    if (LenisSmoothScrolling.lenis) {
      console.log('🚀 Website ready with smooth scrolling!');
      document.body.classList.add('smooth-scroll-ready');
    } else {
      console.log('⚠️ Website ready with native scrolling');
      document.body.classList.add('native-scroll-ready');
    }
  }, 2000);
}); 