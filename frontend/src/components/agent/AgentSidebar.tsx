// Sidebar para agentes de soporte - Usa el Sidebar compartido
'use client';

import React from 'react';
import { MessageSquareText, Inbox } from 'lucide-react';
import Sidebar, { NavItem } from '@/components/Sidebar';

// --- Items de navegación para agentes ---
const agentNavItems: NavItem[] = [
  { name: 'Caso Activo', href: '/caso-activo', icon: MessageSquareText },
  { name: 'Solicitudes', href: '/solicitudes', icon: Inbox },
];

// --- Sidebar para Agentes ---
export default function AgentSidebar() {
  return <Sidebar navItems={agentNavItems} />;
}
