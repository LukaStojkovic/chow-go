import { useAuthStore } from "@/store/useAuthStore";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Logo({
  className,
  title = "Chow & Go",
  showTitle = false,
}) {
  const { authUser } = useAuthStore();

  let redirectTo = "/";

  if (authUser) {
    if (authUser.role === "customer") {
      redirectTo = "/discovery";
    } else if (authUser.role === "seller") {
      redirectTo = "/seller/dashboard";
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-2 cursor-pointer"
    >
      <Link
        to={redirectTo}
        className={`flex items-center gap-2 shrink-0 ${className}`}
      >
        <img src="/logos/chow-logo-filled.png" className="size-10" />
        <span
          className={`text-base sm:text-xl font-bold tracking-tight ${
            showTitle ? "" : "hidden"
          } sm:inline`}
        >
          {title}
        </span>
      </Link>
    </motion.div>
  );
}
