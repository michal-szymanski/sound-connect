// import AccountButton from "@/components/account-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "src/components/ui/sidebar";
import { Bell, Cog, House, LucideIcon, Mail, UserRound } from "lucide-react";
import { Link } from "@tanstack/react-router";
import AccountButton from "@/components/account-button";

type Item = {
  title: string;
  url: string;
  icon: LucideIcon;
};

const items: Item[] = [
  {
    title: "Home",
    url: "/",
    icon: House,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
  },
  {
    title: "Messages",
    url: "/messages",
    icon: Mail,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: UserRound,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Cog,
  },
];

const LeftSidebar = () => {
  return (
    <Sidebar
      collapsible="none"
      className="fixed bottom-0 z-51 h-min w-full flex-row items-center justify-center lg:flex lg:h-full lg:w-min lg:flex-col xl:items-start"
    >
      <SidebarContent className="flex-none lg:flex-1">
        <SidebarGroup className="w-min lg:w-full">
          <SidebarGroupContent className="w-min lg:w-full">
            <SidebarMenu className="w-min flex-row lg:w-full lg:flex-col">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      className="flex justify-center xl:justify-start [&>svg]:size-6"
                    >
                      <item.icon />
                      <span className="hidden xl:inline">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <AccountButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default LeftSidebar;
