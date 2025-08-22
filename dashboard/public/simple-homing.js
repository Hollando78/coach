class SimpleHomingApp {
    constructor() {
        this.currentLocation = null;
        this.watchId = null;
        this.savedLocations = [];
        this.selectedLocationForDelete = null;
        this.selectedLocationForNav = null;
        
        // Device and sensor detection
        this.isMobile = this.detectMobileDevice();
        this.isIOS = this.detectIOS();
        this.isAndroid = this.detectAndroid();
        
        // Compass and orientation tracking
        this.deviceHeading = 0; // Current device heading in degrees
        this.targetBearing = 0; // Bearing to target location
        this.northUp = false; // Toggle for north-up vs device-up mode
        this.orientationSupported = false;
        this.lastOrientation = Date.now();
        
        // For smooth compass rotation transitions
        this.lastCompassRotation = 0;
        this.lastNeedleRotation = 0;
        
        // Portrait correction toggles
        this.portraitCorrectionEnabled = false;
        this.portraitCorrectionMinusEnabled = false;
        
        // Enhanced mobile sensors
        this.useAbsoluteOrientation = false;
        this.orientationAccuracy = null;
        this.compassCalibrationNeeded = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadSavedLocations();
        this.requestLocationPermission();
        this.initializeDeviceOrientation();
    }
    
    initializeElements() {
        // Status elements
        this.locationStatus = document.getElementById('locationStatus');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.accuracyInfo = document.getElementById('accuracyInfo');
        
        // Main content elements
        this.emptyState = document.getElementById('emptyState');
        this.locationsList = document.getElementById('locationsList');
        this.locationsContainer = document.getElementById('locationsContainer');
        this.locationsCount = document.getElementById('locationsCount');
        
        // Buttons
        this.addLocationBtn = document.getElementById('addLocationBtn');
        
        // Save location modal
        this.saveLocationModal = document.getElementById('saveLocationModal');
        this.closeSaveModal = document.getElementById('closeSaveModal');
        this.locationNameInput = document.getElementById('locationName');
        this.locationTypeSelect = document.getElementById('locationType');
        this.currentLat = document.getElementById('currentLat');
        this.currentLon = document.getElementById('currentLon');
        this.currentAccuracy = document.getElementById('currentAccuracy');
        this.cancelSave = document.getElementById('cancelSave');
        this.confirmSave = document.getElementById('confirmSave');
        
        // Navigation modal
        this.navigationModal = document.getElementById('navigationModal');
        this.closeNavModal = document.getElementById('closeNavModal');
        this.navLocationName = document.getElementById('navLocationName');
        this.navDistance = document.getElementById('navDistance');
        this.navRelativeBearing = document.getElementById('navRelativeBearing');
        this.compass = document.getElementById('compass');
        this.compassNeedle = document.getElementById('compassNeedle');
        this.compassRose = document.getElementById('compassRose');
        this.northUpToggle = document.getElementById('northUpToggle');
        this.portraitCorrectionToggle = document.getElementById('portraitCorrection');
        this.portraitCorrectionMinusToggle = document.getElementById('portraitCorrectionMinus');
        this.deviceHeadingDisplay = document.getElementById('deviceHeading');
        this.enableCompassBtn = document.getElementById('enableCompass');
        this.destCoordinates = document.getElementById('destCoordinates');
        this.openInMaps = document.getElementById('openInMaps');
        this.shareLocation = document.getElementById('shareLocation');
        
        // Debug element initialization
        console.log('Compass elements initialized:', {
            compass: !!this.compass,
            compassNeedle: !!this.compassNeedle,
            compassRose: !!this.compassRose,
            northUpToggle: !!this.northUpToggle,
            deviceHeadingDisplay: !!this.deviceHeadingDisplay
        });
        
        // Delete modal
        this.deleteModal = document.getElementById('deleteModal');
        this.closeDeleteModal = document.getElementById('closeDeleteModal');
        this.deleteLocationName = document.getElementById('deleteLocationName');
        this.cancelDelete = document.getElementById('cancelDelete');
        this.confirmDelete = document.getElementById('confirmDelete');
    }
    
    bindEvents() {
        // Add location button
        this.addLocationBtn.addEventListener('click', () => this.showSaveLocationModal());
        
        // Save location modal events
        this.closeSaveModal.addEventListener('click', () => this.hideSaveLocationModal());
        this.cancelSave.addEventListener('click', () => this.hideSaveLocationModal());
        this.confirmSave.addEventListener('click', () => this.saveCurrentLocation());
        this.locationNameInput.addEventListener('input', () => this.validateSaveForm());
        
        // Navigation modal events
        this.closeNavModal.addEventListener('click', () => this.hideNavigationModal());
        this.openInMaps.addEventListener('click', () => this.openInMapsApp());
        this.shareLocation.addEventListener('click', () => this.shareLocationInfo());
        this.northUpToggle.addEventListener('change', () => this.toggleNorthUp());
        this.portraitCorrectionToggle.addEventListener('change', () => this.togglePortraitCorrection());
        this.portraitCorrectionMinusToggle.addEventListener('change', () => this.togglePortraitCorrectionMinus());
        this.enableCompassBtn.addEventListener('click', () => this.requestOrientationPermission());
        
        // Delete modal events
        this.closeDeleteModal.addEventListener('click', () => this.hideDeleteModal());
        this.cancelDelete.addEventListener('click', () => this.hideDeleteModal());
        this.confirmDelete.addEventListener('click', () => this.deleteLocation());
        
        // Close modals when clicking outside
        [this.saveLocationModal, this.navigationModal, this.deleteModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAllModals();
                }
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }
    
    async requestLocationPermission() {
        if (!navigator.geolocation) {
            this.updateStatus('Location not supported', 'error');
            return;
        }

        // Request permission explicitly on modern browsers
        if ('permissions' in navigator) {
            try {
                const permission = await navigator.permissions.query({name: 'geolocation'});
                console.log('Geolocation permission status:', permission.state);
                
                if (permission.state === 'denied') {
                    this.updateStatus('Location permission denied', 'error');
                    return;
                }
            } catch (error) {
                console.log('Permission API not supported');
            }
        }

        this.updateStatus('Requesting location access...', 'pending');
        
        // Use enhanced options for mobile devices
        const options = this.isMobile ? {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000
        } : {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 60000
        };

        // Start watching position for continuous updates
        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handleLocationUpdate(position),
            (error) => this.handleLocationError(error),
            options
        );
    }
    
    startLocationTracking() {
        if (!navigator.geolocation) return;
        
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 1000
        };
        
        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handleLocationUpdate(position),
            (error) => this.handleLocationError(error),
            options
        );
    }
    
    handleLocationUpdate(position) {
        this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
        };
        
        this.updateStatus('Location active', 'active');
        this.updateAccuracyDisplay();
        this.updateCurrentLocationDisplay();
        this.updateDistances();
        this.enableAddButton();
        
        if (this.selectedLocationForNav) {
            this.updateNavigationInfo();
        }
    }
    
    handleLocationError(error) {
        let message = 'Location error';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location permission denied';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location unavailable';
                break;
            case error.TIMEOUT:
                message = 'Location timeout';
                break;
        }
        
        this.updateStatus(message, 'error');
        console.error('Location error:', error);
    }
    
    updateStatus(text, type = 'pending') {
        this.statusText.textContent = text;
        this.statusIndicator.className = `status-indicator ${type}`;
    }
    
    updateAccuracyDisplay() {
        if (this.currentLocation) {
            const accuracy = Math.round(this.currentLocation.accuracy);
            this.accuracyInfo.textContent = `±${accuracy}m`;
            this.accuracyInfo.className = `accuracy ${accuracy < 10 ? 'good' : ''}`;
        }
    }
    
    updateCurrentLocationDisplay() {
        if (this.currentLocation) {
            this.currentLat.textContent = this.currentLocation.latitude.toFixed(6);
            this.currentLon.textContent = this.currentLocation.longitude.toFixed(6);
            this.currentAccuracy.textContent = `±${Math.round(this.currentLocation.accuracy)} meters`;
        }
    }
    
    enableAddButton() {
        this.addLocationBtn.disabled = false;
    }
    
    showSaveLocationModal() {
        if (!this.currentLocation) {
            alert('Please wait for location to be available');
            return;
        }
        
        this.locationNameInput.value = '';
        this.locationTypeSelect.value = 'other';
        this.updateCurrentLocationDisplay();
        this.validateSaveForm();
        this.saveLocationModal.classList.remove('hidden');
        this.locationNameInput.focus();
    }
    
    hideSaveLocationModal() {
        this.saveLocationModal.classList.add('hidden');
    }
    
    validateSaveForm() {
        const hasName = this.locationNameInput.value.trim().length > 0;
        const hasLocation = this.currentLocation !== null;
        this.confirmSave.disabled = !hasName || !hasLocation;
    }
    
    saveCurrentLocation() {
        if (!this.currentLocation || !this.locationNameInput.value.trim()) {
            return;
        }
        
        const newLocation = {
            id: Date.now(),
            name: this.locationNameInput.value.trim(),
            type: this.locationTypeSelect.value,
            latitude: this.currentLocation.latitude,
            longitude: this.currentLocation.longitude,
            timestamp: new Date(),
            accuracy: this.currentLocation.accuracy
        };
        
        this.savedLocations.unshift(newLocation);
        this.saveSavedLocations();
        this.renderLocations();
        this.hideSaveLocationModal();
        
        // Show success feedback
        this.updateStatus('Location saved successfully', 'active');
        setTimeout(() => {
            if (this.currentLocation) {
                this.updateStatus('Location active', 'active');
            }
        }, 2000);
    }
    
    loadSavedLocations() {
        try {
            const saved = localStorage.getItem('simpleHomingLocations');
            if (saved) {
                this.savedLocations = JSON.parse(saved).map(loc => ({
                    ...loc,
                    timestamp: new Date(loc.timestamp)
                }));
            }
        } catch (error) {
            console.error('Error loading saved locations:', error);
            this.savedLocations = [];
        }
        
        this.renderLocations();
    }
    
    saveSavedLocations() {
        try {
            localStorage.setItem('simpleHomingLocations', JSON.stringify(this.savedLocations));
        } catch (error) {
            console.error('Error saving locations:', error);
        }
    }
    
    renderLocations() {
        if (this.savedLocations.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.locationsList.classList.add('hidden');
            return;
        }
        
        this.emptyState.classList.add('hidden');
        this.locationsList.classList.remove('hidden');
        
        this.locationsCount.textContent = `${this.savedLocations.length} location${this.savedLocations.length === 1 ? '' : 's'}`;
        
        this.locationsContainer.innerHTML = this.savedLocations.map(location => 
            this.createLocationItemHTML(location)
        ).join('');
        
        // Bind event listeners for the new items
        this.bindLocationItemEvents();
        this.updateDistances();
    }
    
    createLocationItemHTML(location) {
        const typeIcons = {
            home: '🏠', work: '💼', restaurant: '🍽️', shop: '🛒',
            hospital: '🏥', school: '🎓', gas: '⛽', other: '📍'
        };
        
        const typeIcon = typeIcons[location.type] || '📍';
        const formattedDate = this.formatDate(location.timestamp);
        
        return `
            <div class="location-item" data-id="${location.id}">
                <div class="location-header">
                    <div class="location-main">
                        <div class="location-type-icon">${typeIcon}</div>
                        <div class="location-info">
                            <h3>${this.escapeHtml(location.name)}</h3>
                            <div class="location-meta">
                                <span>${location.type.charAt(0).toUpperCase() + location.type.slice(1)}</span>
                                <span>•</span>
                                <span>${formattedDate}</span>
                            </div>
                        </div>
                    </div>
                    <div class="location-distance" id="distance-${location.id}">
                        <div class="distance-value">-</div>
                        <div class="distance-label">away</div>
                    </div>
                </div>
                <div class="location-actions">
                    <button class="action-btn navigate-btn" data-action="navigate" data-id="${location.id}">
                        🧭 Navigate
                    </button>
                    <button class="action-btn delete-btn" data-action="delete" data-id="${location.id}">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }
    
    bindLocationItemEvents() {
        // Handle action buttons
        this.locationsContainer.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.action-btn');
            if (!actionBtn) return;
            
            const action = actionBtn.dataset.action;
            const locationId = parseInt(actionBtn.dataset.id);
            const location = this.savedLocations.find(loc => loc.id === locationId);
            
            if (!location) return;
            
            switch (action) {
                case 'navigate':
                    this.showNavigationModal(location);
                    break;
                case 'delete':
                    this.showDeleteModal(location);
                    break;
            }
        });
        
        // Handle location item clicks for quick navigation
        this.locationsContainer.addEventListener('click', (e) => {
            const locationItem = e.target.closest('.location-item');
            const actionBtn = e.target.closest('.action-btn');
            
            if (locationItem && !actionBtn) {
                const locationId = parseInt(locationItem.dataset.id);
                const location = this.savedLocations.find(loc => loc.id === locationId);
                if (location) {
                    this.showNavigationModal(location);
                }
            }
        });
    }
    
    updateDistances() {
        if (!this.currentLocation) return;
        
        this.savedLocations.forEach(location => {
            const distance = this.calculateDistance(
                this.currentLocation.latitude,
                this.currentLocation.longitude,
                location.latitude,
                location.longitude
            );
            
            const distanceElement = document.getElementById(`distance-${location.id}`);
            if (distanceElement) {
                const distanceValue = distanceElement.querySelector('.distance-value');
                if (distanceValue) {
                    distanceValue.textContent = this.formatDistance(distance);
                }
            }
        });
    }
    
    showNavigationModal(location) {
        this.selectedLocationForNav = location;
        this.navLocationName.textContent = location.name;
        this.destCoordinates.textContent = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
        
        // Re-initialize compass elements (in case they weren't available during init)
        if (!this.compassRose) {
            this.compassRose = document.getElementById('compassRose');
            console.log('Re-initialized compassRose:', !!this.compassRose);
        }
        if (!this.compassNeedle) {
            this.compassNeedle = document.getElementById('compassNeedle');
            console.log('Re-initialized compassNeedle:', !!this.compassNeedle);
        }
        if (!this.deviceHeadingDisplay) {
            this.deviceHeadingDisplay = document.getElementById('deviceHeading');
            console.log('Re-initialized deviceHeadingDisplay:', !!this.deviceHeadingDisplay);
        }
        if (!this.northUpToggle) {
            this.northUpToggle = document.getElementById('northUpToggle');
            console.log('Re-initialized northUpToggle:', !!this.northUpToggle);
        }
        
        // Load north-up preference
        const savedNorthUp = localStorage.getItem('simpleHoming_northUp');
        if (savedNorthUp !== null) {
            this.northUp = savedNorthUp === 'true';
        }
        if (this.northUpToggle) {
            this.northUpToggle.checked = this.northUp;
        }
        
        // Load portrait correction preferences
        const savedPortraitCorrection = localStorage.getItem('simpleHoming_portraitCorrection');
        if (savedPortraitCorrection !== null) {
            this.portraitCorrectionEnabled = savedPortraitCorrection === 'true';
        }
        if (this.portraitCorrectionToggle) {
            this.portraitCorrectionToggle.checked = this.portraitCorrectionEnabled;
        }
        
        const savedPortraitCorrectionMinus = localStorage.getItem('simpleHoming_portraitCorrectionMinus');
        if (savedPortraitCorrectionMinus !== null) {
            this.portraitCorrectionMinusEnabled = savedPortraitCorrectionMinus === 'true';
        }
        if (this.portraitCorrectionMinusToggle) {
            this.portraitCorrectionMinusToggle.checked = this.portraitCorrectionMinusEnabled;
        }
        
        this.updateNavigationInfo();
        this.navigationModal.classList.remove('hidden');
        
        // Lock screen orientation to portrait for compass accuracy
        this.lockScreenOrientation();
        
        // Update device heading display with initial state and show enable button for iOS
        if (this.deviceHeadingDisplay) {
            if (this.isIOS && typeof DeviceOrientationEvent.requestPermission === 'function') {
                this.deviceHeadingDisplay.textContent = 'Tap button below';
                if (this.enableCompassBtn) {
                    this.enableCompassBtn.style.display = 'block';
                    this.enableCompassBtn.textContent = 'Enable Compass';
                }
            } else if (this.orientationSupported) {
                this.deviceHeadingDisplay.textContent = 'Initializing...';
            } else {
                this.deviceHeadingDisplay.textContent = 'Not available';
            }
        }
        
        // Start updating navigation info periodically
        this.navigationUpdateInterval = setInterval(() => {
            this.updateNavigationInfo();
        }, 1000);
    }
    
    hideNavigationModal() {
        this.navigationModal.classList.add('hidden');
        this.selectedLocationForNav = null;
        
        if (this.navigationUpdateInterval) {
            clearInterval(this.navigationUpdateInterval);
        }
        
        // Unlock screen orientation when leaving navigation
        this.unlockScreenOrientation();
    }
    
    updateNavigationInfo() {
        if (!this.currentLocation || !this.selectedLocationForNav) return;
        
        const distance = this.calculateDistance(
            this.currentLocation.latitude,
            this.currentLocation.longitude,
            this.selectedLocationForNav.latitude,
            this.selectedLocationForNav.longitude
        );
        
        const bearing = this.calculateBearing(
            this.currentLocation.latitude,
            this.currentLocation.longitude,
            this.selectedLocationForNav.latitude,
            this.selectedLocationForNav.longitude
        );
        
        this.targetBearing = bearing;
        
        console.log(`Navigation Update - Distance: ${distance.toFixed(1)}m, Target Bearing: ${bearing.toFixed(1)}°`);
        
        this.navDistance.textContent = this.formatDistance(distance);
        
        // Update compass display with new dynamic system
        this.updateCompassDisplay();
    }
    
    showDeleteModal(location) {
        this.selectedLocationForDelete = location;
        this.deleteLocationName.textContent = location.name;
        this.deleteModal.classList.remove('hidden');
    }
    
    hideDeleteModal() {
        this.deleteModal.classList.add('hidden');
        this.selectedLocationForDelete = null;
    }
    
    deleteLocation() {
        if (!this.selectedLocationForDelete) return;
        
        this.savedLocations = this.savedLocations.filter(
            loc => loc.id !== this.selectedLocationForDelete.id
        );
        
        this.saveSavedLocations();
        this.renderLocations();
        this.hideDeleteModal();
        
        // Show feedback
        this.updateStatus('Location deleted', 'active');
        setTimeout(() => {
            if (this.currentLocation) {
                this.updateStatus('Location active', 'active');
            }
        }, 2000);
    }
    
    openInMapsApp() {
        if (!this.selectedLocationForNav) return;
        
        const { latitude, longitude, name } = this.selectedLocationForNav;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_name=${encodeURIComponent(name)}`;
        
        window.open(url, '_blank');
    }
    
    async shareLocationInfo() {
        if (!this.selectedLocationForNav) return;
        
        const { latitude, longitude, name } = this.selectedLocationForNav;
        const shareText = `📍 ${name}\nLocation: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\nView on maps: https://www.google.com/maps?q=${latitude},${longitude}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Location: ${name}`,
                    text: shareText
                });
            } catch (error) {
                console.error('Error sharing:', error);
                this.copyToClipboard(shareText);
            }
        } else {
            this.copyToClipboard(shareText);
        }
    }
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            alert('Location info copied to clipboard!');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            alert('Could not copy to clipboard');
        }
    }
    
    hideAllModals() {
        this.hideSaveLocationModal();
        this.hideNavigationModal();
        this.hideDeleteModal();
    }
    
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = this.degreesToRadians(lat2 - lat1);
        const dLon = this.degreesToRadians(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    calculateBearing(lat1, lon1, lat2, lon2) {
        const dLon = this.degreesToRadians(lon2 - lon1);
        const lat1Rad = this.degreesToRadians(lat1);
        const lat2Rad = this.degreesToRadians(lat2);
        
        const y = Math.sin(dLon) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
        
        const bearingRad = Math.atan2(y, x);
        const bearingDeg = this.radiansToDegrees(bearingRad);
        
        return (bearingDeg + 360) % 360;
    }
    
    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    radiansToDegrees(radians) {
        return radians * (180 / Math.PI);
    }
    
    formatDistance(distance) {
        if (distance < 1000) {
            return `${Math.round(distance)}m`;
        } else {
            return `${(distance / 1000).toFixed(1)}km`;
        }
    }
    
    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
    
    // Device Detection Methods
    
    detectMobileDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const hasMotionSensors = 'DeviceOrientationEvent' in window || 'DeviceMotionEvent' in window;
        
        return isMobileUserAgent || (isTouchDevice && hasMotionSensors);
    }
    
    detectIOS() {
        const userAgent = navigator.userAgent.toLowerCase();
        return /ipad|iphone|ipod/.test(userAgent) && !window.MSStream;
    }
    
    detectAndroid() {
        const userAgent = navigator.userAgent.toLowerCase();
        return userAgent.indexOf('android') > -1;
    }
    
    // Enhanced Geolocation for Mobile - methods moved to main requestLocationPermission above
    
    // Device Orientation and Compass Methods
    
    initializeDeviceOrientation() {
        console.log(`Device detection - Mobile: ${this.isMobile}, iOS: ${this.isIOS}, Android: ${this.isAndroid}`);
        
        // Try to initialize orientation on all devices (mobile and desktop)
        if ('DeviceOrientationEvent' in window) {
            console.log('DeviceOrientationEvent supported - attempting to use real sensors');
            
            // iOS 13+ requires explicit permission
            if (this.isIOS && typeof DeviceOrientationEvent.requestPermission === 'function') {
                console.log('iOS device - permission required for compass access');
                this.orientationSupported = false; // Will be set to true after permission granted
            } else {
                console.log('Starting orientation tracking for this device');
                this.startOrientationTracking();
            }
        } else if ('DeviceMotionEvent' in window) {
            console.log('DeviceMotionEvent supported as fallback');
            this.startMotionTracking();
        } else {
            console.log('No device sensors available - compass will show static display');
            this.orientationSupported = false;
        }
    }
    
    // Screen Orientation Management
    
    async lockScreenOrientation() {
        try {
            // Lock to portrait orientation for accurate compass readings
            if (screen.orientation && screen.orientation.lock) {
                console.log('Locking screen orientation to portrait');
                await screen.orientation.lock('portrait');
            } else if (screen.lockOrientation) {
                // Fallback for older browsers
                screen.lockOrientation('portrait');
            } else if (screen.mozLockOrientation) {
                // Firefox fallback
                screen.mozLockOrientation('portrait');
            } else if (screen.msLockOrientation) {
                // IE/Edge fallback
                screen.msLockOrientation('portrait');
            } else {
                console.log('Screen orientation lock not supported');
            }
        } catch (error) {
            console.log('Failed to lock screen orientation:', error);
        }
    }
    
    unlockScreenOrientation() {
        try {
            if (screen.orientation && screen.orientation.unlock) {
                console.log('Unlocking screen orientation');
                screen.orientation.unlock();
            } else if (screen.unlockOrientation) {
                screen.unlockOrientation();
            } else if (screen.mozUnlockOrientation) {
                screen.mozUnlockOrientation();
            } else if (screen.msUnlockOrientation) {
                screen.msUnlockOrientation();
            }
        } catch (error) {
            console.log('Failed to unlock screen orientation:', error);
        }
    }
    
    // Demo mode removed - app now uses real device sensors
    
    async requestOrientationPermission() {
        try {
            console.log('Requesting iOS device orientation permission...');
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                console.log('iOS permission granted - starting orientation tracking');
                this.orientationSupported = true;
                this.startOrientationTracking();
                
                // Update display to show we're now active
                if (this.deviceHeadingDisplay) {
                    this.deviceHeadingDisplay.textContent = 'Initializing compass...';
                }
                // Hide the enable button
                if (this.enableCompassBtn) {
                    this.enableCompassBtn.style.display = 'none';
                }
            } else {
                console.log('Device orientation permission denied');
                this.orientationSupported = false;
                if (this.deviceHeadingDisplay) {
                    this.deviceHeadingDisplay.textContent = 'Permission denied';
                }
            }
        } catch (error) {
            console.error('Error requesting orientation permission:', error);
            // Fallback for older iOS versions or non-iOS devices
            this.orientationSupported = true;
            this.startOrientationTracking();
        }
    }
    
    startOrientationTracking() {
        this.orientationSupported = true;
        
        // Try absolute orientation first (provides true compass heading)
        if ('ondeviceorientationabsolute' in window) {
            console.log('Using deviceorientationabsolute (true compass)');
            this.useAbsoluteOrientation = true;
            window.addEventListener('deviceorientationabsolute', (event) => {
                this.handleOrientationChange(event, true);
            }, true);
        } else {
            console.log('Using deviceorientation (relative)');
            this.useAbsoluteOrientation = false;
            window.addEventListener('deviceorientation', (event) => {
                this.handleOrientationChange(event, false);
            }, true);
        }
        
        // Add calibration detection for better compass accuracy
        if (this.isAndroid) {
            this.detectCompassCalibration();
        }
    }
    
    startMotionTracking() {
        console.log('Using DeviceMotionEvent as fallback');
        this.orientationSupported = true;
        
        window.addEventListener('devicemotion', (event) => {
            this.handleMotionChange(event);
        }, true);
    }
    
    detectCompassCalibration() {
        // Monitor compass accuracy for Android devices
        setTimeout(() => {
            if (this.orientationAccuracy === null) {
                this.compassCalibrationNeeded = true;
                console.log('Compass may need calibration - accuracy unknown');
            }
        }, 5000);
    }
    
    handleOrientationChange(event, isAbsolute = false) {
        // Throttle updates for performance
        const now = Date.now();
        if (now - this.lastOrientation < 100) return; // 10fps for smooth updates
        this.lastOrientation = now;
        
        let compass = null;
        let accuracy = null;
        
        // iOS: Use webkitCompassHeading for true compass (magnetic north)
        if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
            console.log('iOS: Using webkitCompassHeading');
            compass = event.webkitCompassHeading;
            accuracy = event.webkitCompassAccuracy || null;
            this.useAbsoluteOrientation = true;
            this.sensorType = 'webkitCompass';
        }
        // Android: Use alpha from deviceorientationabsolute event
        else if (isAbsolute && event.alpha !== null) {
            console.log('Android: Using absolute alpha');
            compass = event.alpha;
            accuracy = event.webkitCompassAccuracy || null;
            this.useAbsoluteOrientation = true;
            this.sensorType = 'absoluteAlpha';
        }
        // Fallback: Use regular alpha (relative to page load direction)
        else if (event.alpha !== null) {
            console.log('Fallback: Using relative alpha');
            compass = event.alpha;
            this.useAbsoluteOrientation = false;
            this.sensorType = 'relativeAlpha';
        }
        
        if (compass !== null) {
            // Store raw value for debugging
            const rawCompass = compass;
            
            // Normalize to 0-360 range
            compass = ((compass % 360) + 360) % 360;
            
            // Apply corrections based on toggle states
            if (this.portraitCorrectionEnabled) {
                compass = (compass + 90) % 360;
            } else if (this.portraitCorrectionMinusEnabled) {
                compass = (compass - 90 + 360) % 360;
            }
            
            console.log(`Sensor: ${this.sensorType}, Raw: ${rawCompass}°, Alpha: ${event.alpha}°, webkitCompass: ${event.webkitCompassHeading}°, Final: ${compass}°`);
            
            this.deviceHeading = compass;
            this.orientationAccuracy = accuracy;
            this.compassCalibrationNeeded = accuracy !== null && accuracy > 15;
            
            // Update compass display if navigation is active
            if (this.selectedLocationForNav && !this.navigationModal.classList.contains('hidden')) {
                this.updateCompassDisplay();
            }
            
            // Update device heading display
            if (this.deviceHeadingDisplay) {
                let displayText = `${Math.round(compass)}°`;
                
                if (this.compassCalibrationNeeded) {
                    displayText += ' ⚠️'; // Calibration needed
                } else if (this.useAbsoluteOrientation) {
                    displayText += ' ✓'; // True compass
                } else {
                    displayText += ' ~'; // Relative compass
                }
                
                this.deviceHeadingDisplay.textContent = displayText;
            }
        } else {
            console.log('No compass data available');
        }
    }
    
    handleMotionChange(event) {
        // Fallback using device motion for compass
        const now = Date.now();
        if (now - this.lastOrientation < 100) return;
        this.lastOrientation = now;
        
        // Try to extract heading from rotation rate or acceleration
        if (event.rotationRate && event.rotationRate.alpha !== null) {
            // Use rotation rate to estimate heading change
            const rotationAlpha = event.rotationRate.alpha;
            this.deviceHeading = (this.deviceHeading + rotationAlpha * 0.1) % 360;
            
            if (this.deviceHeadingDisplay) {
                this.deviceHeadingDisplay.textContent = `${Math.round(this.deviceHeading)}° (est)`;
            }
            
            if (this.selectedLocationForNav && !this.navigationModal.classList.contains('hidden')) {
                this.updateCompassDisplay();
            }
        }
    }
    
    toggleNorthUp() {
        this.northUp = this.northUpToggle.checked;
        console.log('Toggle changed - North Up:', this.northUp);
        
        // Immediately update compass if navigation is active
        if (this.selectedLocationForNav && !this.navigationModal.classList.contains('hidden')) {
            this.updateCompassDisplay();
        }
        
        // Save preference to localStorage
        localStorage.setItem('simpleHoming_northUp', this.northUp.toString());
    }
    
    togglePortraitCorrection() {
        this.portraitCorrectionEnabled = this.portraitCorrectionToggle.checked;
        
        // Ensure only one correction is active at a time
        if (this.portraitCorrectionEnabled && this.portraitCorrectionMinusEnabled) {
            this.portraitCorrectionMinusEnabled = false;
            this.portraitCorrectionMinusToggle.checked = false;
        }
        
        console.log('+90° Correction changed:', this.portraitCorrectionEnabled);
        
        // Immediately update compass if navigation is active
        if (this.selectedLocationForNav && !this.navigationModal.classList.contains('hidden')) {
            this.updateCompassDisplay();
        }
        
        // Save preference to localStorage
        localStorage.setItem('simpleHoming_portraitCorrection', this.portraitCorrectionEnabled.toString());
    }
    
    togglePortraitCorrectionMinus() {
        this.portraitCorrectionMinusEnabled = this.portraitCorrectionMinusToggle.checked;
        
        // Ensure only one correction is active at a time
        if (this.portraitCorrectionMinusEnabled && this.portraitCorrectionEnabled) {
            this.portraitCorrectionEnabled = false;
            this.portraitCorrectionToggle.checked = false;
        }
        
        console.log('-90° Correction changed:', this.portraitCorrectionMinusEnabled);
        
        // Immediately update compass if navigation is active
        if (this.selectedLocationForNav && !this.navigationModal.classList.contains('hidden')) {
            this.updateCompassDisplay();
        }
        
        // Save preference to localStorage
        localStorage.setItem('simpleHoming_portraitCorrectionMinus', this.portraitCorrectionMinusEnabled.toString());
    }
    
    // Helper function to smooth angle transitions across 0°/360° boundary
    smoothAngleTransition(newAngle, lastAngle) {
        // Calculate the difference between angles
        let diff = newAngle - lastAngle;
        
        // Handle wrap-around at 0°/360°
        if (diff > 180) {
            diff -= 360;
        } else if (diff < -180) {
            diff += 360;
        }
        
        // Return the smoothed angle
        return lastAngle + diff;
    }

    updateCompassDisplay() {
        if (!this.compass || !this.compassNeedle || !this.compassRose) {
            console.log('Missing compass elements:', { 
                compass: !!this.compass, 
                needle: !!this.compassNeedle,
                rose: !!this.compassRose 
            });
            return;
        }
        
        let compassRotation = 0;
        let needleRotation = 0;
        
        if (this.northUp) {
            // North-up mode: compass rose stays fixed, needle points to target bearing
            compassRotation = 0;
            needleRotation = this.targetBearing;
        } else {
            // Dynamic mode: compass rotates to show device heading at top
            compassRotation = -this.deviceHeading;
            // Needle points to target bearing relative to the fixed compass rose
            // When target bearing = device heading, needle should be at top (0°)
            needleRotation = this.targetBearing;
        }
        
        // Apply smooth transitions to handle 0°/360° boundary
        const smoothCompassRotation = this.smoothAngleTransition(compassRotation, this.lastCompassRotation);
        const smoothNeedleRotation = this.smoothAngleTransition(needleRotation, this.lastNeedleRotation);
        
        // Apply rotations with smooth CSS transitions
        this.compassRose.style.transform = `rotate(${smoothCompassRotation}deg)`;
        this.compassRose.style.transition = 'transform 0.2s ease-out';
        
        this.compassNeedle.style.transform = `translate(-50%, -100%) rotate(${smoothNeedleRotation}deg)`;
        this.compassNeedle.style.transition = 'transform 0.2s ease-out';
        
        // Store values for next smooth transition
        this.lastCompassRotation = smoothCompassRotation;
        this.lastNeedleRotation = smoothNeedleRotation;
        
        // Update relative bearing (direction to target relative to device heading)
        if (this.navRelativeBearing) {
            const relativeBearing = ((this.targetBearing - this.deviceHeading + 360) % 360);
            this.navRelativeBearing.textContent = `${Math.round(relativeBearing)}°`;
        }
        
        console.log(`Compass Display - Device: ${Math.round(this.deviceHeading)}°, Target: ${Math.round(this.targetBearing)}°, NorthUp: ${this.northUp}, CompassRot: ${Math.round(smoothCompassRotation)}°, NeedleRot: ${Math.round(smoothNeedleRotation)}°`);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SimpleHomingApp();
});