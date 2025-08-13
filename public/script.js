// =====================
// INITIALIZATION
// =====================
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 30;
  
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
  
      const size = Math.random() * 30 + 5;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
  
      const posX = Math.random() * 100;
      const posY = Math.random() * 100 + 100;
      particle.style.left = `${posX}%`;
      particle.style.top = `${posY}%`;
  
      const duration = Math.random() * 20 + 15;
      particle.style.animationDuration = `${duration}s`;
  
      const delay = Math.random() * 5;
      particle.style.animationDelay = `${delay}s`;
  
      particlesContainer.appendChild(particle);
    }
  }
  
  // DOM Elements
  const fetchBtn = document.getElementById('fetchBtn');
  const videoUrl = document.getElementById('videoUrl');
  const resultsSection = document.getElementById('resultsSection');
  const platformTabs = document.querySelectorAll('.platform-tab');
  const platformHint = document.getElementById('platformHint');
  const qualityOptions = document.getElementById('qualityOptions');
  const downloadStatus = document.getElementById('downloadStatus');
  const progressFill = document.getElementById('progressFill');
  const statusText = document.getElementById('statusText');
  const completedDownload = document.getElementById('completedDownload');
  const newDownloadBtn = document.getElementById('newDownload');
  const videoTitle = document.getElementById('videoTitle');
  const videoThumb = document.getElementById('videoThumb');
  const videoDuration = document.getElementById('videoDuration');
  const videoViews = document.getElementById('videoViews');
  const videoDate = document.getElementById('videoDate');
  const themeToggle = document.getElementById('themeToggle');
  const cyberToggle = document.getElementById('cyberpunkToggle');
  const body = document.body;
  const pasteBtn = document.getElementById('pasteBtn');
  const clearBtn = document.getElementById('clearBtn');
  const voiceBtn = document.getElementById('voiceBtn');
  const historyBtn = document.getElementById('historyBtn');
  const historyPanel = document.getElementById('historyPanel');
  const proModeToggle = document.getElementById('proModeToggle');
  const proOptions = document.getElementById('proOptions');
  const dragDropZone = document.getElementById('dragDropZone');
  const historyList = document.getElementById('historyList');
  const closeHistory = document.getElementById('closeHistory');
  
  let currentPlatform = 'youtube';
  let currentVideoUrl = '';
  let currentVideoInfo = null;
  let eventSource = null;
  let downloadTimeout = null;
  let isDownloading = false;
  let downloadHandled = false; // Indicates "we've acknowledged a download result" (error/success)
  let downloadFinalized = false; // Ensures downloadComplete runs only once
  let recognition = null;
  let currentScanAnimation = null;
  
  // Platform hints
  const platformHints = {
    youtube: "YouTube videos in 4K, 8K, HD, or MP3 format",
    instagram: "Instagram Reels, Stories, IGTV, and posts",
    twitter: "Twitter (X) videos from tweets and moments",
    facebook: "Facebook videos from pages, groups, and profiles",
    tiktok: "TikTok videos without watermark"
  };
  
  // =====================
  // THEME MANAGEMENT
  // =====================
  function loadTheme() {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      const cyberMode = localStorage.getItem('cyberMode') === 'true';
      
      body.className = savedTheme + '-theme';
      if (cyberMode && savedTheme === 'dark') {
          body.classList.add('cyberpunk-theme');
      }
      
      themeToggle.innerHTML = savedTheme === 'dark' ? 
          '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
      cyberToggle.style.display = savedTheme === 'dark' ? 'flex' : 'none';
  }
  
  themeToggle.addEventListener('click', () => {
      const isDark = body.classList.contains('dark-theme');
      body.className = isDark ? 'light-theme' : 'dark-theme';
      localStorage.setItem('theme', isDark ? 'light' : 'dark');
      
      themeToggle.innerHTML = isDark ? 
          '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      
      cyberToggle.style.display = isDark ? 'none' : 'flex';
      
      if (!isDark) {
          body.classList.remove('cyberpunk-theme');
          localStorage.setItem('cyberMode', 'false');
      }
  });
  
  cyberToggle.addEventListener('click', () => {
      const isCyber = body.classList.contains('cyberpunk-theme');
      if (isCyber) {
          body.classList.remove('cyberpunk-theme');
      } else {
          body.classList.add('cyberpunk-theme');
      }
      localStorage.setItem('cyberMode', (!isCyber).toString());
  });
  
  // =====================
  // QUICK ACTIONS TOOLBAR
  // =====================
  pasteBtn.addEventListener('click', async () => {
      try {
          const text = await navigator.clipboard.readText();
          if (text) {
              videoUrl.value = text;
              pasteBtn.innerHTML = '<i class="fas fa-check"></i>';
              setTimeout(() => {
                  pasteBtn.innerHTML = '<i class="fas fa-paste"></i>';
              }, 2000);
          }
      } catch (err) {
          console.error('Failed to paste:', err);
          statusText.textContent = "Clipboard access denied. Please paste manually.";
          statusText.className = "status-text warning";
      }
  });
  
  clearBtn.addEventListener('click', () => {
      videoUrl.value = '';
      videoUrl.focus();
      clearBtn.classList.add('animate');
      setTimeout(() => clearBtn.classList.remove('animate'), 500);
  });
  
  voiceBtn.addEventListener('click', () => {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRec) {
          alert("Your browser doesn't support voice commands. Try Chrome or Edge.");
          return;
      }
  
      voiceBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
      voiceBtn.classList.add('recording');
      
      recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          videoUrl.value = transcript;
          
          if (transcript.toLowerCase().includes('download')) {
              fetchVideoInfo();
          }
          
          voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
          voiceBtn.classList.remove('recording');
      };
      
      recognition.onerror = () => {
          voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
          voiceBtn.classList.remove('recording');
      };
      
      recognition.start();
  });
  
  // =====================
  // HISTORY MANAGEMENT
  // =====================
  function saveToHistory(videoInfo) {
      const history = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
      
      // Avoid duplicates
      if (!history.some(item => item.url === currentVideoUrl)) {
          history.unshift({
              url: currentVideoUrl,
              title: videoInfo.title,
              thumbnail: videoInfo.thumbnail,
              date: new Date().toISOString()
          });
          
          // Keep only last 50 items
          if (history.length > 50) history.pop();
          
          localStorage.setItem('downloadHistory', JSON.stringify(history));
      }
  }
  
  function loadDownloadHistory() {
      const history = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
      historyList.innerHTML = '';
      
      history.forEach(item => {
          const historyItem = document.createElement('div');
          historyItem.className = 'history-item';
          
          const date = new Date(item.date);
          const formattedDate = date.toLocaleDateString();
          const formattedTime = date.toLocaleTimeString();
          
          historyItem.innerHTML = `
              <img src="${item.thumbnail}" class="history-thumb" alt="Thumbnail">
              <div class="history-details">
                  <div class="history-title">${item.title}</div>
                  <div class="history-meta">
                      <span>${formattedDate}</span>
                      <span>${formattedTime}</span>
                  </div>
              </div>
              <button class="history-action" data-url="${item.url}">
                  <i class="fas fa-redo"></i>
              </button>
          `;
          
          historyList.appendChild(historyItem);
      });
      
      // Add event listeners to re-download buttons
      document.querySelectorAll('.history-action').forEach(btn => {
          btn.addEventListener('click', () => {
              const url = btn.dataset.url;
              videoUrl.value = url;
              historyPanel.style.display = 'none';
              fetchVideoInfo();
          });
      });
  }
  
  historyBtn.addEventListener('click', () => {
      loadDownloadHistory();
      historyPanel.style.display = 'block';
  });
  
  closeHistory.addEventListener('click', () => {
      historyPanel.style.display = 'none';
  });
  
  // =====================
  // DRAG & DROP FUNCTIONALITY
  // =====================
  dragDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragDropZone.classList.add('active');
  });
  
  dragDropZone.addEventListener('dragleave', () => {
      dragDropZone.classList.remove('active');
  });
  
  dragDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dragDropZone.classList.remove('active');
      
      const text = e.dataTransfer.getData('text/plain');
      if (text) {
          videoUrl.value = text;
          if (text.includes('http')) {
              fetchVideoInfo();
          }
      }
  });
  
  // =====================
  // PRO MODE FUNCTIONALITY
  // =====================
  proModeToggle.addEventListener('change', () => {
      proOptions.style.display = proModeToggle.checked ? 'block' : 'none';
      localStorage.setItem('proMode', proModeToggle.checked.toString());
  });
  
  // Load pro mode setting
  proModeToggle.checked = localStorage.getItem('proMode') === 'true';
  proOptions.style.display = proModeToggle.checked ? 'block' : 'none';
  
  // =====================
  // KEYBOARD SHORTCUTS
  // =====================
  document.addEventListener('keydown', (e) => {
      // Ctrl+V to paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          pasteBtn.click();
      }
      
      // Enter to download
      if (e.key === 'Enter' && document.activeElement === videoUrl) {
          fetchBtn.click();
      }
  });
  
  // =====================
  // SCI-FI LOADING ANIMATION
  // =====================
  function addScanAnimation(element) {
      const scan = document.createElement('div');
      scan.className = 'scan-animation';
      element.appendChild(scan);
      return scan;
  }
  
  function removeScanAnimation(scan) {
    try {
      if (scan && scan.remove) scan.remove();
    } catch (e) { /* ignore */ }
  }
  
  // =====================
  // MAIN FUNCTIONALITY
  // =====================
  // Event Listeners
  fetchBtn.addEventListener('click', fetchVideoInfo);
  newDownloadBtn.addEventListener('click', resetDownloader);
  
  platformTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      platformTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentPlatform = tab.dataset.platform;
      platformHint.textContent = platformHints[currentPlatform];
      clearSearchResultsAndInput();
  
      switch(currentPlatform) {
        case 'youtube':
          videoUrl.placeholder = "https://www.youtube.com/watch?v=...";
          break;
        case 'instagram':
          videoUrl.placeholder = "https://www.instagram.com/p/...";
          break;
        case 'twitter':
          videoUrl.placeholder = "https://twitter.com/.../status/...";
          break;
        case 'facebook':
          videoUrl.placeholder = "https://www.facebook.com/watch/?v=...";
          break;
        case 'tiktok':
          videoUrl.placeholder = "https://www.tiktok.com/@.../video/...";
          break;
      }
    });
  });
  
  function setDownloadButtonsDisabled(state) {
    document.querySelectorAll('.download-action').forEach(btn => {
      try { btn.disabled = !!state; } catch (e) {}
    });
  }
  
  function clearSearchResultsAndInput() {
    closeEventSource();
    clearTimeout(downloadTimeout);
  
    isDownloading = false;
    downloadHandled = false;
    downloadFinalized = false;
    setDownloadButtonsDisabled(false);
    videoUrl.value = '';
    currentVideoInfo = null;
    currentVideoUrl = '';
  
    qualityOptions.innerHTML = '';
    resultsSection.style.display = 'none';
  
    downloadStatus.style.display = 'none';
    completedDownload.style.display = 'none';
    progressFill.style.width = '0%';
    statusText.textContent = "Preparing download...";
    statusText.className = "status-text";
  }
  
  function normalizeYouTubeUrl(url) {
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return url;
  }
  
  async function fetchVideoInfo() {
    let url = videoUrl.value.trim();
  
    if (url.includes('youtu.be')) {
      url = normalizeYouTubeUrl(url);
    }
  
    currentVideoUrl = url;
  
    if (!url) {
      videoUrl.placeholder = "Please enter a valid URL...";
      videoUrl.style.borderColor = "#ff2d75";
      videoUrl.focus();
  
      setTimeout(() => {
        videoUrl.style.borderColor = "rgba(106, 17, 203, 0.3)";
      }, 2000);
      return;
    }
  
    fetchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';
    fetchBtn.disabled = true;
  
    try {
      const response = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
  
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch video info');
      }
  
      const videoData = await response.json();
      currentVideoInfo = videoData;
      saveToHistory(videoData);
      displayVideoResults(videoData);
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error(err);
    } finally {
      fetchBtn.innerHTML = '<i class="fas fa-download"></i> Fetch Video';
      fetchBtn.disabled = false;
    }
  }
  
  function displayVideoResults(videoData) {
    videoTitle.textContent = videoData.title;
    videoThumb.src = videoData.thumbnail;
    videoDuration.textContent = videoData.duration;
    videoViews.textContent = videoData.views;
    videoDate.textContent = videoData.date;
  
    qualityOptions.innerHTML = '';
  
    (videoData.formats || []).forEach(format => {
      const option = document.createElement('div');
      option.className = 'quality-option';
  
      option.innerHTML = `
        <div class="quality-label">${format.resolution}</div>
        <div class="quality-desc">${format.container} • ${format.codec}</div>
        <div class="quality-size">${format.sizeMB > 0 ? format.sizeMB + ' MB' : 'Unknown'}</div>
        <button class="download-action" data-itag="${format.itag}" data-hasaudio="${format.hasAudio}">
          <i class="fas fa-download"></i> Download
        </button>
      `;
  
      const downloadBtn = option.querySelector('.download-action');
      downloadBtn.addEventListener('click', function() {
        if (isDownloading) {
          alert('A download is already in progress. Please wait until it finishes.');
          return;
        }
  
        const videoItag = this.dataset.itag;
        const hasAudio = this.dataset.hasaudio === 'true';
  
        if (!hasAudio && currentVideoInfo && (currentVideoInfo.audioFormats || []).length > 0) {
          showAudioSelector(videoItag);
        } else {
          startDownload(currentVideoUrl, videoItag);
        }
      });
  
      qualityOptions.appendChild(option);
    });
  
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }
  
  function showAudioSelector(videoItag) {
    const modal = document.createElement('div');
    modal.className = 'audio-modal';
    modal.innerHTML = `
      <div class="audio-modal-content">
        <h3>Select Audio Quality</h3>
        <p>This video format doesn't include audio. Please select an audio track:</p>
        <div class="audio-options" id="audioOptions"></div>
        <div class="modal-buttons">
          <button id="cancelAudio">Cancel</button>
        </div>
      </div>
    `;
  
    document.body.appendChild(modal);
  
    const audioOptions = modal.querySelector('#audioOptions');
  
    (currentVideoInfo.audioFormats || []).forEach(audio => {
      const option = document.createElement('div');
      option.className = 'audio-option';
      option.innerHTML = `
        <input type="radio" name="audio" id="audio-${audio.itag}" value="${audio.itag}">
        <label for="audio-${audio.itag}">${audio.container.toUpperCase()} • ${audio.bitrate}kbps</label>
      `;
      audioOptions.appendChild(option);
    });
  
    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'confirmAudio';
    confirmBtn.textContent = 'Download with Audio';
    modal.querySelector('.modal-buttons').appendChild(confirmBtn);
  
    confirmBtn.addEventListener('click', () => {
      const selectedAudio = modal.querySelector('input[name="audio"]:checked');
      if (selectedAudio) {
        const audioItag = selectedAudio.value;
        document.body.removeChild(modal);
        startDownload(currentVideoUrl, videoItag, audioItag);
      } else {
        alert('Please select an audio quality');
      }
    });
  
    modal.querySelector('#cancelAudio').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }
  
  function parseProgressText(text) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {}
  
    const percentMatch = text.match(/(\d+(?:\.\d+)?)%/);
    if (percentMatch) {
      return { progress: parseFloat(percentMatch[1]) };
    }
  
    if (text.toLowerCase().includes('downloading')) return { status: 'Downloading...' };
    if (text.toLowerCase().includes('final')) return { status: 'Finalizing...' };
    if (text.toLowerCase().includes('error')) return { error: text.trim() };
  
    return { status: text.trim() };
  }
  
  function handleProgressData(data) {
    let payload = data;
    if (typeof data === 'string') {
      payload = parseProgressText(data);
    }
  
    if (!payload || typeof payload !== 'object') return;
  
    if (typeof payload.progress === 'number') {
      const p = Math.max(0, Math.min(100, payload.progress));
      progressFill.style.width = `${p}%`;
  
      if (p <= 20) {
        statusText.textContent = "Connecting to source...";
      } else if (p <= 40) {
        statusText.textContent = "Processing video data...";
      } else if (p <= 60) {
        statusText.textContent = "Downloading video stream...";
      } else if (p <= 80) {
        statusText.textContent = "Merging streams...";
      } else if (p < 100) {
        statusText.textContent = "Finalizing download...";
      } else {
        statusText.textContent = "Finalizing download...";
      }
    }
  
    if (payload.status) {
      statusText.textContent = payload.status;
    }
  
    if (payload.error) {
      if (!downloadHandled) {
        downloadHandled = true;
        statusText.textContent = `Error: ${payload.error}`;
        statusText.className = "status-text error";
        clearTimeout(downloadTimeout);
        closeEventSource();
        isDownloading = false;
        setDownloadButtonsDisabled(false);
        removeScanAnimation(currentScanAnimation);
        currentScanAnimation = null;
      }
    }
  
    if (payload.complete) {
      if (!downloadHandled) {
        downloadHandled = true;
        clearTimeout(downloadTimeout);
        progressFill.style.width = '100%';
        statusText.textContent = "Finalizing download...";
        closeEventSource();
        // call finalization after small timeout to let UI show 100%
        setTimeout(() => {
          downloadComplete(payload.file);
        }, 800);
      }
    }
  }
  
  function closeEventSource() {
    if (!eventSource) return;
  
    try {
      eventSource.close();
    } catch (e) { /* ignore */ }
    eventSource = null;
  }
  
  async function startDownload(url, videoItag, audioItag = null) {
    if (isDownloading) {
      alert('A download is already in progress. Please wait until it finishes.');
      return;
    }
  
    // reset per-download flags
    isDownloading = true;
    downloadHandled = false;
    downloadFinalized = false;
    setDownloadButtonsDisabled(true);
  
    if (url.includes('youtu.be')) {
      url = normalizeYouTubeUrl(url);
    }
  
    qualityOptions.style.display = 'none';
    downloadStatus.style.display = 'block';
    progressFill.style.width = '0%';
    statusText.textContent = "Preparing download...";
    statusText.className = "status-text";
  
    // Add sci-fi loading animation
    currentScanAnimation = addScanAnimation(downloadStatus);
  
    closeEventSource();
    clearTimeout(downloadTimeout);
    
    downloadTimeout = setTimeout(() => {
      statusText.textContent = "Download taking longer than expected...";
      statusText.className = "status-text warning";
    }, 30000);
  
    try {
      // EventSource for progress
      try {
        eventSource = new EventSource(`/api/download/progress`);
      } catch (e) {
        console.error('Failed to create EventSource', e);
        statusText.textContent = "Realtime progress not available.";
        statusText.className = "status-text warning";
        eventSource = null;
      }
  
      if (eventSource) {
        eventSource.addEventListener('progress', (event) => {
          try {
            handleProgressData(event.data);
          } catch (e) {
            console.error('Error handling progress event:', e);
          }
        });
  
        eventSource.onerror = (err) => {
          console.error('EventSource error:', err);
          statusText.textContent = "Realtime connection error. Progress may be delayed.";
          statusText.className = "status-text warning";
        };
      }
  
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url, 
          videoItag, 
          audioItag,
          proMode: proModeToggle.checked,
          format: document.getElementById('formatSelect').value,
          bitrate: document.getElementById('bitrateSelect').value,
          retries: document.getElementById('retryInput').value
        })
      });
  
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Download failed');
      }
  
      const result = await response.json().catch(() => null);
      if (result && result.success) {
        if (!downloadHandled) {
          // wait a little UI time and then finish
          setTimeout(() => {
            downloadComplete(result.file);
          }, 800);
        }
      }
    } catch (err) {
      if (eventSource) {
        try { closeEventSource(); } catch (e) {}
      }
      statusText.textContent = `Error: ${err.message}`;
      statusText.className = "status-text error";
      console.error(err);
  
      isDownloading = false;
      downloadHandled = false;
      setDownloadButtonsDisabled(false);
      
      if (currentScanAnimation) {
        removeScanAnimation(currentScanAnimation);
        currentScanAnimation = null;
      }
    }
  }
  
  function downloadComplete(filename) {
    if (downloadFinalized) return;
    downloadFinalized = true;
    downloadHandled = true;
  
    console.log('Download complete! File:', filename);
  
    isDownloading = false;
    setDownloadButtonsDisabled(false);
  
    downloadStatus.style.display = 'none';
    completedDownload.style.display = 'block';
  
    // remove scan animation if present
    if (currentScanAnimation) {
      removeScanAnimation(currentScanAnimation);
      currentScanAnimation = null;
    }
  
    setTimeout(() => {
      const downloadLink = document.createElement('a');
      downloadLink.href = `/downloads/${filename}`;
      downloadLink.download = filename;
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
  
      downloadLink.addEventListener('click', () => {
        setTimeout(() => {
          try { downloadLink.remove(); } catch (e) {}
        }, 100);
      }, { once: true });
  
      downloadLink.click();
      showConfetti();
    }, 500);
  }
  
  function resetDownloader() {
    completedDownload.style.display = 'none';
    qualityOptions.style.display = 'grid';
    downloadStatus.style.display = 'none';
    videoUrl.value = '';
    videoUrl.focus();
    progressFill.style.width = '0%';
    statusText.textContent = "Preparing download...";
    statusText.className = "status-text";
  
    closeEventSource();
    clearTimeout(downloadTimeout);
  
    isDownloading = false;
    downloadHandled = false;
    downloadFinalized = false;
    setDownloadButtonsDisabled(false);
  
    if (currentScanAnimation) {
      removeScanAnimation(currentScanAnimation);
      currentScanAnimation = null;
    }
  
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  function showConfetti() {
    const colors = ['#ff2d75', '#00f3ff', '#6a11cb', '#2575fc', '#ffffff'];
    const container = document.querySelector('.video-card');
  
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'absolute';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = '50%';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.top = '-20px';
      confetti.style.opacity = '0';
      confetti.style.zIndex = '1000';
  
      container.appendChild(confetti);
  
      const animation = confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${Math.random() * 300 + 300}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
      ], {
        duration: Math.random() * 2000 + 2000,
        easing: 'cubic-bezier(0,0,0.2,1)'
      });
  
      animation.onfinish = () => confetti.remove();
    }
  }
  
  // Initialize on load
  window.addEventListener('load', () => {
    createParticles();
    loadTheme();
    
    // Auto theme by time
    const hour = new Date().getHours();
    if (localStorage.getItem('theme') === 'auto') {
      body.className = (hour > 18 || hour < 6) ? 'dark-theme' : 'light-theme';
    }
  });
  