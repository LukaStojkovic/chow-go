import React from "react";

export const StepIndicator = ({ currentStep, totalSteps }) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8 space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground ">
        <span>
          Step {currentStep} of {totalSteps}
        </span>
        <span>{Math.round(progressPercentage)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary ">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};
