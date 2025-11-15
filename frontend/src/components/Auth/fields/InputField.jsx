import { Input } from "@/components/ui/input";

export function InputField({ register, error, ...props }) {
  return (
    <div>
      <Input {...register} className="h-12" {...props} />
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
  );
}
