import React from "react";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";

export const FormNavigationButtons = ({
  step,
  totalSteps,
  onPrevious,
  onNext,
  isLoading,
}) => {
  return (
    <div className="flex gap-3 pt-4">
      {step > 1 && (
        <button
          type="button"
          onClick={onPrevious}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 "
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>      )}

      {step < totalSteps ? (
        <button
          type="button"
          onClick={onNext}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={isLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-zinc-900"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              Submit Application
              <Check className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
};