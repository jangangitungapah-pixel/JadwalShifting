let audioCtx;
let isUnlocked = false;
let pendingClick = null;
let lastHoverTime = 0;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  isUnlocked = true;
};

const playTone = (frequency, type, duration, vol, glideTo = null, isHighPriority = false) => {
  if (!isUnlocked || !audioCtx) return;

  const playNow = () => {
    try {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      if (glideTo) {
        oscillator.frequency.exponentialRampToValueAtTime(glideTo, audioCtx.currentTime + duration);
      }
      
      gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  // Sistem Prioritas: Suara penting akan membatalkan suara klik standar
  if (isHighPriority) {
    if (pendingClick) {
      clearTimeout(pendingClick);
      pendingClick = null;
    }
    playNow();
  } else {
    pendingClick = setTimeout(() => {
      playNow();
      pendingClick = null;
    }, 40); // Delay klik biasa selama 40ms, jika ada aksi penting (seperti success), klik dibatalkan.
  }
};

export const sounds = {
  init: initAudio,
  hover: () => {
    const now = Date.now();
    if (now - lastHoverTime > 100) { // Cegah suara hover bertumpuk berlebihan (throttle)
      lastHoverTime = now;
      playTone(800, 'sine', 0.03, 0.01, null, true); // Tick sangat pelan dan elegan
    }
  },
  click: () => playTone(450, 'sine', 0.05, 0.02, null, false), // Tap pelan, prioritas rendah
  success: () => {
    playTone(600, 'sine', 0.1, 0.03, null, true);
    setTimeout(() => playTone(800, 'sine', 0.15, 0.03, null, true), 100);
  },
  error: () => {
    playTone(200, 'triangle', 0.15, 0.03, null, true);
    setTimeout(() => playTone(150, 'triangle', 0.2, 0.03, null, true), 150);
  },
  modalOpen: () => playTone(400, 'sine', 0.1, 0.02, 600, true),
  modalClose: () => playTone(600, 'sine', 0.1, 0.02, 400, true),
  notification: () => playTone(500, 'sine', 0.1, 0.02, 700, true),
};
