/**
 * Utilitários para geração e reprodução de sons
 */

/**
 * Configurações de som disponíveis
 */
export const SOUND_CONFIGS = {
  classic: {
    frequencies: [800, 600, 800],
    times: [0, 0.1, 0.2],
    duration: 0.3,
    gain: 0.3,
    label: 'Clássico'
  },
  bell: {
    frequencies: [1000, 1200, 1000, 800],
    times: [0, 0.1, 0.2, 0.3],
    duration: 0.5,
    gain: 0.4,
    label: 'Sino'
  },
  chime: {
    frequencies: [523, 659, 784],
    times: [0, 0.1, 0.2],
    duration: 0.4,
    gain: 0.3,
    label: 'Carilhão'
  },
  beep: {
    frequencies: [1000],
    times: [0],
    duration: 0.2,
    gain: 0.2,
    label: 'Beep'
  },
  custom: {
    frequencies: [440, 554, 659, 880],
    times: [0, 0.1, 0.2, 0.3],
    duration: 0.6,
    gain: 0.3,
    label: 'Personalizado'
  }
};

/**
 * Reproduz um som de notificação usando Web Audio API
 * @param {string} soundType - Tipo de som a ser reproduzido
 * @param {boolean} enabled - Se o som está habilitado
 * @returns {Promise<void>}
 */
export async function playNotificationSound(soundType = 'classic', enabled = true) {
  if (!enabled) return;

  try {
    console.log(`🔊 Tocando som de notificação: ${soundType}`);
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const config = SOUND_CONFIGS[soundType] || SOUND_CONFIGS.classic;
    
    // Configurar frequências
    config.frequencies.forEach((freq, index) => {
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + config.times[index]);
    });
    
    // Configurar volume
    gainNode.gain.setValueAtTime(config.gain, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + config.duration);
    
    console.log("✅ Som tocado com sucesso!");
  } catch (error) {
    console.log("❌ Erro ao tocar som:", error);
    
    // Fallback: usar beep do sistema
    await playFallbackSound();
  }
}

/**
 * Reproduz um som de fallback usando Audio API
 * @returns {Promise<void>}
 */
export async function playFallbackSound() {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    await audio.play();
  } catch (fallbackError) {
    console.log("❌ Fallback também falhou:", fallbackError);
  }
}

/**
 * Cria um som personalizado baseado em parâmetros
 * @param {Object} config - Configuração do som
 * @param {Array<number>} config.frequencies - Array de frequências
 * @param {Array<number>} config.times - Array de tempos
 * @param {number} config.duration - Duração total
 * @param {number} config.gain - Volume
 * @returns {Promise<void>}
 */
export async function playCustomSound(config) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configurar frequências
    config.frequencies.forEach((freq, index) => {
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + config.times[index]);
    });
    
    // Configurar volume
    gainNode.gain.setValueAtTime(config.gain, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + config.duration);
  } catch (error) {
    console.error("Erro ao reproduzir som personalizado:", error);
    await playFallbackSound();
  }
}

/**
 * Testa se o navegador suporta Web Audio API
 * @returns {boolean} - Se o navegador suporta Web Audio API
 */
export function supportsWebAudio() {
  return !!(window.AudioContext || window.webkitAudioContext);
}

/**
 * Testa se o navegador suporta Audio API
 * @returns {boolean} - Se o navegador suporta Audio API
 */
export function supportsAudio() {
  return !!window.Audio;
}

/**
 * Obtém a lista de tipos de som disponíveis
 * @returns {Array<Object>} - Array com tipos de som e suas configurações
 */
export function getAvailableSoundTypes() {
  return Object.entries(SOUND_CONFIGS).map(([key, config]) => ({
    value: key,
    label: config.label,
    ...config
  }));
}

/**
 * Valida se um tipo de som é válido
 * @param {string} soundType - Tipo de som a ser validado
 * @returns {boolean} - Se o tipo de som é válido
 */
export function isValidSoundType(soundType) {
  return Object.keys(SOUND_CONFIGS).includes(soundType);
}

/**
 * Obtém a configuração de um tipo de som
 * @param {string} soundType - Tipo de som
 * @returns {Object|null} - Configuração do som ou null se não encontrado
 */
export function getSoundConfig(soundType) {
  return SOUND_CONFIGS[soundType] || null;
}

/**
 * Cria um som de alerta contínuo
 * @param {string} soundType - Tipo de som
 * @param {number} interval - Intervalo entre repetições em ms
 * @param {number} maxRepetitions - Número máximo de repetições
 * @returns {Function} - Função para parar o alerta
 */
export function createContinuousAlert(soundType = 'classic', interval = 3000, maxRepetitions = 10) {
  let repetitionCount = 0;
  let intervalId = null;

  const playAlert = () => {
    if (repetitionCount >= maxRepetitions) {
      stopAlert();
      return;
    }

    playNotificationSound(soundType, true);
    repetitionCount++;
  };

  const startAlert = () => {
    console.log("🚨 Iniciando alerta contínuo...");
    playAlert(); // Tocar imediatamente
    
    intervalId = setInterval(playAlert, interval);
    console.log("✅ Alerta contínuo configurado!");
  };

  const stopAlert = () => {
    console.log("🔇 Parando alerta contínuo...");
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      repetitionCount = 0;
      console.log("✅ Alerta contínuo parado!");
    }
  };

  return {
    start: startAlert,
    stop: stopAlert,
    isRunning: () => intervalId !== null
  };
}
