// Magic Palm Reader JavaScript
class PalmReader {
    constructor() {
        this.currentScreen = 'welcome';
        this.userData = {
            name: '',
            age: 25,
            hand: '',
            tracedLines: [],
            palmPhoto: null
        };
        this.cameraStream = null;
        this.hasPhoto = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeCanvas();
    }

    bindEvents() {
        // Welcome screen
        document.getElementById('startBtn').addEventListener('click', () => {
            this.showScreen('setup');
        });

        // Setup screen
        document.getElementById('nameInput').addEventListener('input', (e) => {
            this.userData.name = e.target.value.trim();
            this.updateNextButton();
        });

        document.getElementById('ageSlider').addEventListener('input', (e) => {
            this.userData.age = parseInt(e.target.value);
            document.getElementById('ageDisplay').textContent = this.userData.age;
        });

        document.querySelectorAll('.hand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.hand-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.userData.hand = btn.dataset.hand;
                this.updateNextButton();
            });
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.setupPhotoScreen();
            this.showScreen('tracing');
        });

        // Photo screen
        document.getElementById('startCameraBtn').addEventListener('click', () => {
            this.startCamera();
        });

        document.getElementById('capturePhotoBtn').addEventListener('click', () => {
            this.capturePhoto();
        });

        document.getElementById('retakePhotoBtn').addEventListener('click', () => {
            this.retakePhoto();
        });

        document.getElementById('generateReadingBtn').addEventListener('click', () => {
            this.generateReading();
        });

        // Reading screen
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.showShareScreen();
        });

        document.getElementById('newReadingBtn').addEventListener('click', () => {
            this.resetApp();
        });

        // Share screen
        document.getElementById('copyReadingBtn').addEventListener('click', () => {
            this.copyReading();
        });

        document.getElementById('backToReadingBtn').addEventListener('click', () => {
            this.showScreen('reading');
        });
    }

    initializeCanvas() {
        // Initialize canvas for photo capture
    }

    setupPhotoScreen() {
        // Update the selected hand text
        const handText = document.getElementById('selectedHandText');
        handText.textContent = this.userData.hand === 'left' ? 'left hand' : 'right hand';
        
        // Reset camera interface to original state
        const cameraContainer = document.querySelector('.camera-container');
        cameraContainer.innerHTML = `
            <video id="cameraVideo" autoplay muted playsinline></video>
            <canvas id="captureCanvas" style="display: none;"></canvas>
            <div id="photoPreview" style="display: none;">
                <img id="capturedImage" alt="Captured palm photo">
            </div>
        `;
        
        // Reset photo state
        this.hasPhoto = false;
        this.showCameraControls('start');
    }

    async startCamera() {
        console.log('Starting camera...');
        
        // Check if we're on HTTPS or localhost
        const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        
        if (!isSecure) {
            alert('Camera access requires HTTPS or localhost. Please access the app via HTTPS for camera functionality, or upload a photo file instead.');
            this.showFileUploadOption();
            return;
        }
        
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Camera is not supported in this browser. Please use a modern browser or upload a photo file instead.');
            this.showFileUploadOption();
            return;
        }
        
        try {
            console.log('Requesting camera access...');
            this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 },
                    facingMode: 'environment' // Use back camera if available
                } 
            });
            
            console.log('Camera access granted');
            const video = document.getElementById('cameraVideo');
            video.srcObject = this.cameraStream;
            
            this.showCameraControls('capture');
        } catch (error) {
            console.error('Camera access error:', error);
            let errorMessage = 'Unable to access camera. ';
            
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Please grant camera permissions and try again.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No camera found on this device.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage += 'Camera is not supported in this browser.';
            } else {
                errorMessage += 'Error: ' + error.message;
            }
            
            alert(errorMessage + ' You can upload a photo file instead.');
            this.showFileUploadOption();
        }
    }

    showFileUploadOption() {
        // Add file upload as alternative to camera
        const cameraContainer = document.querySelector('.camera-container');
        cameraContainer.innerHTML = `
            <div class="file-upload-container">
                <div class="upload-icon">📁</div>
                <h3>Upload Palm Photo</h3>
                <p>Select a photo of your palm from your device</p>
                <input type="file" id="palmFileInput" accept="image/*" style="display: none;">
                <button id="selectFileBtn" class="magic-btn">📸 Choose Photo</button>
            </div>
        `;
        
        // Add event listeners for file upload
        document.getElementById('selectFileBtn').addEventListener('click', () => {
            document.getElementById('palmFileInput').click();
        });
        
        document.getElementById('palmFileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            // First analyze the image for hand detection
            this.analyzeImageForHand(e.target.result, (hasHand) => {
                if (hasHand) {
                    this.userData.palmPhoto = e.target.result;
                    
                    // Show the uploaded photo
                    const capturedImage = document.getElementById('capturedImage');
                    capturedImage.src = e.target.result;
                    
                    // Hide file upload and show photo preview
                    document.querySelector('.camera-container').style.display = 'none';
                    document.getElementById('photoPreview').style.display = 'block';
                    
                    this.hasPhoto = true;
                    this.showCameraControls('retake');
                } else {
                    this.showHandNotDetectedMessage();
                }
            });
        };
        
        reader.readAsDataURL(file);
    }

    capturePhoto() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('captureCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0);
        
        // Convert to data URL
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Analyze the captured photo for hand detection
        this.analyzeImageForHand(photoDataUrl, (hasHand) => {
            if (hasHand) {
                this.userData.palmPhoto = photoDataUrl;
                
                // Show the captured photo
                const capturedImage = document.getElementById('capturedImage');
                capturedImage.src = photoDataUrl;
                
                // Hide video and show photo preview
                video.style.display = 'none';
                document.getElementById('photoPreview').style.display = 'block';
                
                this.hasPhoto = true;
                this.showCameraControls('retake');
                
                // Stop camera stream
                if (this.cameraStream) {
                    this.cameraStream.getTracks().forEach(track => track.stop());
                }
            } else {
                this.showHandNotDetectedMessage();
            }
        });
    }

    retakePhoto() {
        // Hide photo preview
        document.getElementById('photoPreview').style.display = 'none';
        document.querySelector('.camera-container').style.display = 'block';
        
        this.hasPhoto = false;
        this.userData.palmPhoto = null;
        
        // Reset to original camera interface
        this.setupPhotoScreen();
        this.showCameraControls('start');
    }

    showCameraControls(state) {
        const startBtn = document.getElementById('startCameraBtn');
        const captureBtn = document.getElementById('capturePhotoBtn');
        const retakeBtn = document.getElementById('retakePhotoBtn');
        const generateBtn = document.getElementById('generateReadingBtn');
        
        // Hide all buttons first
        [startBtn, captureBtn, retakeBtn, generateBtn].forEach(btn => {
            btn.style.display = 'none';
        });
        
        switch (state) {
            case 'start':
                startBtn.style.display = 'inline-block';
                break;
            case 'capture':
                captureBtn.style.display = 'inline-block';
                break;
            case 'retake':
                retakeBtn.style.display = 'inline-block';
                generateBtn.style.display = 'inline-block';
                break;
        }
    }

    analyzeImageForHand(imageDataUrl, callback) {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Scale down for faster processing
            const maxSize = 300;
            const scale = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const hasHand = this.detectHandInImageData(imageData);
                callback(hasHand);
            } catch (error) {
                console.log('Hand detection failed, allowing image anyway:', error);
                callback(true); // Allow image if detection fails
            }
        };
        img.src = imageDataUrl;
    }

    detectHandInImageData(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        let skinPixels = 0;
        let totalPixels = 0;
        let handShapeScore = 0;
        
        // Define skin tone ranges (RGB values)
        const skinTones = [
            { rMin: 95, rMax: 255, gMin: 40, gMax: 220, bMin: 20, bMax: 200 },  // Light skin
            { rMin: 45, rMax: 255, gMin: 34, gMax: 200, bMin: 20, bMax: 180 },  // Medium skin  
            { rMin: 20, rMax: 200, gMin: 15, gMax: 150, bMin: 10, bMax: 120 }   // Dark skin
        ];
        
        // Analyze pixels for skin tones
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            totalPixels++;
            
            // Check if pixel matches skin tone
            const isSkin = skinTones.some(tone => 
                r >= tone.rMin && r <= tone.rMax &&
                g >= tone.gMin && g <= tone.gMax &&
                b >= tone.bMin && b <= tone.bMax &&
                r > g && g > b  // Skin typically has R > G > B
            );
            
            if (isSkin) {
                skinPixels++;
            }
        }
        
        const skinPercentage = (skinPixels / totalPixels) * 100;
        
        // Look for hand-like shapes by analyzing connected skin regions
        if (skinPercentage > 15) { // At least 15% skin-colored pixels
            handShapeScore += this.analyzeHandShape(imageData, skinTones);
        }
        
        // Hand detection criteria:
        // - At least 15% skin-colored pixels
        // - Some hand-like shape characteristics
        const hasHand = skinPercentage > 15 && handShapeScore > 30;
        
        console.log(`Hand detection: ${skinPercentage.toFixed(1)}% skin, shape score: ${handShapeScore}, detected: ${hasHand}`);
        
        return hasHand;
    }

    analyzeHandShape(imageData, skinTones) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        let shapeScore = 0;
        
        // Create a binary mask for skin pixels
        const skinMask = new Array(width * height).fill(false);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                const isSkin = skinTones.some(tone => 
                    r >= tone.rMin && r <= tone.rMax &&
                    g >= tone.gMin && g <= tone.gMax &&
                    b >= tone.bMin && b <= tone.bMax &&
                    r > g && g > b
                );
                
                skinMask[y * width + x] = isSkin;
            }
        }
        
        // Look for connected regions that could be fingers or palm
        let largestRegionSize = 0;
        let connectedRegions = 0;
        const visited = new Array(width * height).fill(false);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                if (skinMask[index] && !visited[index]) {
                    const regionSize = this.floodFill(skinMask, visited, x, y, width, height);
                    if (regionSize > 50) { // Significant region
                        connectedRegions++;
                        largestRegionSize = Math.max(largestRegionSize, regionSize);
                    }
                }
            }
        }
        
        // Score based on connected regions (palm + fingers)
        if (largestRegionSize > 500) shapeScore += 30; // Large central region (palm)
        if (connectedRegions >= 2 && connectedRegions <= 6) shapeScore += 20; // 2-6 regions (palm + fingers)
        if (largestRegionSize > 200) shapeScore += 10; // Decent sized region
        
        return shapeScore;
    }

    floodFill(skinMask, visited, startX, startY, width, height) {
        const stack = [{x: startX, y: startY}];
        let regionSize = 0;
        
        while (stack.length > 0) {
            const {x, y} = stack.pop();
            const index = y * width + x;
            
            if (x < 0 || x >= width || y < 0 || y >= height || 
                visited[index] || !skinMask[index]) {
                continue;
            }
            
            visited[index] = true;
            regionSize++;
            
            // Add adjacent pixels
            stack.push({x: x + 1, y: y});
            stack.push({x: x - 1, y: y});
            stack.push({x: x, y: y + 1});
            stack.push({x: x, y: y - 1});
        }
        
        return regionSize;
    }

    showHandNotDetectedMessage() {
        const cameraContainer = document.querySelector('.camera-container');
        cameraContainer.innerHTML = `
            <div class="hand-not-detected">
                <div class="warning-icon">⚠️</div>
                <h3>No Hand Detected</h3>
                <p>We couldn't detect a hand in your image. For the best reading:</p>
                <ul>
                    <li>Make sure your palm is clearly visible</li>
                    <li>Use good lighting</li>
                    <li>Hold your hand steady and open</li>
                    <li>Avoid shadows or dark backgrounds</li>
                </ul>
                <div class="hand-detection-buttons">
                    <button id="tryAgainBtn" class="magic-btn">📷 Try Again</button>
                    <button id="skipDetectionBtn" class="magic-btn secondary">Skip & Continue</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('tryAgainBtn').addEventListener('click', () => {
            this.setupPhotoScreen();
            this.showCameraControls('start');
        });
        
        document.getElementById('skipDetectionBtn').addEventListener('click', () => {
            // Allow user to proceed without hand detection
            this.showSkipDetectionConfirm();
        });
    }

    showSkipDetectionConfirm() {
        const cameraContainer = document.querySelector('.camera-container');
        cameraContainer.innerHTML = `
            <div class="skip-detection-confirm">
                <div class="info-icon">📋</div>
                <h3>Continue Without Hand Detection?</h3>
                <p>You can still get a palm reading, but it will be based on your name, age, and hand choice rather than your actual palm image.</p>
                <div class="skip-buttons">
                    <button id="continueSkipBtn" class="magic-btn">📊 Continue Reading</button>
                    <button id="backToPhotoBtn" class="magic-btn secondary">📷 Back to Photo</button>
                </div>
            </div>
        `;
        
        document.getElementById('continueSkipBtn').addEventListener('click', () => {
            this.userData.palmPhoto = null; // No actual photo
            this.hasPhoto = true; // But allow reading to continue
            document.querySelector('.camera-container').style.display = 'none';
            this.showCameraControls('retake');
        });
        
        document.getElementById('backToPhotoBtn').addEventListener('click', () => {
            this.setupPhotoScreen();
            this.showCameraControls('start');
        });
    }

    updateNextButton() {
        const nextBtn = document.getElementById('nextBtn');
        const hasName = this.userData.name.length > 0;
        const hasHand = this.userData.hand !== '';
        
        nextBtn.disabled = !(hasName && hasHand);
    }

    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        document.getElementById(`${screenName}Screen`).classList.add('active');
        this.currentScreen = screenName;
    }

    generateReading() {
        const reading = this.createConsistentReading();
        this.displayReading(reading);
        this.showScreen('reading');
    }

    createConsistentReading() {
        // Create a consistent hash based on user data
        const hashInput = `${this.userData.name}_${this.userData.age}_${this.userData.hand}`;
        const hash = this.simpleHash(hashInput);
        
        // Get age-appropriate predictions
        const predictions = this.getAgeAppropriatePredictions(this.userData.age);
        
        // Use hash to select consistent predictions
        const opportunityIndex = hash % predictions.opportunities.length;
        const relationshipIndex = (hash * 2) % predictions.relationships.length;
        const growthIndex = (hash * 3) % predictions.personal_growth.length;
        const achievementIndex = (hash * 5) % predictions.achievements.length;
        
        return {
            main: predictions.opportunities[opportunityIndex],
            talent: predictions.personal_growth[growthIndex],
            friendship: predictions.relationships[relationshipIndex],
            special: predictions.achievements[achievementIndex],
            category: predictions.category
        };
    }

    getAgeAppropriatePredictions(age) {
        if (age <= 12) {
            return this.getChildPredictions();
        } else if (age <= 17) {
            return this.getTeenPredictions();
        } else {
            return this.getAdultPredictions();
        }
    }

    getChildPredictions() {
        return {
            opportunities: [
                "You will discover a new hobby that brings you lots of joy.",
                "A fun learning opportunity will come your way at school.",
                "You will get a chance to help with something important at home.",
                "A creative project will turn out better than you expected.",
                "You will find a new favorite book or activity that excites you.",
                "You will get picked for a special school project or team.",
                "A surprise field trip or fun event will happen at school.",
                "You will find a cool new place to explore near your home.",
                "Someone will invite you to join a fun club or group.",
                "You will discover you're really good at a new sport or game.",
                "A pet or animal will become very special to you.",
                "You will get to try something you've always wanted to do.",
                "A grown-up will ask for your help with something important.",
                "You will find a treasure or something valuable that was lost.",
                "A new teacher or coach will help you learn something amazing.",
                "You will get to visit somewhere really fun and interesting.",
                "A special celebration or party will be planned just for you.",
                "You will discover a hidden talent for music, art, or writing.",
                "A fun competition or contest will come your way.",
                "You will get to help plan something exciting for your family."
            ],
            relationships: [
                "You will make a new friend who shares your interests.",
                "A family member will teach you something really cool.",
                "You will help a friend feel better when they're sad.",
                "Your kindness will make someone's day much brighter.",
                "You will have a fun adventure with friends or family.",
                "An older kid will become like a big brother or sister to you.",
                "You will meet someone who becomes your very best friend.",
                "A neighbor will become someone you really enjoy spending time with.",
                "You will help two friends make up after an argument.",
                "Your grandparents or relatives will share special stories with you.",
                "A new student at school will be glad to have you as a friend.",
                "You will organize a fun playdate that everyone loves.",
                "A younger child will look up to you as a role model.",
                "You will bond with someone over a shared love of animals or books.",
                "A pen pal or online friend will bring excitement to your days.",
                "You will help a family member with something they find difficult.",
                "A classmate who seemed unfriendly will turn out to be really nice.",
                "You will make friends with someone from a different culture.",
                "Your teacher will notice how helpful you are to other students.",
                "A family reunion or gathering will be extra special because of you."
            ],
            personal_growth: [
                "You will become braver about trying new things.",
                "You will get better at something you've been practicing.",
                "You will learn to solve problems in a clever way.",
                "You will discover you're really good at helping others.",
                "You will become more confident speaking up for yourself.",
                "You will learn to be more patient when things don't go your way.",
                "You will become better at organizing your room or belongings.",
                "You will develop a new skill that makes you feel independent.",
                "You will learn to cook or bake something delicious.",
                "You will become more responsible with your chores or homework.",
                "You will get better at controlling your temper when frustrated.",
                "You will learn to save money for something you really want.",
                "You will become more confident performing in front of others.",
                "You will develop better listening skills in conversations.",
                "You will learn to ask for help when you need it.",
                "You will become better at sharing and taking turns.",
                "You will develop a daily habit that makes you healthier.",
                "You will learn to stand up for someone who needs help.",
                "You will become more creative in solving everyday problems.",
                "You will gain confidence in speaking to adults and asking questions."
            ],
            achievements: [
                "You will finish a project you've been working hard on.",
                "Your teacher or parents will notice your improvement in something.",
                "You will learn a new skill that makes you feel proud.",
                "You will help solve a problem that's been bothering your family.",
                "You will accomplish something that seemed hard at first.",
                "You will get a better grade in a subject that was challenging.",
                "You will win or place well in a school competition.",
                "You will learn to ride a bike, skateboard, or use roller skates.",
                "You will read a really long book all by yourself.",
                "You will create something artistic that impresses everyone.",
                "You will learn all your multiplication tables or spelling words.",
                "You will help raise money for a good cause at school.",
                "You will perform in a school play, concert, or talent show.",
                "You will teach someone else a skill that you're good at.",
                "You will build or create something with your own hands.",
                "You will memorize all the words to a song or poem.",
                "You will improve your score in a video game or sport.",
                "You will organize a successful event or activity for your class.",
                "You will learn to swim better or master a new swimming stroke.",
                "You will complete a difficult puzzle or challenging game.",
                "You will grow a plant or take care of a living thing successfully.",
                "You will learn to play a musical instrument or improve your skills.",
                "You will help your team win a game through your contribution.",
                "You will write a story or draw a picture that makes people smile.",
                "You will overcome a fear like speaking in public or trying new foods."
            ],
            category: "🌟 Your Exciting Future"
        };
    }

    getTeenPredictions() {
        return {
            opportunities: [
                "You will discover an interest that could shape your future path.",
                "A chance to volunteer or help in your community will arise.",
                "You will get an opportunity to showcase your talents.",
                "A summer program or internship opportunity will appear.",
                "You will find a way to turn your passion into something meaningful.",
                "A college admissions officer will be impressed by your application.",
                "You will get accepted to a competitive program you really want.",
                "A part-time job opportunity will teach you valuable work skills.",
                "You will be invited to participate in a special academic program.",
                "A scholarship or financial aid opportunity will come your way.",
                "You will get chosen to represent your school in a competition.",
                "A creative project of yours will gain recognition beyond school.",
                "You will discover a career field that excites you.",
                "A networking opportunity will connect you with interesting people.",
                "You will get to travel somewhere new for school or activities.",
                "A leadership role will be offered to you in a club or organization.",
                "You will find an online course or program that advances your skills.",
                "A local business will offer you valuable work experience.",
                "You will be selected for a special honor or award program.",
                "A gap year or alternative path will become an attractive option."
            ],
            relationships: [
                "You will deepen a friendship through shared experiences.",
                "A teacher or mentor will offer valuable guidance for your future.",
                "You will expand your social circle through extracurricular activities.",
                "You will improve communication with a family member.",
                "You will meet someone who inspires you to grow.",
                "A romantic relationship will teach you about yourself and others.",
                "You will reconnect with an old friend in a meaningful way.",
                "A study group or project partner will become a close friend.",
                "You will find a mentor in an area you're passionate about.",
                "A family conflict will resolve itself in a positive way.",
                "You will make friends with people from different backgrounds.",
                "A teacher will become someone you can really talk to and trust.",
                "You will help a friend through a difficult time in their life.",
                "An online community will become an important part of your life.",
                "You will bond with siblings or relatives in a new way.",
                "A counselor or therapist will provide helpful perspective.",
                "You will meet someone who shares your future academic interests.",
                "A peer mediation or conflict resolution will strengthen relationships.",
                "You will develop a meaningful friendship with someone older or younger.",
                "A family tradition or gathering will bring you closer to relatives."
            ],
            personal_growth: [
                "You will become more independent and self-reliant.",
                "A challenge will teach you important life skills.",
                "You will overcome self-doubt in an area you care about.",
                "You will develop better study or organizational habits.",
                "You will gain clarity about your values and goals.",
                "You will learn to manage stress and anxiety more effectively.",
                "You will develop a stronger sense of personal identity.",
                "You will become more comfortable expressing your opinions.",
                "You will learn to balance social life with academic responsibilities.",
                "You will overcome a fear that has been limiting your growth.",
                "You will develop healthier habits around sleep and exercise.",
                "You will become more financially responsible and money-smart.",
                "You will learn to communicate better with authority figures.",
                "You will develop resilience in the face of disappointment.",
                "You will become more confident in social situations.",
                "You will learn to set healthy boundaries with friends and family.",
                "You will develop better time management and prioritization skills.",
                "You will become more emotionally intelligent and self-aware.",
                "You will learn to advocate for yourself in challenging situations.",
                "You will develop a growth mindset about learning and improvement."
            ],
            achievements: [
                "You will excel in an area you've been working to improve.",
                "Your efforts in school or activities will be recognized.",
                "You will learn a skill that opens new possibilities.",
                "You will successfully navigate a difficult situation.",
                "You will take on more responsibility and handle it well.",
                "You will improve your GPA or standardized test scores significantly.",
                "You will complete a challenging long-term project successfully.",
                "You will win or place highly in an academic or artistic competition.",
                "You will master a difficult skill like driving, coding, or public speaking.",
                "You will organize a successful event or fundraiser for your community.",
                "You will get into your first-choice college or program.",
                "You will publish your writing, art, or research in some form.",
                "You will learn a new language or achieve fluency in one you're studying.",
                "You will complete a fitness goal or athletic achievement.",
                "You will start a small business or side project that succeeds.",
                "You will earn a professional certification in an area of interest.",
                "You will overcome a learning challenge or academic struggle.",
                "You will graduate with honors or special recognition.",
                "You will successfully complete a challenging internship or work experience.",
                "You will develop expertise in a technology or digital tool.",
                "You will create something artistic that brings you pride and recognition.",
                "You will successfully navigate a major life transition or change.",
                "You will achieve independence in an area where you needed help before.",
                "You will complete a community service project that makes a real difference.",
                "You will develop leadership skills through managing others or leading projects."
            ],
            category: "🎯 Your Growing Future"
        };
    }

    getAdultPredictions() {
        return {
            opportunities: [
                "You will receive an unexpected career opportunity within 6 months.",
                "A travel opportunity will present itself through work or personal connections.",
                "You will discover a new skill that opens professional doors.",
                "An investment or financial opportunity will come your way.",
                "You will be recognized for your professional achievements.",
                "A side business or freelance opportunity will develop into something significant.",
                "You will be offered a promotion or new role with greater responsibility.",
                "A networking connection will lead to an exciting collaboration.",
                "You will find a way to monetize a hobby or passion project.",
                "A real estate opportunity will present itself at the right time.",
                "You will be invited to speak, teach, or share your expertise publicly.",
                "A creative project will gain unexpected attention or success.",
                "You will discover a new industry or field that interests you.",
                "A technology or digital opportunity will advance your career.",
                "You will get the chance to work remotely or relocate for better opportunities.",
                "A startup or entrepreneurial venture will catch your attention.",
                "You will be offered a consulting or advisory role in your field.",
                "A patent, copyright, or intellectual property opportunity will arise.",
                "You will find a way to turn your expertise into passive income.",
                "A partnership or joint venture will prove very profitable.",
                "You will discover an untapped market for your skills or products.",
                "A government grant or funding opportunity will become available.",
                "You will be headhunted by a company you've always admired.",
                "A licensing or franchise opportunity will present itself.",
                "You will find a way to combine multiple interests into a lucrative venture."
            ],
            relationships: [
                "You will strengthen an existing relationship through honest communication.",
                "A mentor figure will play an important role in your development.",
                "You will expand your social circle through a shared interest or hobby.",
                "A family relationship will improve significantly this year.",
                "You will meet someone who shares your professional or personal goals.",
                "A romantic relationship will deepen and become more committed.",
                "You will reconnect with an old friend who brings joy back into your life.",
                "A work colleague will become a trusted friend outside the office.",
                "You will find a therapist or counselor who helps you grow personally.",
                "A family feud or long-standing conflict will finally be resolved.",
                "You will meet someone who becomes an important business partner.",
                "A neighbor or community member will become a valuable connection.",
                "You will develop a meaningful friendship with someone from a different generation.",
                "A online connection will translate into a real-world friendship.",
                "You will find a support group or community that truly understands you.",
                "A dating app or social platform will lead to a meaningful relationship.",
                "You will become closer to your siblings or extended family members.",
                "A professional relationship will evolve into a personal friendship.",
                "You will meet someone who challenges you to become a better person.",
                "A shared crisis or challenge will strengthen a relationship significantly.",
                "You will find a mentor in an area of life you want to improve.",
                "A volunteer activity will connect you with like-minded people.",
                "You will help facilitate a relationship between two other people.",
                "A travel experience will lead to lasting friendships with fellow travelers.",
                "You will develop a better relationship with yourself through self-reflection."
            ],
            personal_growth: [
                "You will develop better work-life balance in the coming months.",
                "A challenging situation will teach you valuable life skills.",
                "You will overcome a fear that has been holding you back.",
                "You will discover a passion or interest you never knew you had.",
                "You will improve your physical or mental health through new habits.",
                "You will learn to set healthier boundaries in your personal and professional life.",
                "You will develop greater emotional intelligence and self-awareness.",
                "You will overcome a limiting belief that has been holding you back.",
                "You will learn to manage stress and anxiety more effectively.",
                "You will develop better financial habits and money management skills.",
                "You will become more confident in public speaking or presentations.",
                "You will learn to delegate more effectively and trust others with responsibilities.",
                "You will develop a more positive mindset and outlook on life.",
                "You will learn a new language or significantly improve your skills in one.",
                "You will develop better listening skills and become more empathetic.",
                "You will learn to say no to commitments that don't align with your values.",
                "You will develop a regular meditation or mindfulness practice.",
                "You will become more organized and efficient in managing your time.",
                "You will learn to take calculated risks instead of playing it safe.",
                "You will develop greater resilience in the face of setbacks and failures.",
                "You will learn to be more assertive while maintaining kindness.",
                "You will develop better conflict resolution and negotiation skills.",
                "You will learn to embrace change instead of resisting it.",
                "You will develop a growth mindset about learning and personal development.",
                "You will learn to forgive yourself and others for past mistakes."
            ],
            achievements: [
                "You will complete a goal you've been working toward for a long time.",
                "Your hard work will be noticed and rewarded by others.",
                "You will learn a new technology or method that advances your career.",
                "You will successfully solve a problem that has been frustrating you.",
                "You will take on a leadership role in a project or organization.",
                "You will pay off a significant debt or reach an important financial milestone.",
                "You will complete an advanced degree, certification, or professional training.",
                "You will publish a book, article, or piece of creative work.",
                "You will successfully launch a business or new product line.",
                "You will achieve a fitness goal you've been working toward for months.",
                "You will buy your first home or upgrade to a better living situation.",
                "You will win an award or recognition in your professional field.",
                "You will successfully change careers or industries.",
                "You will learn to play a musical instrument or significantly improve your skills.",
                "You will complete a major home renovation or improvement project.",
                "You will successfully negotiate a significant salary increase or bonus.",
                "You will finish writing that novel, screenplay, or creative project you started.",
                "You will achieve fluency in a foreign language you've been studying.",
                "You will successfully organize a major event, wedding, or celebration.",
                "You will complete a challenging physical feat like a marathon or triathlon.",
                "You will master a complex skill like coding, investing, or public speaking.",
                "You will successfully mentor someone and help them achieve their goals.",
                "You will create a piece of art, music, or writing that gains recognition.",
                "You will successfully navigate a major life transition like marriage or parenthood.",
                "You will achieve a long-held dream like traveling to a specific destination.",
                "You will successfully resolve a legal matter or bureaucratic challenge.",
                "You will create a successful online presence or personal brand.",
                "You will successfully start a family or expand your existing family.",
                "You will achieve mastery in a hobby that has challenged you for years.",
                "You will successfully overcome a health challenge or improve your wellness significantly."
            ],
            category: "🎯 Your Future Outlook"
        };
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    displayReading(reading) {
        document.getElementById('readingTitle').textContent = `${this.userData.name}'s Palm Analysis`;
        document.getElementById('readingCategory').textContent = reading.category;
        document.getElementById('readingText').textContent = reading.main;
        document.getElementById('talentPrediction').textContent = reading.talent;
        document.getElementById('funPrediction').textContent = reading.friendship;
        document.getElementById('specialPrediction').textContent = reading.special;
        
        // Store for sharing
        this.currentReading = reading;
    }

    showShareScreen() {
        const shareTitle = `${this.userData.name}'s Palm Analysis`;
        const shareText = `📊 ${this.currentReading.main}\n\n📈 ${this.currentReading.talent}\n\n🤝 ${this.currentReading.friendship}\n\n🏆 ${this.currentReading.special}`;
        
        document.getElementById('shareTitle').textContent = shareTitle;
        document.getElementById('shareText').textContent = shareText;
        
        this.showScreen('share');
    }

    async copyReading() {
        const shareTitle = `${this.userData.name}'s Palm Analysis`;
        const shareText = `📊 ${this.currentReading.main}\n\n📈 ${this.currentReading.talent}\n\n🤝 ${this.currentReading.friendship}\n\n🏆 ${this.currentReading.special}\n\n📋 Palm Analysis Tool 📋`;
        const fullText = `${shareTitle}\n\n${shareText}`;
        
        try {
            await navigator.clipboard.writeText(fullText);
            const btn = document.getElementById('copyReadingBtn');
            const originalText = btn.textContent;
            btn.textContent = 'Copied! ✨';
            btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        } catch (err) {
            alert('Analysis copied to share!');
        }
    }

    resetApp() {
        // Reset user data
        this.userData = {
            name: '',
            age: 25,
            hand: '',
            tracedLines: [],
            palmPhoto: null
        };
        this.hasPhoto = false;
        this.currentReading = null;
        
        // Stop any active camera stream
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        
        // Reset form elements
        document.getElementById('nameInput').value = '';
        document.getElementById('ageSlider').value = '25';
        document.getElementById('ageDisplay').textContent = '25';
        document.querySelectorAll('.hand-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('nextBtn').disabled = true;
        
        // Reset camera interface
        document.getElementById('cameraVideo').style.display = 'block';
        document.getElementById('photoPreview').style.display = 'none';
        this.showCameraControls('start');
        
        // Go back to welcome screen
        this.showScreen('welcome');
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PalmReader();
});