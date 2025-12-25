import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { sidebarData } from '@site/src/sidebar-data';
import styles from './styles.module.css';

interface NavbarItem {
  type?: string;
  label: string;
  to?: string;
  href?: string;
  sidebarId?: string;
}

interface MobileMenuProps {
  isOpen?: boolean;
  setIsOpen?: (value: boolean | ((prev: boolean) => boolean)) => void;
}

// Helper function to find the first doc link in a sidebar
function findFirstDocLink(sidebarItems: any[]): string | null {
  for (const item of sidebarItems) {
    if (typeof item === 'string') {
      // Direct doc ID
      return `/docs/${item}`;
    } else if (item.type === 'doc' && item.id) {
      // Doc item with ID
      return `/docs/${item.id}`;
    } else if (item.type === 'category' && item.items) {
      // Recursively search in category
      const link = findFirstDocLink(item.items);
      if (link) return link;
    } else if (item.type === 'link' && item.href) {
      // External link
      return item.href;
    }
  }
  return null;
}

export default function MobileMenu({ isOpen: externalIsOpen, setIsOpen: externalSetIsOpen }: MobileMenuProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;
  const location = useLocation();
  const { siteConfig } = useDocusaurusContext();
  const navbarItems = ((siteConfig.themeConfig?.navbar as { items?: NavbarItem[] })?.items || []) as NavbarItem[];
  const logoUrl = useBaseUrl((siteConfig.themeConfig?.navbar as { logo?: { src: string } })?.logo?.src || '');
  
  // Memoize the doc links for each sidebar
  const docLinks = useMemo(() => {
    const links: Record<string, string> = {};
    navbarItems.forEach((item) => {
      if (item.type === 'docSidebar' && item.sidebarId) {
        const sidebar = (sidebarData as any)[item.sidebarId];
        if (sidebar) {
          const firstLink = findFirstDocLink(sidebar);
          links[item.sidebarId] = firstLink || '/docs';
        }
      }
    });
    return links;
  }, [navbarItems]);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Don't render on desktop
  if (typeof window !== 'undefined' && window.innerWidth > 996) {
    return null;
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        className={styles.mobileMenuButton}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleMenu();
        }}
        aria-label="Toggle mobile menu"
        aria-expanded={isOpen}
        type="button"
      >
        <span className={styles.hamburger}>
          <span className={isOpen ? styles.hamburgerActive : ''}></span>
          <span className={isOpen ? styles.hamburgerActive : ''}></span>
          <span className={isOpen ? styles.hamburgerActive : ''}></span>
        </span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={toggleMenu}
          aria-hidden="true"
        />
      )}

      {/* Menu Drawer */}
      <nav
        className={`${styles.mobileMenu} ${isOpen ? styles.mobileMenuOpen : ''}`}
        aria-hidden={!isOpen}
      >
        <div className={styles.mobileMenuHeader}>
          <Link to="/" className={styles.mobileMenuBrand} onClick={toggleMenu}>
            <img src={logoUrl} alt={siteConfig.title} className={styles.mobileMenuLogo} />
            <span className={styles.mobileMenuTitle}>{siteConfig.title}</span>
          </Link>
          <button
            className={styles.mobileMenuClose}
            onClick={toggleMenu}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <div className={styles.mobileMenuContent}>
          <ul className={styles.mobileMenuList}>
            <li className={styles.mobileMenuItem}>
              <Link to="/"  className={styles.mobileMenuLink} onClick={toggleMenu}>
                Home
              </Link>
            </li>
            {navbarItems.map((item, index) => {
              if (item.type === 'docSidebar') {
                // For docSidebar, link to the first doc in the sidebar dynamically
                const docLink = item.sidebarId && docLinks[item.sidebarId] 
                  ? docLinks[item.sidebarId]
                  : '/docs/getting-started/introduction';
                
                return (
                  <li key={index} className={styles.mobileMenuItem}>
                    <Link
                      to={docLink}
                      className={styles.mobileMenuLink}
                      onClick={toggleMenu}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }

              if (item.href) {
                return (
                  <li key={index} className={styles.mobileMenuItem}>
                    <a
                      href={item.href}
                      className={styles.mobileMenuLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={toggleMenu}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              }

              if (item.to) {
                return (
                  <li key={index} className={styles.mobileMenuItem}>
                    <Link
                      to={item.to}
                      className={styles.mobileMenuLink}
                      onClick={toggleMenu}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }

              return null;
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}

