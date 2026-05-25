import { Home } from "@/components/Home";
import { getDict } from "@/i18n";
import { getServerLocale } from "@/lib/locale";

export default async function HomePage() {
  const dict = getDict(await getServerLocale());
  return <Home dict={dict.home} />;
}
