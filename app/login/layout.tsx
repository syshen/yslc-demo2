import { NavMenu } from '@/components/Nav/nav';
import { FooterCentered } from '@/components/Nav/footer';

export default function PageLayout({ children }: { children: any }) {
  return (
    <>
      <NavMenu />
      {children}
      <FooterCentered />
    </>
  );
}
