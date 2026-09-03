import { Eye, EyeOff, Lock } from "lucide-react";

const PasswordField = ({
  label,
  name,
  show,
  setShow,
  placeholder,
  register,
  errors,
  isUpdatingProfile,
}) => (
  <div>
    <label className="block text-sm font-medium text-muted-foreground mb-2">
      {label}
    </label>
    <div className="relative">
      <Lock size={16} className="absolute left-3 top-3.5 text-muted-foreground" />
      <input
        {...register(name)}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        disabled={isUpdatingProfile}
        className="w-full pl-10 pr-12 py-2.5 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-3 text-muted-foreground hover:text-muted-foreground "
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
    {errors[name] && (
      <p className="mt-1 text-xs text-destructive ">
        {errors[name]?.message}
      </p>
    )}
  </div>
);

export default PasswordField;
