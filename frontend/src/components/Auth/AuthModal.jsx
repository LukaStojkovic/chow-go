import { Button } from "../ui/button";
import Modal from "../Modal";
import { LoginForm } from "./forms/LoginForm";
import { RegisterForm } from "./forms/RegisterForm";
import { useAuthForm } from "./hooks/useAuthForm";
import { useState, useEffect } from "react";

export default function AuthModal({ isOpen, setIsOpen, isLoginModal = false }) {
  const [isLogin, setIsLogin] = useState(isLoginModal);
  const auth = useAuthForm(isLogin);

  useEffect(() => {
    setIsLogin(isLoginModal);
  }, [isLoginModal]);

  const toggleForm = () => setIsLogin(!isLogin);

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
        <>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={auth.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="auth-form"
            disabled={auth.isSubmitting}
            className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            {auth.isSubmitting ? "Loading..." : isLogin ? "Log In" : "Sign Up"}
          </Button>
        </>
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

        <div className="text-center text-sm text-gray-600 pt-4">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={toggleForm}
            className="text-green-600 font-medium hover:underline focus:outline-none"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
