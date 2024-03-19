import { Title, Text } from '@mantine/core';
import Image from 'next/image';
import Logo from '../Nav/yslc.png';
import classes from './Welcome.module.css';

export function Welcome() {
  return (
    <>
      <div className="flex flex-col justify-center">
        <div className="flex flex-row justify-center">
          <Image src={Logo} className="mt-24" width={100} height={100} alt="logo" />
        </div>
        <Title className={classes.title} ta="center" mt={100}>
          Welcome to{' '}
          <Text inherit variant="gradient" component="span" gradient={{ from: 'pink', to: 'yellow' }}>
          詠鑠生活YSLC | 澳洲風味探險家｜Bonsoy｜Remedy
          </Text>
        </Title>
        <Text c="dimmed" ta="center" size="lg" maw={580} mx="auto" mt="xl">
          客戶訂單管理後台
        </Text>
      </div>
    </>
  );
}
