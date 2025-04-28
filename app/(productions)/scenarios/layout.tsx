'use client';

import { Header } from '@/components/Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
export default function ProductionsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <div className="flex-1 flex flex-col">
          <Header />
          <SidebarInset className="flex-1 p-6">
            {children}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
} 