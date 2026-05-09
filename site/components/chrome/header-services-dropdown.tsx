"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { isActivePath } from "@/components/chrome/header-nav-link";
import { TrackedLink } from "@/lib/analytics";
import { siteConfig } from "@/lib/site-config";

function useServicesState(defaultOpenOnActive = false) {
  const pathname = usePathname();
  const servicesActive = siteConfig.serviceNavigation.some((link) =>
    isActivePath(pathname, link.href),
  );
  const [open, setOpen] = useState(defaultOpenOnActive && servicesActive);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openMenu() {
    clearCloseTimer();
    setOpen(true);
  }

  function closeMenu() {
    clearCloseTimer();
    setOpen(false);
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 180);
  }

  useEffect(() => {
    return clearCloseTimer;
  }, []);

  return {
    closeMenu,
    open,
    openMenu,
    pathname,
    scheduleClose,
    servicesActive,
    setOpen,
  };
}

export function HeaderServicesDropdown() {
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    closeMenu,
    open,
    openMenu,
    pathname,
    scheduleClose,
    servicesActive,
    setOpen,
  } = useServicesState();

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu]);

  return (
    <div
      ref={rootRef}
      className={`bftp-navbar__dropdown${open ? " is-open" : ""}`}
      onPointerEnter={openMenu}
      onPointerLeave={scheduleClose}
      onFocus={openMenu}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          scheduleClose();
        }
      }}
    >
      <button
        type="button"
        className={`bftp-navbar__link bftp-navbar__dropdown-trigger${
          servicesActive ? " is-active" : ""
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="bftp-navbar__link-label">Services</span>
        <span className="bftp-navbar__dropdown-caret" aria-hidden="true" />
      </button>
      <div className={`bftp-navbar__dropdown-panel${open ? " is-open" : ""}`}>
        <div className="bftp-navbar__dropdown-menu" aria-label="Services navigation">
          {siteConfig.serviceNavigation.map((link) => {
            const isActive = isActivePath(pathname, link.href);

            return (
              <TrackedLink
                key={link.href}
                href={link.href}
                event="nav_link_clicked"
                properties={{ label: link.label, is_mobile: false, parent: "Services" }}
                className={`bftp-navbar__dropdown-link${isActive ? " is-active" : ""}`}
                onClick={closeMenu}
              >
                <span>{link.label.replace("Backflow ", "")}</span>
              </TrackedLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function HeaderMobileServicesDropdown({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { closeMenu, open, pathname, servicesActive, setOpen } = useServicesState(true);

  return (
    <div className={`bftp-navbar__mobile-dropdown${open ? " is-open" : ""}`}>
      <button
        type="button"
        className={`bftp-navbar__mobile-link bftp-navbar__mobile-dropdown-trigger${
          servicesActive ? " is-active" : ""
        }`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="bftp-navbar__mobile-link-text">Services</span>
        <span className="bftp-navbar__mobile-dropdown-caret" aria-hidden="true" />
      </button>
      <div className="bftp-navbar__mobile-submenu" aria-hidden={!open}>
        {siteConfig.serviceNavigation.map((link) => {
          const isActive = isActivePath(pathname, link.href);

          return (
            <TrackedLink
              key={link.href}
              href={link.href}
              event="nav_link_clicked"
              properties={{ label: link.label, is_mobile: true, parent: "Services" }}
              className={`bftp-navbar__mobile-submenu-link${isActive ? " is-active" : ""}`}
              onClick={() => {
                closeMenu();
                onNavigate?.();
              }}
            >
              {link.label.replace("Backflow ", "")}
            </TrackedLink>
          );
        })}
      </div>
    </div>
  );
}
