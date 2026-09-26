// Home page specific functionality
let webcamStream = null;
let currentEmotion = null;
let currentRecommendations = [];
let isCapturing = false;

// Initialize home page
document.addEventListener('DOMContentLoaded', function() {
    initializeHome();
});

function initializeHome() {
    initializeCameraControls();
    initializeRecommendationCategories();
    loadHistory();
    loadMoodJournal();
    initializeMusicPlayer();
}

// Camera functionality
function initializeCameraControls() {
    const toggleCameraBtn = document.getElementById('toggleCamera');
    const captureBtn = document.getElementById('captureBtn');
    const webcam = document.getElementById('webcam');
    
    toggleCameraBtn.addEventListener('click', toggleCamera);
    captureBtn.addEventListener('click', captureEmotion);
    
    // Initialize camera button state
    updateCameraButtonState();
}

async function toggleCamera() {
    const toggleBtn = document.getElementById('toggleCamera');
    const webcam = document.getElementById('webcam');
    
    if (webcamStream) {
        // Stop camera
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
        webcam.srcObject = null;
        
        toggleBtn.innerHTML = '<i class="fas fa-video"></i><span>Start Camera</span>';
        toggleBtn.style.background = 'var(--accent-color)';
        
        document.getElementById('captureBtn').disabled = true;
        
        MoodVibe.showNotification('Camera stopped', 'info');
    } else {
        // Start camera
        try {
            webcamStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 }, 
                    height: { ideal: 480 } 
                } 
            });
            
            webcam.srcObject = webcamStream;
            
            toggleBtn.innerHTML = '<i class="fas fa-video-slash"></i><span>Stop Camera</span>';
            toggleBtn.style.background = '#ef4444';
            
            document.getElementById('captureBtn').disabled = false;
            
            MoodVibe.showNotification('Camera started successfully', 'success');
        } catch (error) {
            console.error('Camera access error:', error);
            MoodVibe.showNotification('Camera access denied. Please allow camera access.', 'error');
        }
    }
}

function updateCameraButtonState() {
    const captureBtn = document.getElementById('captureBtn');
    captureBtn.disabled = !webcamStream;
}

async function captureEmotion() {
    if (!webcamStream || isCapturing) return;
    
    isCapturing = true;
    const webcam = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    
    // Draw current frame to canvas
    ctx.drawImage(webcam, 0, 0);
    
    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    MoodVibe.showLoading();
    
    try {
        const response = await fetch('/api/capture_emotion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentEmotion = data.emotion;
            displayEmotionResult(data);
            loadRecommendations(data.emotion);
            MoodVibe.showNotification(`Emotion detected: ${MoodVibe.capitalizeFirst(data.emotion)}`, 'success');
        } else {
            MoodVibe.showNotification('Emotion detection failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Emotion capture error:', error);
        MoodVibe.showNotification('Emotion detection failed. Please try again.', 'error');
    } finally {
        MoodVibe.hideLoading();
        isCapturing = false;
    }
}

function displayEmotionResult(emotionData) {
    const emotionResult = document.getElementById('emotionResult');
    const emotionName = document.getElementById('emotionName');
    const emotionConfidence = document.getElementById('emotionConfidence');
    const emotionIcon = document.querySelector('.emotion-icon i');
    
    // Update emotion display
    emotionName.textContent = MoodVibe.capitalizeFirst(emotionData.emotion);
    emotionConfidence.textContent = `${Math.round(emotionData.confidence * 100)}% confidence`;
    
    // Update emotion icon
    const emotionIcons = {
        happy: 'fa-smile',
        sad: 'fa-frown',
        angry: 'fa-angry',
        neutral: 'fa-meh',
        surprise: 'fa-surprise',
        fear: 'fa-dizzy',
        disgust: 'fa-grimace'
    };
    
    emotionIcon.className = `fas ${emotionIcons[emotionData.emotion] || 'fa-meh'}`;
    
    // Show emotion result with animation
    emotionResult.classList.add('show');
    
    // Scroll to recommendations
    setTimeout(() => {
        document.getElementById('recommendations').scrollIntoView({ behavior: 'smooth' });
    }, 1000);
}

// Recommendations functionality
function initializeRecommendationCategories() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter recommendations
            const category = this.getAttribute('data-category');
            filterRecommendations(category);
        });
    });
}

async function loadRecommendations(emotion) {
    try {
        const response = await fetch(`/api/recommendations/${emotion}`);
        const data = await response.json();
        
        if (data.success) {
            currentRecommendations = data.recommendations;
            displayRecommendations(currentRecommendations);
        } else {
            MoodVibe.showNotification('Failed to load recommendations', 'error');
        }
    } catch (error) {
        console.error('Recommendations loading error:', error);
        MoodVibe.showNotification('Failed to load recommendations', 'error');
    }
}

function filterRecommendations(category) {
    let filteredRecommendations = currentRecommendations;
    
    if (category !== 'all') {
        filteredRecommendations = currentRecommendations.filter(rec => rec.type === category);
    }
    
    displayRecommendations(filteredRecommendations);
}

function displayRecommendations(recommendations) {
    const recommendationsGrid = document.getElementById('recommendationsGrid');
    
    if (recommendations.length === 0) {
        recommendationsGrid.innerHTML = '<p class="no-recommendations">No recommendations available for this emotion.</p>';
        return;
    }
    
    recommendationsGrid.innerHTML = recommendations.map(rec => `
        <div class="recommendation-card" data-type="${rec.type}">
            <img src="${rec.image}" alt="${rec.title}" onerror="this.src='https://images.unsplash.com/photo-1557683316-973673baf926?w=300&h=200&fit=crop'">
            <div class="recommendation-content">
                <h3>${rec.title}</h3>
                <p>${rec.description}</p>
                <div class="recommendation-meta">
                    <span class="recommendation-type">${MoodVibe.capitalizeFirst(rec.type)}</span>
                    ${rec.type === 'song' ? `<button class="play-btn" onclick="playSong('${rec.url}', '${rec.title}')">
                        <i class="fas fa-play"></i> Play
                    </button>` : ''}
                    ${rec.rating ? `<span class="rating">${rec.rating}</span>` : ''}
                    ${rec.author ? `<span class="author">by ${rec.author}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    // Add click animations
    const cards = recommendationsGrid.querySelectorAll('.recommendation-card');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
        });
    });
}

// Music player functionality
function initializeMusicPlayer() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const closePlayer = document.getElementById('closePlayer');
    const audioPlayer = document.getElementById('audioPlayer');
    
    playPauseBtn.addEventListener('click', togglePlayPause);
    closePlayer.addEventListener('click', closeMusicPlayer);
    
    audioPlayer.addEventListener('ended', function() {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        closeMusicPlayer();
    });
    
    audioPlayer.addEventListener('error', function() {
        MoodVibe.showNotification('Failed to play audio', 'error');
        closeMusicPlayer();
    });
}

function playSong(url, title) {
    const musicPlayer = document.getElementById('musicPlayer');
    const audioPlayer = document.getElementById('audioPlayer');
    const currentSong = document.getElementById('currentSong');
    const playPauseBtn = document.getElementById('playPauseBtn');
    
    // Update player info
    currentSong.textContent = title;
    audioPlayer.src = url;
    
    // Show player
    musicPlayer.classList.add('show');
    
    // Play audio
    audioPlayer.play().then(() => {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        MoodVibe.showNotification(`Now playing: ${title}`, 'success');
    }).catch(() => {
        MoodVibe.showNotification('Failed to play audio', 'error');
    });
}

function togglePlayPause() {
    const audioPlayer = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    
    if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        audioPlayer.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

function closeMusicPlayer() {
    const musicPlayer = document.getElementById('musicPlayer');
    const audioPlayer = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    
    audioPlayer.pause();
    audioPlayer.src = '';
    musicPlayer.classList.remove('show');
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
}

// Mood Journal functionality
async function addJournalEntry() {
    const emotion = document.getElementById('journalEmotion').value;
    const note = document.getElementById('journalNote').value;
    
    try {
        const response = await fetch('/api/mood_journal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ emotion, note })
        });
        
        const data = await response.json();
        
        if (data.success) {
            MoodVibe.showNotification('Journal entry added successfully', 'success');
            document.getElementById('journalNote').value = '';
            loadMoodJournal();
        } else {
            MoodVibe.showNotification('Failed to add journal entry', 'error');
        }
    } catch (error) {
        console.error('Journal entry error:', error);
        MoodVibe.showNotification('Failed to add journal entry', 'error');
    }
}

async function loadMoodJournal() {
    try {
        const response = await fetch('/api/mood_journal');
        const data = await response.json();
        
        if (data.success) {
            displayMoodJournal(data.entries);
        } else {
            console.error('Failed to load mood journal');
        }
    } catch (error) {
        console.error('Mood journal loading error:', error);
    }
}

function displayMoodJournal(entries) {
    const journalEntries = document.getElementById('journalEntries');
    
    if (entries.length === 0) {
        journalEntries.innerHTML = '<p class="no-entries">No journal entries yet. Add your first entry above!</p>';
        return;
    }
    
    journalEntries.innerHTML = entries.slice(0, 10).map(entry => `
        <div class="journal-entry">
            <div class="journal-header">
                <span class="journal-emotion">${MoodVibe.capitalizeFirst(entry.emotion)}</span>
                <span class="journal-date">${MoodVibe.formatDate(entry.timestamp)}</span>
            </div>
            ${entry.note ? `<p class="journal-note">${entry.note}</p>` : ''}
        </div>
    `).join('');
}

// History functionality
async function loadHistory() {
    try {
        const response = await fetch('/api/history');
        const data = await response.json();
        
        if (data.success) {
            displayHistory(data.history);
        } else {
            console.error('Failed to load history');
        }
    } catch (error) {
        console.error('History loading error:', error);
    }
}

function displayHistory(history) {
    const historyGrid = document.getElementById('historyGrid');
    
    if (history.length === 0) {
        historyGrid.innerHTML = '<p class="no-history">No emotion history yet. Capture your first emotion above!</p>';
        return;
    }
    
    const emotionIcons = {
        happy: 'fa-smile',
        sad: 'fa-frown',
        angry: 'fa-angry',
        neutral: 'fa-meh',
        surprise: 'fa-surprise',
        fear: 'fa-dizzy',
        disgust: 'fa-grimace'
    };
    
    historyGrid.innerHTML = history.slice(0, 20).map(record => `
        <div class="history-item">
            <div class="history-emotion">
                <i class="fas ${emotionIcons[record.emotion] || 'fa-meh'}"></i>
            </div>
            <div class="history-content">
                <h4>${MoodVibe.capitalizeFirst(record.emotion)}</h4>
                <p>${MoodVibe.formatDate(record.timestamp)}</p>
                <p>Confidence: ${Math.round(record.confidence * 100)}%</p>
            </div>
        </div>
    `).join('');
}

async function refreshHistory() {
    MoodVibe.showNotification('Refreshing history...', 'info');
    await loadHistory();
    await loadMoodJournal();
    MoodVibe.showNotification('History refreshed', 'success');
}

// Playlist generation
async function generatePlaylist() {
    try {
        MoodVibe.showLoading();
        
        const response = await fetch('/api/generate_playlist');
        const data = await response.json();
        
        if (data.success) {
            downloadPlaylist(data.playlist);
            MoodVibe.showNotification('Playlist generated successfully!', 'success');
        } else {
            MoodVibe.showNotification('Failed to generate playlist', 'error');
        }
    } catch (error) {
        console.error('Playlist generation error:', error);
        MoodVibe.showNotification('Failed to generate playlist', 'error');
    } finally {
        MoodVibe.hideLoading();
    }
}

function downloadPlaylist(playlistContent) {
    const blob = new Blob([playlistContent], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-playlist-${new Date().toISOString().split('T')[0]}.m3u`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Cleanup function
window.addEventListener('beforeunload', function() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
    }
});

// Add custom styles for home page
const homeStyles = `
    .no-recommendations,
    .no-entries,
    .no-history {
        text-align: center;
        color: var(--text-secondary);
        padding: 40px;
        font-style: italic;
    }
    
    .recommendation-card[data-type="movie"] {
        border-left: 4px solid #f59e0b;
    }
    
    .recommendation-card[data-type="song"] {
        border-left: 4px solid #10b981;
    }
    
    .recommendation-card[data-type="book"] {
        border-left: 4px solid #8b5cf6;
    }
    
    .recommendation-type {
        background: var(--primary-color);
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 0.8rem;
        font-weight: 500;
    }
    
    .rating {
        color: var(--accent-color);
        font-weight: 600;
    }
    
    .author {
        color: var(--text-secondary);
        font-style: italic;
    }
`;

// Add home styles to document
const homeStyleElement = document.createElement('style');
homeStyleElement.textContent = homeStyles;
document.head.appendChild(homeStyleElement);