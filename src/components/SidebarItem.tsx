import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

export function SidebarItem({ icon: Icon, label, active, collapsed, onClick }: SidebarItemProps) {
  return (
    <motion.button
      whileHover={{ backgroundColor: undefined }}
      onClick={onClick}
      className={`relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full ${collapsed ? 'px-2' : 'px-3'} py-2.5 rounded-xl transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] ${active ? 'bg-transparent dark:bg-transparent' : ''}`}
      title={collapsed ? label : undefined}
    >
      {active && !collapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#5A5BEF] rounded-r-full" />
      )}
      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[#5A5BEF] dark:text-white' : 'text-[var(--text-secondary)]'}`} />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className={`${active ? 'text-[#5A5BEF] dark:text-white font-medium' : 'text-[var(--text-secondary)]'} whitespace-nowrap overflow-hidden`}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
