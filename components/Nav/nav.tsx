'use client';

import { usePathname } from 'next/navigation';
import {
  Group,
  Divider,
  Box,
  Burger,
  Drawer,
  ScrollArea,
  rem,
} from '@mantine/core';
import Image from 'next/image';
import { useDisclosure } from '@mantine/hooks';
import { SignInButton } from './SignInButton';
import classes from './nav.module.css';
import Logo from './yslc.png';

export function NavMenu() {
  const pathname = usePathname();
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);

  return (
    <Box>
      <header className={classes.header}>
        <Group justify="space-between" h="100%">
          <a href="/">
            <Group>
              <Image src={Logo} width={30} height={30} alt="YSLC" />詠鑠生活YSLC
            </Group>
          </a>

          <Group h="100%" gap={0} visibleFrom="sm">
            <a href="/" className={classes.link}>
              首頁
            </a>
            <a href="/orders" className={`${classes.link} ${pathname === '/orders' ? classes.linkActive : ''}`}>
              所有訂單
            </a>
            <a href="/customers" className={`${classes.link} ${pathname === '/customers' ? classes.linkActive : ''}`}>
              所有客戶
            </a>
            <a href="/products" className={`${classes.link} ${pathname === '/products' ? classes.linkActive : ''}`}>
              所有產品
            </a>
            <a href="/settings" className={`${classes.link} ${pathname === '/settings' ? classes.linkActive : ''}`}>
              設定
            </a>
          </Group>
          <SignInButton />
          <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" />
        </Group>
      </header>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="選單"
        hiddenFrom="sm"
        zIndex={1000000}
      >
        <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
          <Divider my="sm" />

          <a href="/" className={classes.link}>
            首頁
          </a>
          <a href="/orders" className={classes.link}>
            所有訂單
          </a>
          <a href="/customers" className={classes.link}>
            所有客戶
          </a>
          <a href="/products" className={classes.link}>
            所有產品
          </a>
          <a href="/settings" className={classes.link}>
            設定
          </a>
          <Divider my="sm" />
          <SignInButton />
        </ScrollArea>
      </Drawer>
    </Box>
  );
}
