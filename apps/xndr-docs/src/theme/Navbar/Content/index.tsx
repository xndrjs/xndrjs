import React, {type ReactNode, useState, useEffect} from 'react';
import Content from '@theme-original/Navbar/Content';
import type ContentType from '@theme/Navbar/Content';
import type {WrapperProps} from '@docusaurus/types';
import MobileMenu from '@site/src/components/mobile-menu';

type Props = WrapperProps<typeof ContentType>;

export default function ContentWrapper(props: Props): ReactNode {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  useEffect(() => {
    // Setup logo click handler on mobile
    const setupLogoClick = () => {
      const brand = document.querySelector('.navbar__brand');
      if (brand) {
        const handleClick = (e: MouseEvent) => {
          if (window.innerWidth <= 996) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Logo clicked, toggling menu');
            setIsMenuOpen(prev => !prev);
          }
        };
        
        brand.addEventListener('click', handleClick);
        
        return () => {
          brand.removeEventListener('click', handleClick);
        };
      }
    };
    
    const cleanup = setupLogoClick();
    return cleanup;
  }, []);
  
  return (
    <>
      <Content {...props} />
      <MobileMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
    </>
  );
}
