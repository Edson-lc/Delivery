import { useState, useCallback, useRef } from 'react';

export function useNotificationSound() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundType, setSoundType] = useState('classic');
  const alertIntervalRef = useRef(null);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      console.log(`🔊 Tocando som de notificação: ${soundType}`);
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurações diferentes para cada tipo de som
      const soundConfigs = {
        classic: {
          frequencies: [800, 600, 800],
          times: [0, 0.1, 0.2],
          duration: 0.3,
          gain: 0.3
        },
        bell: {
          frequencies: [1000, 1200, 1000, 800],
          times: [0, 0.1, 0.2, 0.3],
          duration: 0.5,
          gain: 0.4
        },
        chime: {
          frequencies: [523, 659, 784],
          times: [0, 0.1, 0.2],
          duration: 0.4,
          gain: 0.3
        },
        beep: {
          frequencies: [1000],
          times: [0],
          duration: 0.2,
          gain: 0.2
        },
        custom: {
          frequencies: [440, 554, 659, 880],
          times: [0, 0.1, 0.2, 0.3],
          duration: 0.6,
          gain: 0.3
        }
      };

      const config = soundConfigs[soundType] || soundConfigs.classic;
      
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
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.play().catch(() => {});
      } catch (fallbackError) {
        console.log("❌ Fallback também falhou:", fallbackError);
      }
    }
  }, [soundEnabled, soundType]);

  const startContinuousAlert = useCallback(() => {
    console.log("🚨 Iniciando alerta contínuo...");
    
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
    }
    
    playNotificationSound();
    
    alertIntervalRef.current = setInterval(() => {
      console.log("🔔 Tocando som de alerta...");
      playNotificationSound();
    }, 3000);
    
    console.log("✅ Alerta contínuo configurado!");
  }, [playNotificationSound]);

  const stopContinuousAlert = useCallback(() => {
    console.log("🔇 Parando alerta contínuo...");
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = null;
      console.log("✅ Alerta contínuo parado!");
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  const changeSoundType = useCallback((newType) => {
    setSoundType(newType);
  }, []);

  // Limpar intervalos quando o componente for desmontado
  const cleanup = useCallback(() => {
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = null;
    }
  }, []);

  return {
    soundEnabled,
    soundType,
    setSoundEnabled,
    setSoundType,
    playNotificationSound,
    startContinuousAlert,
    stopContinuousAlert,
    toggleSound,
    changeSoundType,
    cleanup
  };
}
