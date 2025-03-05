import React from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000); // Show splash screen for 3 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center z-50">
      <div className="text-center">
        <img 
          src="/heart.svg" 
          alt="Rádio Tatuapé FM Slots"
          className="w-24 h-24 mx-auto mb-6 animate-heartbeat"
        />
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-blink">
          Rádio Tatuapé FM Slots
        </h1>
      </div>
    </div>
  );
};

export default SplashScreen;