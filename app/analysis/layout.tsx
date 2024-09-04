import { NavMenu } from '@/components/Nav/nav';

export default function PageLayout({ children }: { children: any }) {
  return (
    <div className="h-[calc(100vh-60px)]">
      <NavMenu />
      {children}
    </div>
  );
}
