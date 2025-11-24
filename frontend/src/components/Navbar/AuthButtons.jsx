import { Button } from "../ui/button";

export default function AuthButtons({ onLogin, onSignup }) {
  return (
    <>
      <Button onClick={onLogin} variant="ghost" className="font-medium">
        Log In
      </Button>
      <Button
        onClick={onSignup}
        className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg rounded-xl px-6"
      >
        Sign Up Free
      </Button>
    </>
  );
}
