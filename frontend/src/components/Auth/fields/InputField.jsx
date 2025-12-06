import { Input } from "@/components/ui/input";

export function InputField({ register, error, ...props }) {
  return (
    <div>
      <Input
        {...register}
        className="h-10 sm:h-12 rounded-lg sm:rounded-xl bg-white/50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/20 transition-colors text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1.5">{error.message}</p>}
    </div>
  );
}
