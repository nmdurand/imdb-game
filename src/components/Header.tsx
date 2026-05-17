"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  AppBar,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

const NAV_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/game", label: "Jouer" },
  { href: "/hall-of-fame", label: "Hall of Fame" },
  { href: "/about", label: "À propos" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="no-underline text-inherit"
            aria-label="imdbGame"
          >
            <Typography
              variant="h5"
              component="span"
              className="font-bold leading-none"
            >
              imdb<span className="italic opacity-70">Game</span>
            </Typography>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
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

          <IconButton
            className="sm:hidden"
            color="inherit"
            aria-label="Ouvrir le menu"
            onClick={() => setOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <List className="min-w-[60vw]">
          {NAV_ITEMS.map((item) => (
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
