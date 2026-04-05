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
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      )}

      {step < totalSteps ? (
        <button
          type="button"
          onClick={onNext}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:focus:ring-offset-zinc-900"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={isLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:focus:ring-offset-zinc-900"
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