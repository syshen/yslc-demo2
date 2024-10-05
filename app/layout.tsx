import '../globals.css';
import '@mantine/core/styles.css';
import React from 'react';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { NavigationProgress } from '@mantine/nprogress';
import { theme } from '../theme';
import '@mantine/charts/styles.css';
import '@mantine/nprogress/styles.css';

export const metadata = {
  title: '詠鑠生活 YSLC',
  description: '詠鑠生活 YSLC',
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body className="mx-0 lg:mx-5">
        <MantineProvider theme={theme}>
          <NavigationProgress />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
