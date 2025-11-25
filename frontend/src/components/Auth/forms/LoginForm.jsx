import { motion } from "framer-motion";
import { InputField } from "../fields/InputField";

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
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="rounded" />
          <span>Remember me</span>
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-green-600 hover:underline cursor-pointer"
        >
          Forgot password?
        </button>
      </div>
    </motion.div>
  );
}
