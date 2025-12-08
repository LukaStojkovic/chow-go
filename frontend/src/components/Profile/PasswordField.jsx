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
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {label}
    </label>
    <div className="relative">
      <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
      <input
        {...register(name)}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        disabled={isUpdatingProfile}
        className="w-full pl-10 pr-12 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
    {errors[name] && (
      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
        {errors[name]?.message}
      </p>
    )}
  </div>
);

export default PasswordField;
