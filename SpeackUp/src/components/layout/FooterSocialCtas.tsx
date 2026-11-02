"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { siteConfig } from "@/content/site";
import { publicAsset } from "@/lib/public-asset";

type SocialNetwork = "Instagram" | "LinkedIn" | "Email";

const socialCtaAssets = {
  Instagram: {
    src: publicAsset("/social/SpeakUp_Instagram_CTA.png"),
    width: 1024,
    height: 1024,
  },
  LinkedIn: {
    src: publicAsset("/social/SpeakUp_LinkedIn_CTA.png"),
    width: 1024,
    height: 1024,
  },
  Email: {
    src: publicAsset("/social/SpeakUp_Email_CTA.png"),
    width: 1254,
    height: 1254,
  },
} as const;

function SocialCtaArtwork({ network }: { network: SocialNetwork }) {
  const asset = socialCtaAssets[network];

  return (
    <span className="footer-social-cta-float">
      <span className="footer-social-cta-shadow">
        <span className="footer-social-cta-interactive">
          <Image
            alt=""
            className="footer-social-cta-image"
            height={asset.height}
            sizes="(max-width: 22rem) 5.35rem, (max-width: 48rem) 6rem, 7.8rem"
            src={asset.src}
            width={asset.width}
          />
        </span>
      </span>
    </span>
  );
}

type PopoverPosition = { top: number; left: number } | null;
type CopyStatus = "copied" | "failed" | null;

export function FooterSocialCtas() {
  const emailHref = siteConfig.links.email;
  const emailAddress = emailHref?.replace(/^mailto:/, "") ?? null;
  const popoverId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const emailTriggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(null);
  const [position, setPosition] = useState<PopoverPosition>(null);

  const closePopover = useCallback((restoreFocus = false) => {
    setIsOpen(false);
    setCopyStatus(null);
    setPosition(null);

    if (restoreFocus) {
      requestAnimationFrame(() => emailTriggerRef.current?.focus());
    }
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = emailTriggerRef.current;
    const popover = popoverRef.current;

    if (!trigger || !popover) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const viewportMargin = 12;
    const gap = 10;
    const preferredLeft = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;

    setPosition({
      left: Math.min(
        Math.max(viewportMargin, preferredLeft),
        window.innerWidth - popoverRect.width - viewportMargin,
      ),
      top: Math.max(viewportMargin, triggerRect.top - popoverRect.height - gap),
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    updatePosition();
    const schedulePositionUpdate = () => requestAnimationFrame(updatePosition);

    window.addEventListener("resize", schedulePositionUpdate);
    window.addEventListener("scroll", schedulePositionUpdate, true);

    return () => {
      window.removeEventListener("resize", schedulePositionUpdate);
      window.removeEventListener("scroll", schedulePositionUpdate, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        !groupRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        closePopover(true);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePopover(true);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    requestAnimationFrame(() => popoverRef.current?.focus());

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePopover, isOpen]);

  const copyEmail = async () => {
    if (!emailAddress) {
      return;
    }

    try {
      await navigator.clipboard.writeText(emailAddress);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  const popover = isOpen && typeof document !== "undefined"
    ? createPortal(
        <div
          aria-label="SpeakUp email contact"
          className="footer-email-popover"
          id={popoverId}
          ref={popoverRef}
          role="dialog"
          style={position ? { left: position.left, top: position.top } : undefined}
          tabIndex={-1}
          data-positioned={position ? "true" : "false"}
        >
          {emailAddress ? (
            <>
              <p className="footer-email-popover-label">Email SpeakUp</p>
              <p className="footer-email-popover-address">{emailAddress}</p>
              <div className="footer-email-popover-actions">
                <button className="footer-email-popover-copy" onClick={copyEmail} type="button">
                  {copyStatus === "copied"
                    ? "Copied!"
                    : copyStatus === "failed"
                      ? "Copy failed"
                      : "Copy email"}
                </button>
                <a className="footer-email-popover-send" href={emailHref ?? undefined}>
                  Send email
                </a>
              </div>
              <span aria-live="polite" className="sr-only">
                {copyStatus === "copied"
                  ? "Email copied to clipboard"
                  : copyStatus === "failed"
                    ? "Email could not be copied"
                    : ""}
              </span>
            </>
          ) : (
            <>
              <p className="footer-email-popover-label">Email SpeakUp</p>
              <p className="footer-email-popover-message">
                A verified contact address has not yet been supplied.
              </p>
            </>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="footer-social-cta-group" aria-label="SpeakUp social links" ref={groupRef}>
      <a
        aria-label="Instagram"
        className="footer-social-cta footer-social-cta--instagram"
        href={siteConfig.links.instagram ?? undefined}
        rel="noopener noreferrer"
        target="_blank"
      >
        <SocialCtaArtwork network="Instagram" />
      </a>
      <a
        aria-label="LinkedIn"
        className="footer-social-cta footer-social-cta--linkedin"
        href={siteConfig.links.linkedIn ?? undefined}
        rel="noopener noreferrer"
        target="_blank"
      >
        <SocialCtaArtwork network="LinkedIn" />
      </a>
      <button
        aria-controls={popoverId}
        aria-expanded={isOpen}
        aria-label="Email SpeakUp"
        className="footer-social-cta footer-social-cta--email"
        onClick={() => (isOpen ? closePopover() : setIsOpen(true))}
        ref={emailTriggerRef}
        type="button"
      >
        <SocialCtaArtwork network="Email" />
      </button>
      {popover}
    </div>
  );
}
