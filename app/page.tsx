import { Welcome } from '../components/Welcome/Welcome';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { NavMenu } from '../components/Nav/nav';
import { FooterCentered } from '../components/Nav/footer';

export default function HomePage() {
  return (
    <>
      <NavMenu />
      <Welcome />
      <ColorSchemeToggle />
      <FooterCentered />
    </>
  );
}
