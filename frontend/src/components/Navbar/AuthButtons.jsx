import GlowButton from "../GlowButton";
import { Button } from "../ui/button";

export default function AuthButtons({ onLogin, onSignup }) {
  return (
    <>
      <Button onClick={onLogin} variant="ghost" className="font-medium">
        Log In
      </Button>
      <GlowButton onClick={onSignup}>Sign Up Free</GlowButton>
    </>
  );
}
