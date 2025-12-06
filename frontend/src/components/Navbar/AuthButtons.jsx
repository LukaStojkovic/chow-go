import { Button } from "../ui/button";

export default function AuthButtons({ onLogin, onSignup }) {
  return (
    <>
      <Button
        onClick={onLogin}
        variant="ghost"
        className="font-medium text-sm  transition-colors"
      >
        Log In
      </Button>
      <button
        onClick={onSignup}
        className="rounded-full bg-black px-6 py-2.5 font-bold text-white transition-transform hover:scale-105 active:scale-95 cursor-pointer dark:bg-white dark:text-black text-sm"
      >
        Sign up
      </button>
    </>
  );
}
