import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOut } from "@/server-functions/auth";
import { useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

const SignOutButton = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    const isSuccess = await signOut();

    if (isSuccess) {
      router.navigate({ to: "/sign-in" });
    }
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
