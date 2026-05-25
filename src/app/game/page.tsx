import { Game } from "@/components/Game";
import { getDict } from "@/i18n";
import { getServerLocale } from "@/lib/locale";

export default async function GamePage() {
  const dict = getDict(await getServerLocale());
  return <Game round={dict.round} summary={dict.summary} />;
}
