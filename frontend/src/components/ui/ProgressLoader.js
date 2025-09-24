import React, { useState, useEffect } from 'react';

const ProgressLoader = ({ isVisible, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: 0, text: "Uploading file...", icon: "📤" },
    { id: 1, text: "Extracting text from PDF...", icon: "📄" },
    { id: 2, text: "Analyzing content with AI...", icon: "🤖" },
    { id: 3, text: "Extracting candidate information...", icon: "👤" },
    { id: 4, text: "Processing skills and experience...", icon: "⚡" },
    { id: 5, text: "Saving to resume bank...", icon: "💾" },
    { id: 6, text: "Finalizing...", icon: "✨" }
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete && onComplete();
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 150);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return steps.length - 1;
        }
        return prev + 1;
      });
    }, 800);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-bounce">
            {steps[currentStep]?.icon || "🚀"}
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Processing Resume
          </h3>
          
          <p className="text-gray-600 mb-6">
            {steps[currentStep]?.text || "Please wait..."}
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-500 mb-4">
            <span>0%</span>
            <span className="font-medium">{progress}%</span>
            <span>100%</span>
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-center space-x-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index <= currentStep 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <p className="text-xs text-gray-400 mt-4">
            This may take a few moments...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProgressLoader;
