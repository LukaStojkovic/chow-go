import { Input } from "@/components/ui/input";

export function InputField({ register, error, ...props }) {
  return (
    <div>
      <Input
        {...register}
        className="h-10 sm:h-12 rounded-lg sm:rounded-xl bg-card/50 border border-border hover:border-primary focus:border-primary focus:ring-ring/20 transition-colors text-sm placeholder:text-muted-foreground "
        {...props}
      />
      {error && <p className="text-destructive text-xs mt-1.5">{error.message}</p>}
    </div>
  );
}
