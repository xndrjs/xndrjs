import React, {type ReactNode} from 'react';
import Navbar from '@theme-original/Navbar';
import type NavbarType from '@theme/Navbar';
import type {WrapperProps} from '@docusaurus/types';
import MobileMenu from '@site/src/components/mobile-menu';

type Props = WrapperProps<typeof NavbarType>;

export default function NavbarWrapper(props: Props): ReactNode {
  return (
    <>
      <Navbar {...props} />
      <MobileMenu />
    </>
  );
}
