'use client';

import Image from 'next/image';
import { Anchor, Group, ActionIcon, rem } from '@mantine/core';
import { IconBrandFacebook, IconBrandInstagram } from '@tabler/icons-react';
// import { MantineLogo } from '@mantinex/mantine-logo';
import Logo from './yslc.png';

import classes from './footer.module.css';

const links = [
  { link: 'mailto: service@youngsollife.com', label: 'Contact' },
  { link: 'https://www.facebook.com/youngsollifestyle/', label: 'Facebook' },
  { link: 'https://www.instagram.com/yslc_aussielifestyle/', label: 'Instagram' },
];

export function FooterCentered() {
  const items = links.map((link) => (
    <Anchor
      c="dimmed"
      key={link.label}
      href={link.link}
      lh={1}
      onClick={(event) => event.preventDefault()}
      size="sm"
    >
      {link.label}
    </Anchor>
  ));

  return (
    <div className={classes.footer}>
      <div className={classes.inner}>
        <Group>
          <Image src={Logo} width={30} height={30} alt="YSLC" />詠鑠生活YSLC
        </Group>

        <Group className={classes.links}>{items}</Group>

        <Group gap="xs" justify="flex-end" wrap="nowrap">
          <ActionIcon size="lg" variant="default" radius="xl">
            <IconBrandFacebook style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
          </ActionIcon>
          <ActionIcon size="lg" variant="default" radius="xl">
            <IconBrandInstagram style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
          </ActionIcon>
        </Group>
      </div>
    </div>
  );
}
