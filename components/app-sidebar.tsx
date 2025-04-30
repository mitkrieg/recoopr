"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconHelp,
  IconTheater,
  IconReport,
  IconUsers,
  IconFileSpreadsheet,
  IconMasksTheater,
  IconTicket,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import useSWR from "swr"
import { redirect } from "next/navigation"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const data = {
  navMain: [
    {
      title: "Productions",
      url: "/productions",
      icon: IconMasksTheater,
    },
    {
      title: "Theaters",
      url: "/productions/theaters",
      icon: IconTheater,
    },
    {
      title: "Budgets",
      url: "#",
      icon: IconFileSpreadsheet,
    },
    {
      title: "Analytics",
      url: "#",
      icon: IconChartBar,
    },
    {
      title: "Investors",
      url: "#",
      icon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    // {
    //   title: "Settings",
    //   url: "#",
    //   icon: IconSettings,
    // },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    // {
    //   title: "Search",
    //   url: "#",
    //   icon: IconSearch,
    // },
  ],
  documents: [
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: user, error, isLoading: isUserLoading } = useSWR('/api/user', fetcher);

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/" className="flex items-center w-full">
                <IconTicket className="h-10 w-10 text-orange-500"/>
                <span className=" text-xl font-semibold text-gray-900">ReCoopr</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
