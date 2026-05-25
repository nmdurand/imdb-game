"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  AppBar,
  Button,
  ButtonGroup,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import type { Dict } from "@/i18n";
import type { Locale } from "@/lib/locale";
import { setLocaleAction } from "@/lib/locale-actions";
import { useGameStore } from "@/stores/gameStore";

type HeaderDict = Dict["header"];

export function Header({
  locale,
  dict,
}: {
  locale: Locale;
  dict: HeaderDict;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const gameStatus = useGameStore((s) => s.status);

  const navItems = [
    { href: "/", label: dict.home },
    { href: "/game", label: dict.play },
    { href: "/hall-of-fame", label: dict.hallOfFame },
    { href: "/about", label: dict.about },
  ];

  async function switchLocale(target: Locale) {
    if (target === locale || pending) return;
    const onGame = pathname === "/game";
    const midGame =
      onGame && (gameStatus === "playing" || gameStatus === "answering");
    if (midGame && !window.confirm(dict.switchConfirmMidGame)) return;

    setPending(true);
    try {
      await setLocaleAction(target);
      // Restart the game only if the player is actually on /game; navigating
      // back to /game from elsewhere already triggers a fresh start() on mount.
      if (onGame && gameStatus !== "idle") {
        await useGameStore.getState().reset();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="no-underline text-inherit flex items-center gap-2 leading-none"
            aria-label={dict.logoAriaLabel}
          >
            <Typography
              variant="h6"
              component="div"
              className="font-black text-center leading-[0.9] -rotate-6"
              style={{ color: "#f5c518" }}
            >
              <div>IM</div>
              <div>Db</div>
            </Typography>
            <Typography
              variant="h5"
              component="span"
              className="font-bold leading-none"
            >
              game
            </Typography>
          </Link>

          <div className="flex items-center gap-2">
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    component={Link}
                    href={item.href}
                    color={active ? "primary" : "inherit"}
                    variant="text"
                    className={active ? "font-bold" : undefined}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </nav>

            <LocaleToggle
              locale={locale}
              dict={dict}
              disabled={pending}
              onSwitch={switchLocale}
            />

            <IconButton
              className="sm:hidden"
              color="inherit"
              aria-label={dict.openMenu}
              onClick={() => setOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </div>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <List className="min-w-[60vw]">
          {navItems.map((item) => (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={pathname === item.href}
                onClick={() => setOpen(false)}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
}

function LocaleToggle({
  locale,
  dict,
  disabled,
  onSwitch,
}: {
  locale: Locale;
  dict: HeaderDict;
  disabled: boolean;
  onSwitch: (target: Locale) => void;
}) {
  return (
    <ButtonGroup
      size="small"
      variant="outlined"
      color="inherit"
      aria-label="Language"
      disabled={disabled}
    >
      <Button
        onClick={() => onSwitch("en")}
        variant={locale === "en" ? "contained" : "outlined"}
        className="min-w-0 px-2 text-xs"
      >
        {dict.switchToEnglish}
      </Button>
      <Button
        onClick={() => onSwitch("fr")}
        variant={locale === "fr" ? "contained" : "outlined"}
        className="min-w-0 px-2 text-xs"
      >
        {dict.switchToFrench}
      </Button>
    </ButtonGroup>
  );
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
