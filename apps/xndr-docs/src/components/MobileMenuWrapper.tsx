import { useState, useEffect } from 'react';
import MobileMenu from './MobileMenu';
import type { SidebarItem } from '../utils/sidebar';

interface MobileMenuWrapperProps {
  sidebarData: SidebarItem[];
}

export default function MobileMenuWrapper({ sidebarData }: MobileMenuWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const brand = document.getElementById('navbar-brand');
    if (!brand) return;

    const handleClick = (e: MouseEvent) => {
      if (window.innerWidth <= 996) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen((prev) => !prev);
      }
    };

    brand.addEventListener('click', handleClick);
    return () => {
      brand.removeEventListener('click', handleClick);
    };
  }, []);

  return <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} sidebarData={sidebarData} />;
}

