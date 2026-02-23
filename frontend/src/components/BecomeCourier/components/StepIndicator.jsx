import React from "react";

export const StepIndicator = ({ currentStep, totalSteps }) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8 space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>
          Step {currentStep} of {totalSteps}
        </span>
        <span>{Math.round(progressPercentage)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-zinc-700">
        <div
          className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};
