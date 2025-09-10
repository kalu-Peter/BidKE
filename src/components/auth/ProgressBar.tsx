import React from "react";

interface ProgressBarProps {
  steps: string[];
  currentStep: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index < currentStep
                  ? "bg-green-500 text-white"
                  : index === currentStep
                  ? "bg-primary text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {index < currentStep ? "✓" : index + 1}
            </div>
            <span className={`ml-2 text-sm ${index === currentStep ? "text-primary font-medium" : "text-gray-600"}`}>
              {step}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 ${
                  index < currentStep ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
