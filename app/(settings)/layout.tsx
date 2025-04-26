'use client';

import { HeaderOnly } from '@/components/Header';

export default function SettingsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <HeaderOnly>{children}</HeaderOnly>;
}
