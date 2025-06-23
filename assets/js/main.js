// EcoWatt PWA - Simplified Working Version
console.log('🚀 EcoWatt PWA Starting...');

// Simple App Class
class EcoWattApp {
    constructor() {
        this.currentScreen = 'splash';
        this.currentSlide = 0;
        this.isFirstTime = !localStorage.getItem('ecowatt_onboarded');
        console.log('✅ EcoWatt App Initialized');
        this.init();
    }

    init() {
        console.log('🔧 Initializing app components...');
        this.setupSplashScreen();
        this.setupEventListeners();
        this.checkFirstTime();
    }

    setupSplashScreen() {
        console.log('🎬 Setting up splash screen...');
        const splash = document.getElementById('splashScreen');
        if (splash) {
            setTimeout(() => {
                splash.style.opacity = '0';
                setTimeout(() => {
                    splash.style.display = 'none';
                    this.checkFirstTime();
                }, 800);
            }, 2000);
        } else {
            console.log('⚠️ Splash screen not found, skipping...');
            this.checkFirstTime();
        }
    }

    checkFirstTime() {
        console.log('🔍 Checking first time user...');
        if (this.isFirstTime) {
            this.showOnboarding();
        } else {
            this.showScreen('home-screen');
        }
    }

    showOnboarding() {
        console.log('👋 Showing onboarding...');
        const onboarding = document.getElementById('onboarding-container');
        if (onboarding) {
            onboarding.style.display = 'flex';
        }
    }

    showScreen(screenId) {
        console.log('📱 Showing screen:', screenId);
        
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });

        // Hide onboarding
        const onboarding = document.getElementById('onboarding-container');
        if (onboarding) {
            onboarding.style.display = 'none';
        }

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.style.display = 'block';
            targetScreen.classList.add('active');
        } else {
            console.error('❌ Screen not found:', screenId);
        }

        this.currentScreen = screenId;
    }

    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');
        
        // Auth flow
        const sendOtpBtn = document.getElementById('send-otp-btn');
        if (sendOtpBtn) {
            sendOtpBtn.addEventListener('click', () => {
                console.log('📱 Send OTP clicked');
                this.showScreen('otp-screen');
            });
        }

        const verifyOtpBtn = document.getElementById('verify-otp-btn');
        if (verifyOtpBtn) {
            verifyOtpBtn.addEventListener('click', () => {
                console.log('✅ Verify OTP clicked');
                localStorage.setItem('ecowatt_onboarded', 'true');
                this.showScreen('home-screen');
            });
        }

        // Navigation
        const navHome = document.getElementById('nav-home');
        if (navHome) {
            navHome.addEventListener('click', () => {
                console.log('🏠 Home navigation clicked');
                this.showScreen('home-screen');
                this.setActiveNavItem('nav-home');
            });
        }

        // Quick actions
        const rechargeBtn = document.getElementById('show-recharge-btn');
        if (rechargeBtn) {
            rechargeBtn.addEventListener('click', () => {
                console.log('⚡ Recharge button clicked');
                this.showToast('Recharge feature coming soon!');
            });
        }

        // OTP inputs
        this.setupOTPInputs();
    }

    setupOTPInputs() {
        const otpInputs = document.querySelectorAll('.otp-input');
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });
        });
    }

    setActiveNavItem(activeId) {
        console.log('🧭 Setting active nav item:', activeId);
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('text-primary-400');
            item.classList.add('text-gray-400');
        });

        const activeItem = document.getElementById(activeId);
        if (activeItem) {
            activeItem.classList.remove('text-gray-400');
            activeItem.classList.add('text-primary-400');
        }
    }

    showToast(message) {
        console.log('🍞 Toast:', message);
        // Simple alert for now
        alert(message);
    }
}

// Global functions for onboarding
let currentSlide = 0;

window.nextOnboardingSlide = function() {
    console.log('➡️ Next slide');
    if (currentSlide < 2) {
        const slides = document.querySelectorAll('.onboarding-slide');
        slides[currentSlide].classList.remove('active');
        currentSlide++;
        slides[currentSlide].classList.add('active');
    }
};

window.prevOnboardingSlide = function() {
    console.log('⬅️ Previous slide');
    if (currentSlide > 0) {
        const slides = document.querySelectorAll('.onboarding-slide');
        slides[currentSlide].classList.remove('active');
        currentSlide--;
        slides[currentSlide].classList.add('active');
    }
};

window.completeOnboarding = function() {
    console.log('🎉 Onboarding completed');
    localStorage.setItem('ecowatt_onboarded', 'true');
    if (window.ecoWattApp) {
        window.ecoWattApp.showScreen('auth-screen');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Starting EcoWatt PWA...');
    
    try {
        // Initialize AOS if available
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-out',
                once: true
            });
            console.log('✅ AOS animations initialized');
        }

        // Initialize app
        window.ecoWattApp = new EcoWattApp();
        console.log('✅ EcoWatt PWA Initialized Successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize EcoWatt PWA:', error);
        
        // Fallback: Show basic error message
        document.body.innerHTML = `
            <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0F0F23; color: white; font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                <div>
                    <h1 style="color: #00FFFF; margin-bottom: 20px;">⚡ EcoWatt</h1>
                    <p style="margin-bottom: 20px;">Loading issue detected. The app is being optimized...</p>
                    <button onclick="window.location.reload()" style="background: #0C6B3C; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                        🔄 Reload App
                    </button>
                </div>
            </div>
        `;
    }
});

// Prevent zoom on mobile
document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});

console.log('📝 EcoWatt main.js loaded successfully');
