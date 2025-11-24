import { Button } from "../ui/button";
import Modal from "../Modal";
import { LoginForm } from "./forms/LoginForm";
import { RegisterForm } from "./forms/RegisterForm";
import { useAuthForm } from "./hooks/useAuthForm";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Spinner from "@/components/Spinner"; // ← tvoj spinner

export default function AuthModal({ isOpen, setIsOpen, isLoginModal = false }) {
  const [isLogin, setIsLogin] = useState(isLoginModal);

  const auth = useAuthForm(isLogin);
  const { isLoggingIn, isRegistering } = useAuthStore();

  useEffect(() => {
    setIsLogin(isLoginModal);
  }, [isLoginModal]);

  const toggleForm = () => setIsLogin(!isLogin);

  const isLoading = auth.isSubmitting || isLoggingIn || isRegistering;

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={isLogin ? "Welcome Back!" : "Join Chow & Go"}
      description={
        isLogin
          ? "Log in to track your orders and save favorites."
          : "Create an account to start ordering in seconds."
      }
      size="md"
      footer={
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="auth-form"
            disabled={isLoading}
            className="min-w-32 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium flex items-center justify-center gap-3 px-8"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                {isLogin ? "Logging in..." : "Creating account..."}
              </>
            ) : (
              <>{isLogin ? "Log In" : "Sign Up"}</>
            )}
          </Button>
        </div>
      }
    >
      <form id="auth-form" onSubmit={auth.onSubmit} className="space-y-5">
        {isLogin ? (
          <LoginForm register={auth.register} errors={auth.errors} />
        ) : (
          <RegisterForm
            register={auth.register}
            control={auth.control}
            errors={auth.errors}
            role={auth.role}
            setRole={auth.setRole}
            imagePreview={auth.imagePreview}
            handleImageChange={auth.handleImageChange}
            removeImage={auth.removeImage}
            watchedRole={auth.watchedRole}
          />
        )}

        <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={toggleForm}
            disabled={isLoading}
            className="text-green-600 dark:text-green-400 font-medium hover:underline focus:outline-none disabled:opacity-50"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
