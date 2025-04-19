import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

const SignOutButton = () => {
  const router = useRouter();

  const handleSignOut = () => {
    authClient.signOut();
    router.navigate({ to: "/sign-in" });
  };

  return (
    <DropdownMenuItem
      className="min-w-46 cursor-pointer"
      onClick={handleSignOut}
    >
      <LogOut />
      Log Out
    </DropdownMenuItem>
  );
};

export default SignOutButton;
