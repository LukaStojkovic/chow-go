import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";

export default function UserMenu({ name, profilePicture, onLogout }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 outline-none">
          <img
            src={profilePicture}
            alt={name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-green-500/30"
          />
          <span className="font-medium text-lg">{name}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent align="end" className="w-56 mt-2">
          <DropdownMenuItem className="cursor-pointer group text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
            <User className="w-4 h-4 mr-3 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer group text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
            <Settings className="w-4 h-4 mr-3 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onLogout}
            className="cursor-pointer group text-red-600! group-hover:text-red-700! dark:text-red-400! dark:group-hover:text-red-300! focus:bg-red-50 dark:focus:bg-red-900/20"
          >
            <LogOut className="w-4 h-4 mr-3 text-red-600 dark:text-red-400 group-hover:text-red-700! dark:group-hover:text-red-300!" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
