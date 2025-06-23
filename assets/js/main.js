/**
 * EcoWatt Energy Management Platform
 * Copyright (c) 2025 Panashe Matengambiri
 * Proprietary and Confidential
 */
// EcoWatt Progressive Web App
// Advanced Mobile-First Energy Management Platform

class EcoWattPWA {
    constructor() {
        this.version = '2.0.0';
        this.isOnline = navigator.onLine;
        this.currentScreen = 'splash';
        this.currentSlide = 0;
        this.totalSlides = 3;
        this.isFirstTime = !localStorage.getItem('ecowatt_onboarded');
        this.energyData = this.loadEnergyData();
        this.settings = this.loadSettings();
        
        this.init();
    }

    init() {
        this.setupPWA();
        this.setupOfflineHandling();
        this.setupSplashScreen();
        this.setupEventListeners();
        this.setupAnimations();
        this.setupNotifications();
        this.checkFirstTime();
        this.loadCharts();
    }

    // PWA Setup and Management
    setupPWA() {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(registration => {
                        console.log('✅ EcoWatt SW registered successfully');
                        this.checkForUpdates(registration);
                    })
                    .catch(error => {
                        console.log('❌ EcoWatt SW registration failed:', error);
                    });
            });
        }

        // PWA Install Prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallPrompt();
        });

        // Install button handler
        document.getElementById('installBtn')?.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    this.hideInstallPrompt();
                    this.trackEvent('pwa_installed', { method: 'prompt' });
                }
                deferredPrompt = null;
            }
        });

        // Dismiss install prompt
        document.getElementById('dismissInstall')?.addEventListener('click', () => {
            this.hideInstallPrompt();
            localStorage.setItem('install_dismissed', Date.now());
        });

        // Handle app installed
        window.addEventListener('appinstalled', () => {
            this.hideInstallPrompt();
            this.showToast('🎉 EcoWatt installed successfully!', 'success');
            this.trackEvent('pwa_installed', { method: 'auto' });
        });
    }

    checkForUpdates(registration) {
        if (registration.waiting) {
            this.showUpdatePrompt(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    this.showUpdatePrompt(newWorker);
                }
            });
        });
    }

    showUpdatePrompt(worker) {
        const updatePrompt = document.createElement('div');
        updatePrompt.className = 'fixed top-4 left-4 right-4 glass-morphism p-4 rounded-xl z-50';
        updatePrompt.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                        <i class="fas fa-sync-alt text-white"></i>
                    </div>
                    <div>
                        <h4 class="font-semibold text-white">Update Available</h4>
                        <p class="text-sm text-gray-300">A new version of EcoWatt is ready</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button id="updateBtn" class="btn-primary text-sm px-4 py-2">Update</button>
                    <button id="dismissUpdate" class="btn-secondary text-sm px-4 py-2">Later</button>
                </div>
            </div>
        `;

        document.body.appendChild(updatePrompt);

        updatePrompt.querySelector('#updateBtn').addEventListener('click', () => {
            worker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        });

        updatePrompt.querySelector('#dismissUpdate').addEventListener('click', () => {
            updatePrompt.remove();
        });

        // Auto-animate in
        gsap.fromTo(updatePrompt, 
            { opacity: 0, y: -50 }, 
            { opacity: 1, y: 0, duration: 0.5 }
        );
    }

    // Offline Handling
    setupOfflineHandling() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showToast('🌐 Connection restored', 'success');
            this.syncOfflineData();
            this.updateUI();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showToast('📱 You\'re offline - some features are limited', 'info');
            this.updateUI();
        });
    }

    // Splash Screen with Enhanced Animations
    setupSplashScreen() {
        const splash = document.getElementById('splashScreen');
        const logo = splash.querySelector('.splash-logo');
        
        // Logo animation sequence
        gsap.timeline()
            .from(logo, { scale: 0, rotation: -180, duration: 1, ease: "back.out(1.7)" })
            .from('.splash-screen h1', { opacity: 0, y: 20, duration: 0.8 }, "-=0.5")
            .from('.splash-screen p', { opacity: 0, y: 20, duration: 0.8 }, "-=0.6")
            .from('.loading-spinner', { opacity: 0, scale: 0, duration: 0.5 }, "-=0.3");

        // Hide splash after animation
        setTimeout(() => {
            gsap.to(splash, {
                opacity: 0,
                scale: 0.9,
                duration: 0.8,
                ease: "power2.inOut",
                onComplete: () => {
                    splash.style.display = 'none';
                    this.checkFirstTime();
                }
            });
        }, 3500);
    }

    // Enhanced Event Listeners
    setupEventListeners() {
        // Auth flow
        document.getElementById('send-otp-btn')?.addEventListener('click', () => {
            this.sendOTP();
        });

        document.getElementById('verify-otp-btn')?.addEventListener('click', () => {
            this.verifyOTP();
        });

        // Navigation
        this.setupNavigation();

        // Quick actions
        document.getElementById('show-recharge-btn')?.addEventListener('click', () => {
            this.openRechargeModal();
        });

        document.getElementById('show-forecast-btn')?.addEventListener('click', () => {
            this.showForecast();
        });

        document.getElementById('show-budget-btn')?.addEventListener('click', () => {
            this.showBudget();
        });

        document.getElementById('show-devices-btn')?.addEventListener('click', () => {
            this.showDevices();
        });

        document.getElementById('emergency-credit-btn')?.addEventListener('click', () => {
            this.showEmergencyCredit();
        });

        // OTP inputs
        this.setupOTPInputs();

        // Gestures for mobile
        this.setupGestures();

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    setupNavigation() {
        const navItems = ['nav-home', 'nav-usage', 'nav-budget', 'nav-profile'];
        const screens = ['home-screen', 'usage-screen', 'budget-screen', 'profile-screen'];

        navItems.forEach((navId, index) => {
            document.getElementById(navId)?.addEventListener('click', () => {
                this.setActiveNavItem(navId);
                this.showScreen(screens[index]);
                this.trackEvent('navigation', { screen: screens[index] });
            });
        });
    }

    setupGestures() {
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        document.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });

        const handleSwipe = () => {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe left - next screen
                    this.navigateToNextScreen();
                } else {
                    // Swipe right - previous screen
                    this.navigateToPrevScreen();
                }
            }
        };

        this.handleSwipe = handleSwipe;
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.showScreen('home-screen');
                        this.setActiveNavItem('nav-home');
                        break;
                    case '2':
                        e.preventDefault();
                        this.showScreen('usage-screen');
                        this.setActiveNavItem('nav-usage');
                        break;
                    case 'r':
                        e.preventDefault();
                        this.openRechargeModal();
                        break;
                }
            }
        });
    }

    // Advanced Animations Setup
    setupAnimations() {
        // Initialize AOS with custom settings
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 50,
            delay: 0,
            anchorPlacement: 'top-bottom'
        });

        // Register GSAP plugins
        gsap.registerPlugin(ScrollTrigger);

        // Setup scroll-triggered animations
        this.setupScrollAnimations();

        // Setup hover animations for cards
        this.setupCardAnimations();

        // Setup button ripple effects
        this.setupButtonAnimations();
    }

    setupScrollAnimations() {
        // Animate cards on scroll
        gsap.utils.toArray('.enhanced-card').forEach(card => {
            gsap.fromTo(card, 
                {
                    opacity: 0,
                    y: 50,
                    scale: 0.9
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: card,
                        start: "top 85%",
                        end: "bottom 15%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });
    }

    setupCardAnimations() {
        document.querySelectorAll('.enhanced-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (window.innerWidth > 768) {
                    gsap.to(card, {
                        scale: 1.02,
                        y: -8,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }
            });

            card.addEventListener('mouseleave', () => {
                if (window.innerWidth > 768) {
                    gsap.to(card, {
                        scale: 1,
                        y: 0,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }
            });
        });
    }

    setupButtonAnimations() {
        document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ripple = document.createElement('span');
                const rect = btn.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    background: rgba(255,255,255,0.3);
                    border-radius: 50%;
                    transform: scale(0);
                    pointer-events: none;
                `;

                btn.style.position = 'relative';
                btn.style.overflow = 'hidden';
                btn.appendChild(ripple);

                gsap.to(ripple, {
                    scale: 2,
                    opacity: 0,
                    duration: 0.6,
                    ease: "power2.out",
                    onComplete: () => ripple.remove()
                });
            });
        });
    }

    // Notification Setup
    setupNotifications() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            this.requestNotificationPermission();
        }

        // Setup push notification handling
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            this.setupPushNotifications();
        }
    }

    async requestNotificationPermission() {
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.showToast('🔔 Notifications enabled', 'success');
                this.scheduleEnergyReminders();
            }
        }
    }

    scheduleEnergyReminders() {
        // Schedule daily energy usage reminders
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow

        const msUntilTomorrow = tomorrow.getTime() - now.getTime();

        setTimeout(() => {
            this.sendLocalNotification(
                'Daily Energy Reminder',
                'Check your energy consumption and plan your day accordingly!'
            );
        }, msUntilTomorrow);
    }

    sendLocalNotification(title, body, options = {}) {
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body,
                icon: './assets/icons/icon-192x192.png',
                badge: './assets/icons/badge-72x72.png',
                vibrate: [100, 50, 100],
                ...options
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            setTimeout(() => notification.close(), 10000);
        }
    }

    // Data Management
    loadEnergyData() {
        const defaultData = {
            currentBalance: 8.42,
            dailyUsage: 1.2,
            monthlyBudget: 25,
            usageHistory: [],
            devices: [],
            lastUpdate: Date.now()
        };

        try {
            const stored = localStorage.getItem('ecowatt_energy_data');
            return stored ? { ...defaultData, ...JSON.parse(stored) } : defaultData;
        } catch {
            return defaultData;
        }
    }

    saveEnergyData() {
        try {
            localStorage.setItem('ecowatt_energy_data', JSON.stringify(this.energyData));
        } catch (error) {
            console.warn('Failed to save energy data:', error);
        }
    }

    loadSettings() {
        const defaultSettings = {
            language: 'en',
            currency: 'ZWL',
            notifications: true,
            darkMode: 'auto',
            dataSync: true,
            lastSync: null
        };

        try {
            const stored = localStorage.getItem('ecowatt_settings');
            return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('ecowatt_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    // Core App Functions
    checkFirstTime() {
        if (this.isFirstTime) {
            this.showOnboarding();
        } else {
            this.showScreen('home-screen');
        }
    }

    showOnboarding() {
        document.getElementById('onboarding-container').style.display = 'flex';
        this.currentScreen = 'onboarding';
        
        // Track onboarding start
        this.trackEvent('onboarding_started');
    }

    nextOnboardingSlide() {
        if (this.currentSlide < this.totalSlides - 1) {
            const currentSlideEl = document.querySelectorAll('.onboarding-slide')[this.currentSlide];
            const nextSlideEl = document.querySelectorAll('.onboarding-slide')[this.currentSlide + 1];

            // Advanced slide transition
            const tl = gsap.timeline();
            
            tl.to(currentSlideEl, {
                x: '-100%',
                opacity: 0,
                duration: 0.6,
                ease: "power2.inOut"
            })
            .fromTo(nextSlideEl, 
                { x: '100%', opacity: 0 },
                { 
                    x: '0%', 
                    opacity: 1, 
                    duration: 0.6,
                    ease: "power2.inOut"
                }, 0.1
            );

            currentSlideEl.classList.remove('active');
            nextSlideEl.classList.add('active');
            this.currentSlide++;

            // Track slide progression
            this.trackEvent('onboarding_slide', { slide: this.currentSlide + 1 });
        }
    }

    prevOnboardingSlide() {
        if (this.currentSlide > 0) {
            const currentSlideEl = document.querySelectorAll('.onboarding-slide')[this.currentSlide];
            const prevSlideEl = document.querySelectorAll('.onboarding-slide')[this.currentSlide - 1];

            const tl = gsap.timeline();
            
            tl.to(currentSlideEl, {
                x: '100%',
                opacity: 0,
                duration: 0.6,
                ease: "power2.inOut"
            })
            .fromTo(prevSlideEl,
                { x: '-100%', opacity: 0 },
                { 
                    x: '0%', 
                    opacity: 1, 
                    duration: 0.6,
                    ease: "power2.inOut"
                }, 0.1
            );

            currentSlideEl.classList.remove('active');
            prevSlideEl.classList.add('active');
            this.currentSlide--;
        }
    }

    completeOnboarding() {
        localStorage.setItem('ecowatt_onboarded', 'true');
        this.isFirstTime = false;
        
        // Track onboarding completion
        this.trackEvent('onboarding_completed');
        
        // Animate out onboarding
        gsap.to('#onboarding-container', {
            opacity: 0,
            scale: 0.9,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => {
                document.getElementById('onboarding-container').style.display = 'none';
                this.showScreen('auth-screen');
            }
        });
    }

    // Authentication Functions
    sendOTP() {
        const phoneInput = document.getElementById('phone-input');
        const phone = phoneInput.value.trim();

        if (!this.validatePhone(phone)) {
            this.showToast('Please enter a valid phone number', 'error');
            this.shakeElement(phoneInput);
            return;
        }

        // Show loading state
        const btn = document.getElementById('send-otp-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<div class="loading-spinner mr-2"></div> Sending...';
        btn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            this.showToast('Verification code sent!', 'success');
            this.showScreen('otp-screen');
            
            // Auto-focus first OTP input
            setTimeout(() => {
                document.querySelector('.otp-input')?.focus();
            }, 300);

            this.trackEvent('otp_sent', { phone });
        }, 2000);
    }

    verifyOTP() {
        const otpInputs = document.querySelectorAll('.otp-input');
        const otp = Array.from(otpInputs).map(input => input.value).join('');

        if (otp.length !== 4) {
            this.showToast('Please enter complete verification code', 'error');
            this.shakeElement(otpInputs[0].parentElement);
            return;
        }

        // Show loading state
        const btn = document.getElementById('verify-otp-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<div class="loading-spinner mr-2"></div> Verifying...';
        btn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            
            if (otp === '1234') { // Demo OTP
                this.showToast('Verification successful!', 'success');
                localStorage.setItem('ecowatt_authenticated', 'true');
                this.showScreen('home-screen');
                this.trackEvent('authentication_success');
            } else {
                this.showToast('Invalid verification code', 'error');
                otpInputs.forEach(input => input.value = '');
                otpInputs[0].focus();
                this.trackEvent('authentication_failed', { reason: 'invalid_otp' });
            }
        }, 1500);
    }

    // Screen Management
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
            screen.classList.remove('active');
        });

        // Hide onboarding
        const onboarding = document.getElementById('onboarding-container');
        if (onboarding) onboarding.style.display = 'none';

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (!targetScreen) return;

        targetScreen.style.display = 'block';
        
        // Advanced screen transition
        gsap.fromTo(targetScreen, 
            { opacity: 0, x: 30, scale: 0.98 },
            { 
                opacity: 1, 
                x: 0, 
                scale: 1,
                duration: 0.6,
                ease: "power2.out",
                onComplete: () => {
                    targetScreen.classList.add('active');
                    this.refreshScreen(screenId);
                }
            }
        );

        this.currentScreen = screenId;
        window.scrollTo(0, 0);

        // Update navigation
        this.updateNavigationForScreen(screenId);
    }

    refreshScreen(screenId) {
        switch(screenId) {
            case 'home-screen':
                this.updateEnergyMeter();
                this.updateDashboardCards();
                break;
            case 'usage-screen':
                this.loadUsageCharts();
                break;
            case 'budget-screen':
                this.loadBudgetData();
                break;
        }
    }

    updateNavigationForScreen(screenId) {
        const navMapping = {
            'home-screen': 'nav-home',
            'usage-screen': 'nav-usage',
            'budget-screen': 'nav-budget',
            'profile-screen': 'nav-profile'
        };

        const activeNavId = navMapping[screenId];
        if (activeNavId) {
            this.setActiveNavItem(activeNavId);
        }
    }

    setActiveNavItem(activeId) {
        // Remove active state from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('text-primary-400');
            item.classList.add('text-gray-400');
            const indicator = item.querySelector('.absolute');
            if (indicator) indicator.remove();
        });

        // Set active state
        const activeItem = document.getElementById(activeId);
        if (!activeItem) return;

        activeItem.classList.remove('text-gray-400');
        activeItem.classList.add('text-primary-400');
        
        // Add animated indicator
        const indicator = document.createElement('div');
        indicator.className = 'absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-aurora rounded-t-full';
        activeItem.appendChild(indicator);

        // Animate indicator
        gsap.fromTo(indicator, 
            { scaleX: 0, opacity: 0 },
            { scaleX: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
        );
    }

    // UI Update Functions
    updateEnergyMeter() {
        const meterProgress = document.getElementById('meter-progress');
        if (!meterProgress) return;

        const circumference = 2 * Math.PI * 80;
        const maxCapacity = 50; // kWh
        const currentBalance = this.energyData.currentBalance;
        const percentage = Math.min(currentBalance / maxCapacity, 1);
        const offset = circumference - (circumference * percentage);

        // Animate meter fill
        gsap.to(meterProgress, {
            strokeDashoffset: offset,
            duration: 2,
            ease: "power2.out"
        });

        // Update text values
        const valueText = document.querySelector('.energy-meter text');
        if (valueText) {
            gsap.to({ value: 0 }, {
                value: currentBalance,
                duration: 2,
                ease: "power2.out",
                onUpdate: function() {
                    valueText.textContent = this.targets()[0].value.toFixed(2);
                }
            });
        }

        // Update days remaining
        const daysLeft = Math.floor(currentBalance / this.energyData.dailyUsage);
        const daysElement = document.getElementById('days-left');
        if (daysElement) {
            daysElement.textContent = `${daysLeft} days`;
        }
    }

    updateDashboardCards() {
        // Update today's usage
        const usageCard = document.querySelector('[data-metric="usage"]');
        if (usageCard) {
            const usageValue = usageCard.querySelector('.text-2xl');
            const usageProgress = usageCard.querySelector('.progress-fill');
            const usagePercentage = (this.energyData.dailyUsage / 3.5) * 100; // Assuming 3.5 kWh daily average

            if (usageValue) usageValue.textContent = this.energyData.dailyUsage.toFixed(1);
            if (usageProgress) {
                gsap.to(usageProgress, {
                    width: `${Math.min(usagePercentage, 100)}%`,
                    duration: 1.5,
                    ease: "power2.out"
                });
            }
        }

        // Update budget card
        const budgetCard = document.querySelector('[data-metric="budget"]');
        if (budgetCard) {
            const budgetValue = budgetCard.querySelector('.text-2xl');
            const budgetProgress = budgetCard.querySelector('.progress-fill');
            const budgetUsed = this.energyData.monthlyBudget * 0.7; // 70% used
            const budgetPercentage = (budgetUsed / this.energyData.monthlyBudget) * 100;

            if (budgetValue) budgetValue.textContent = `$${this.energyData.monthlyBudget}`;
            if (budgetProgress) {
                gsap.to(budgetProgress, {
                    width: `${budgetPercentage}%`,
                    duration: 1.5,
                    ease: "power2.out"
                });
            }
        }
    }

    // Feature Functions
    openRechargeModal() {
        // Create recharge modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="enhanced-card w-full max-w-md p-6">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold text-white">Quick Recharge</h2>
                    <button class="close-modal w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <i class="fas fa-times text-gray-300"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Amount (ZWL)</label>
                        <div class="grid grid-cols-3 gap-2 mb-3">
                            <button class="amount-btn btn-secondary py-3 text-sm" data-amount="10">$10</button>
                            <button class="amount-btn btn-secondary py-3 text-sm" data-amount="20">$20</button>
                            <button class="amount-btn btn-secondary py-3 text-sm" data-amount="50">$50</button>
                        </div>
                        <input type="number" class="enhanced-input" placeholder="Custom amount" id="custom-amount">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
                        <div class="space-y-2">
                            <div class="payment-method enhanced-input cursor-pointer flex items-center p-3 border-primary-400" data-method="ecocash">
                                <i class="fas fa-mobile-alt text-primary-400 mr-3"></i>
                                <span>EcoCash</span>
                                <i class="fas fa-check ml-auto text-primary-400"></i>
                            </div>
                            <div class="payment-method enhanced-input cursor-pointer flex items-center p-3" data-method="onemoney">
                                <i class="fas fa-credit-card text-gray-400 mr-3"></i>
                                <span>OneMoney</span>
                            </div>
                        </div>
                    </div>
                    
                    <button class="btn-primary w-full py-4" id="proceed-payment">
                        <i class="fas fa-bolt mr-2"></i>
                        Proceed to Payment
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Animate in
        gsap.fromTo(modal, 
            { opacity: 0 },
            { opacity: 1, duration: 0.3 }
        );

        gsap.fromTo(modal.querySelector('.enhanced-card'), 
            { opacity: 0, scale: 0.9, y: 20 },
            { opacity: 1, scale: 1, y: 0, duration: 0.4, delay: 0.1 }
        );

        // Event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            this.closeModal(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal);
        });

        // Amount selection
        modal.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('btn-primary'));
                btn.classList.add('btn-primary');
                modal.querySelector('#custom-amount').value = btn.dataset.amount;
            });
        });

        // Payment method selection
        modal.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', () => {
                modal.querySelectorAll('.payment-method').forEach(m => {
                    m.classList.remove('border-primary-400');
                    m.querySelector('i:last-child').className = 'fas fa-circle ml-auto text-gray-400';
                });
                method.classList.add('border-primary-400');
                method.querySelector('i:last-child').className = 'fas fa-check ml-auto text-primary-400';
            });
        });

        // Proceed payment
        modal.querySelector('#proceed-payment').addEventListener('click', () => {
            this.processPayment(modal);
        });

        this.trackEvent('recharge_modal_opened');
    }

    closeModal(modal) {
        gsap.to(modal, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => modal.remove()
        });
    }

    processPayment(modal) {
        const amount = modal.querySelector('#custom-amount').value;
        const method = modal.querySelector('.payment-method.border-primary-400')?.dataset.method;

        if (!amount || !method) {
            this.showToast('Please select amount and payment method', 'error');
            return;
        }

        const btn = modal.querySelector('#proceed-payment');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<div class="loading-spinner mr-2"></div> Processing...';
        btn.disabled = true;

        // Simulate payment processing
        setTimeout(() => {
            this.closeModal(modal);
            this.showPaymentSuccess(amount);
            this.updateBalance(parseFloat(amount) * 2.1); // Rough conversion rate
            this.trackEvent('payment_completed', { amount, method });
        }, 3000);
    }

    showPaymentSuccess(amount) {
        const successModal = document.createElement('div');
        successModal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        successModal.innerHTML = `
            <div class="enhanced-card w-full max-w-md p-6 text-center">
                <div class="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-check text-3xl text-white"></i>
                </div>
                <h2 class="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
                <p class="text-gray-300 mb-6">Your electricity has been recharged</p>
                
                <div class="bg-gray-800/50 rounded-xl p-4 mb-6">
                    <div class="text-sm text-gray-400 mb-1">Token Generated</div>
                    <div class="font-mono text-lg text-white mb-2">2847-5619-3821-0947</div>
                    <button class="btn-secondary text-sm px-4 py-2" id="copy-token">
                        <i class="fas fa-copy mr-1"></i> Copy Token
                    </button>
                </div>
                
                <div class="flex justify-between text-sm mb-6">
                    <div>
                        <div class="text-gray-400">Amount</div>
                        <div class="text-white font-semibold">$${amount}</div>
                    </div>
                    <div>
                        <div class="text-gray-400">Units Added</div>
                        <div class="text-white font-semibold">${(amount * 2.1).toFixed(1)} kWh</div>
                    </div>
                </div>
                
                <button class="btn-primary w-full py-3" id="close-success">Continue</button>
            </div>
        `;

        document.body.appendChild(successModal);

        // Animate in
        gsap.fromTo(successModal, 
            { opacity: 0 },
            { opacity: 1, duration: 0.3 }
        );

        gsap.fromTo(successModal.querySelector('.enhanced-card'), 
            { opacity: 0, scale: 0.9, y: 20 },
            { opacity: 1, scale: 1, y: 0, duration: 0.4, delay: 0.1 }
        );

        // Event listeners
        successModal.querySelector('#copy-token').addEventListener('click', () => {
            navigator.clipboard.writeText('2847-5619-3821-0947');
            this.showToast('Token copied!', 'success');
        });

        successModal.querySelector('#close-success').addEventListener('click', () => {
            this.closeModal(successModal);
        });
    }

    updateBalance(additionalKWh) {
        this.energyData.currentBalance += additionalKWh;
        this.saveEnergyData();
        this.updateEnergyMeter();
        this.updateDashboardCards();
        
        // Show celebration animation
        this.showCelebration();
    }

    showCelebration() {
        // Create floating particles effect
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'fixed w-2 h-2 bg-gradient-aurora rounded-full pointer-events-none z-50';
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.top = window.innerHeight + 'px';
            
            document.body.appendChild(particle);

            gsap.to(particle, {
                y: -window.innerHeight - 100,
                x: (Math.random() - 0.5) * 200,
                rotation: 360,
                duration: 2 + Math.random() * 2,
                ease: "power1.out",
                onComplete: () => particle.remove()
            });

            gsap.to(particle, {
                opacity: 0,
                duration: 0.5,
                delay: 1.5 + Math.random() * 1
            });
        }
    }

    // Utility Functions
    validatePhone(phone) {
        // Simple Zimbabwe phone validation
        const phoneRegex = /^7[7-9]\d{7}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    shakeElement(element) {
        gsap.fromTo(element, 
            { x: 0 },
            { 
                x: [10, -10, 10, -10, 0],
                duration: 0.5,
                ease: "power2.inOut"
            }
        );
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };

        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${iconMap[type]} mr-3 text-lg"></i>
                <span class="font-medium">${message}</span>
            </div>
        `;

        const container = document.getElementById('toast-container');
        container.appendChild(toast);

        // Animate in
        gsap.fromTo(toast,
            { opacity: 0, y: 50, scale: 0.9 },
            { 
                opacity: 1, 
                y: 0, 
                scale: 1,
                duration: 0.4,
                ease: "back.out(1.7)"
            }
        );

        // Auto remove
        setTimeout(() => {
            gsap.to(toast, {
                opacity: 0,
                y: -30,
                scale: 0.9,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }
            });
        }, duration);
    }

    // Analytics and Tracking
    trackEvent(event, data = {}) {
        // Analytics tracking (integrate with your preferred analytics service)
        console.log('📊 Event tracked:', event, data);
        
        // Store events locally for offline analytics
        const events = JSON.parse(localStorage.getItem('ecowatt_events') || '[]');
        events.push({
            event,
            data,
            timestamp: Date.now(),
            version: this.version
        });
        
        // Keep only last 100 events
        if (events.length > 100) {
            events.splice(0, events.length - 100);
        }
        
        localStorage.setItem('ecowatt_events', JSON.stringify(events));
    }

    // Advanced Features
    setupOTPInputs() {
        const otpInputs = document.querySelectorAll('.otp-input');
        
        otpInputs.forEach((input, index) => {
            // Auto-advance on input
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // Only allow numbers
                if (!/^\d*$/.test(value)) {
                    e.target.value = value.replace(/\D/g, '');
                    return;
                }

                if (value.length === 1 && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
                
                this.checkOTPComplete();
            });

            // Handle backspace
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace') {
                    if (input.value === '' && index > 0) {
                        otpInputs[index - 1].focus();
                        otpInputs[index - 1].value = '';
                    }
                }
                
                // Handle paste
                if (e.ctrlKey && e.key === 'v') {
                    setTimeout(() => this.handleOTPPaste(input, index), 0);
                }
            });

            // Visual feedback
            input.addEventListener('focus', () => {
                gsap.to(input, {
                    scale: 1.05,
                    duration: 0.2,
                    ease: "power2.out"
                });
            });

            input.addEventListener('blur', () => {
                gsap.to(input, {
                    scale: 1,
                    duration: 0.2,
                    ease: "power2.out"
                });
            });
        });
    }

    handleOTPPaste(input, startIndex) {
        const pastedData = input.value;
        const otpInputs = document.querySelectorAll('.otp-input');
        
        // Distribute pasted digits across inputs
        for (let i = 0; i < pastedData.length && startIndex + i < otpInputs.length; i++) {
            if (/^\d$/.test(pastedData[i])) {
                otpInputs[startIndex + i].value = pastedData[i];
            }
        }
        
        // Clear the input that received the paste
        input.value = pastedData[0] || '';
        
        // Focus next empty input
        const nextEmpty = Array.from(otpInputs).find(inp => inp.value === '');
        if (nextEmpty) {
            nextEmpty.focus();
        } else {
            otpInputs[otpInputs.length - 1].focus();
        }
        
        this.checkOTPComplete();
    }

    checkOTPComplete() {
        const otpInputs = document.querySelectorAll('.otp-input');
        const verifyBtn = document.getElementById('verify-otp-btn');
        
        if (!verifyBtn) return;
        
        const allFilled = Array.from(otpInputs).every(input => input.value.length === 1);
        
        if (allFilled) {
            verifyBtn.disabled = false;
            verifyBtn.classList.remove('opacity-50');
            
            // Add visual feedback
            gsap.to(verifyBtn, {
                scale: 1.02,
                duration: 0.2,
                yoyo: true,
                repeat: 1,
                ease: "power2.inOut"
            });
        } else {
            verifyBtn.disabled = true;
            verifyBtn.classList.add('opacity-50');
        }
    }

    // Advanced Chart Loading
    loadCharts() {
        // Load Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => this.initializeCharts();
            document.head.appendChild(script);
        } else {
            this.initializeCharts();
        }
    }

    initializeCharts() {
        // Initialize dashboard mini charts
        this.createUsageTrendChart();
        this.createBudgetChart();
    }

    createUsageTrendChart() {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 40;
        canvas.className = 'w-full';

        // Add to usage card if exists
        const usageCard = document.querySelector('[data-metric="usage"]');
        if (usageCard) {
            const chartContainer = usageCard.querySelector('.chart-container') || 
                                 usageCard.appendChild(document.createElement('div'));
            chartContainer.className = 'chart-container mt-2';
            chartContainer.appendChild(canvas);

            // Sample data for the past 7 days
            const data = [1.1, 1.3, 0.9, 1.4, 1.2, 1.0, 1.2];
            
            new Chart(canvas, {
                type: 'line',
                data: {
                    labels: ['', '', '', '', '', '', ''],
                    datasets: [{
                        data: data,
                        borderColor: '#00FFFF',
                        backgroundColor: 'rgba(0, 255, 255, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    },
                    elements: {
                        point: { radius: 0 }
                    }
                }
            });
        }
    }

    // Error Handling
    handleError(error, context = '') {
        console.error(`EcoWatt Error ${context}:`, error);
        
        // Track errors
        this.trackEvent('error', {
            message: error.message,
            context,
            stack: error.stack?.substring(0, 500)
        });

        // Show user-friendly error message
        this.showToast('Something went wrong. Please try again.', 'error');
    }

    // Offline Data Sync
    async syncOfflineData() {
        if (!this.isOnline) return;

        try {
            const events = JSON.parse(localStorage.getItem('ecowatt_events') || '[]');
            const unsynced = events.filter(e => !e.synced);

            if (unsynced.length > 0) {
                // Simulate API sync
                console.log('Syncing offline data...', unsynced);
                
                // Mark as synced
                events.forEach(event => {
                    if (!event.synced) event.synced = true;
                });
                
                localStorage.setItem('ecowatt_events', JSON.stringify(events));
                this.showToast('Data synced successfully', 'success');
            }
        } catch (error) {
            this.handleError(error, 'sync');
        }
    }

    // Lifecycle Management
    updateUI() {
        // Update online/offline indicators
        const indicators = document.querySelectorAll('.online-indicator');
        indicators.forEach(indicator => {
            if (this.isOnline) {
                indicator.classList.remove('offline');
                indicator.classList.add('online');
            } else {
                indicator.classList.remove('online');
                indicator.classList.add('offline');
            }
        });
    }

    // Advanced Features
    showInstallPrompt() {
        // Check if user dismissed recently (within 7 days)
        const lastDismissed = localStorage.getItem('install_dismissed');
        if (lastDismissed && Date.now() - parseInt(lastDismissed) < 7 * 24 * 60 * 60 * 1000) {
            return;
        }

        document.getElementById('installPrompt').classList.remove('hidden');
        gsap.fromTo('#installPrompt', 
            { opacity: 0, y: -50 }, 
            { opacity: 1, y: 0, duration: 0.5 }
        );
    }

    hideInstallPrompt() {
        gsap.to('#installPrompt', {
            opacity: 0,
            y: -50,
            duration: 0.5,
            onComplete: () => {
                document.getElementById('installPrompt').classList.add('hidden');
            }
        });
    }
}

// Onboarding Management
window.nextOnboardingSlide = function() {
    if (window.ecoWattApp) {
        window.ecoWattApp.nextOnboardingSlide();
    }
};

window.prevOnboardingSlide = function() {
    if (window.ecoWattApp) {
        window.ecoWattApp.prevOnboardingSlide();
    }
};

window.completeOnboarding = function() {
    if (window.ecoWattApp) {
        window.ecoWattApp.completeOnboarding();
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 EcoWatt PWA v2.0.0 Initializing...');
    
    try {
        window.ecoWattApp = new EcoWattPWA();
        console.log('✅ EcoWatt PWA Initialized Successfully');
    } catch (error) {
        console.error('❌ Failed to initialize EcoWatt PWA:', error);
        
        // Fallback initialization
        document.body.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                    <h1 class="text-2xl font-bold mb-2">Loading Error</h1>
                    <p class="text-gray-300 mb-4">Please refresh the page to try again</p>
                    <button onclick="window.location.reload()" class="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-semibold">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
});

// Enhanced Mobile Optimizations
document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});

document.addEventListener('gesturechange', function (e) {
    e.preventDefault();
});

document.addEventListener('gestureend', function (e) {
    e.preventDefault();
});

// Prevent zoom on double tap
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Handle device orientation changes
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        window.scrollTo(0, 0);
        if (window.ecoWattApp) {
            window.ecoWattApp.updateUI();
        }
    }, 100);
});

// Performance monitoring
if ('performance' in window && 'navigation' in performance) {
    window.addEventListener('load', () => {
        const loadTime = performance.navigation.type === 0 ? 
                        performance.timing.loadEventEnd - performance.timing.navigationStart : 0;
        
        if (loadTime > 0) {
            console.log(`📊 Page loaded in ${loadTime}ms`);
            
            if (window.ecoWattApp) {
                window.ecoWattApp.trackEvent('performance', {
                    loadTime,
                    type: 'page_load'
                });
            }
        }
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EcoWattPWA;
}
