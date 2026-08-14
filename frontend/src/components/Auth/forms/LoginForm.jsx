import { motion } from "framer-motion";
import { InputField } from "../fields/InputField";
import { GoogleButton } from "./GoogleButton";

export function LoginForm({ register, errors, onForgotPassword }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <InputField
        register={register("email")}
        type="email"
        placeholder="Email"
        error={errors.email}
      />
      <InputField
        register={register("password")}
        type="password"
        placeholder="Password"
        error={errors.password}
      />
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register("rememberMe")}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-gray-700 dark:text-gray-300">Remember me</span>
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium transition-colors"
        >
          Forgot password?
        </button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-400 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 rounded-full text-slate-600">
            Or continue with
          </span>
        </div>
      </div>
      
      <GoogleButton />
    </motion.div>
  );
}
