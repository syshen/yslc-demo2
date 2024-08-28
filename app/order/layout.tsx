import { FooterCentered } from '@/components/Nav/footer';

export default function PageLayout({ children }: { children: any }) {
  return (
    <>
      {children}
      <FooterCentered />
    </>
  );
}
