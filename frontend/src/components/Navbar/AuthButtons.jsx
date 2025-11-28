import { Button } from "../ui/button";

export default function AuthButtons({ onLogin, onSignup }) {
  return (
    <>
      <Button onClick={onLogin} variant="ghost" className="font-medium">
        Log In
      </Button>
      <Button
        onClick={onSignup}
        className="bg-linear-to-r from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500 hover:from-green-600 hover:to-emerald-700 dark:hover:from-green-500 dark:hover:to-emerald-600 text-white font-semibold shadow-lg rounded-xl px-6"
      >
        Sign Up Free
      </Button>
    </>
  );
}
