import { NavMenu } from '@/components/Nav/nav';

export default function PageLayout({ children }: { children: any }) {
  return (
    <>
      <NavMenu />
      {children}
    </>
  );
}
