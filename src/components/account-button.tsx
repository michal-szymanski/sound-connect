import SignOutButton from "@/components/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { userQueryOptions } from "@/lib/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";

const AccountButton = () => {
  const { data: user } = useSuspenseQuery(userQueryOptions());

  if (!user) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-full max-h-fit w-full cursor-pointer justify-start select-none focus-visible:ring-0 focus-visible:outline-hidden"
        >
          <Avatar className="size-10">
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback>
              <Skeleton />
            </AvatarFallback>
          </Avatar>
          <span className="hidden xl:inline">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="z-51" align="start">
        <SignOutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountButton;
