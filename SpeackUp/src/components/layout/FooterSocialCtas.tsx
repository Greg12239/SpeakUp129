"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { siteConfig } from "@/content/site";
import { publicAsset } from "@/lib/public-asset";

type SocialNetwork = "Instagram" | "LinkedIn" | "TikTok" | "Email";
type CardState = "closed" | "preview" | "pinned";
type CopyStatus = "copied" | "failed" | null;
type PopoverPosition = { top: number; left: number; pointerLeft: number } | null;

const socialCtaAssets = {
  Instagram: { src: publicAsset("/social/SpeakUp_Instagram_CTA.png"), width: 1024, height: 1024 },
  LinkedIn: { src: publicAsset("/social/SpeakUp_LinkedIn_CTA.png"), width: 1024, height: 1024 },
  TikTok: { src: publicAsset("/social/SpeakUp_TikTok_CTA.png"), width: 1254, height: 1254 },
  Email: { src: publicAsset("/social/SpeakUp_Email_CTA.png"), width: 1254, height: 1254 },
} as const;

function SocialCtaArtwork({ network }: { network: SocialNetwork }) {
  const asset = socialCtaAssets[network];
  return (
    <span className="footer-social-cta-float">
      <span className="footer-social-cta-shadow">
        <span className="footer-social-cta-interactive">
          <Image alt="" className="footer-social-cta-image" height={asset.height} sizes="(max-width: 22rem) 5.35rem, (max-width: 48rem) 6rem, 7.8rem" src={asset.src} width={asset.width} />
        </span>
      </span>
    </span>
  );
}

function CopyIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><rect height="12" rx="2" width="12" x="8" y="8" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
}

function ExternalIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M14 5h5v5" /><path d="m19 5-9 9" /><path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" /></svg>;
}

export function FooterSocialCtas() {
  const emailHref = siteConfig.links.email;
  const emailAddress = emailHref?.replace(/^mailto:/, "") ?? null;
  const popoverId = useId();
  const detailId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const emailTriggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cardState, setCardState] = useState<CardState>("closed");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition>(null);
  const isCardOpen = cardState !== "closed";

  const clearTimers = useCallback(() => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    previewTimerRef.current = null;
    dismissTimerRef.current = null;
  }, []);

  const closeCard = useCallback((restoreFocus = false) => {
    clearTimers();
    setCardState("closed");
    setCopyStatus(null);
    setIsDetailOpen(false);
    setPosition(null);
    if (restoreFocus) requestAnimationFrame(() => emailTriggerRef.current?.focus());
  }, [clearTimers]);

  const schedulePreviewDismissal = useCallback(() => {
    if (cardState !== "preview") return;
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => closeCard(), 190);
  }, [cardState, closeCard]);

  const updatePosition = useCallback(() => {
    const trigger = emailTriggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;

    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const viewportMargin = 12;
    const gap = 12;
    const preferredLeft = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;
    const left = Math.min(Math.max(viewportMargin, preferredLeft), window.innerWidth - popoverRect.width - viewportMargin);
    const preferredTop = triggerRect.top - popoverRect.height - gap;
    const top = preferredTop >= viewportMargin
      ? preferredTop
      : Math.min(window.innerHeight - popoverRect.height - viewportMargin, triggerRect.bottom + gap);

    setPosition({
      left,
      top,
      pointerLeft: Math.min(popoverRect.width - 24, Math.max(24, triggerRect.left + triggerRect.width / 2 - left)),
    });
  }, []);

  useLayoutEffect(() => {
    if (!isCardOpen) return;
    updatePosition();
    const schedulePositionUpdate = () => requestAnimationFrame(updatePosition);
    window.addEventListener("resize", schedulePositionUpdate);
    window.addEventListener("scroll", schedulePositionUpdate, true);
    return () => {
      window.removeEventListener("resize", schedulePositionUpdate);
      window.removeEventListener("scroll", schedulePositionUpdate, true);
    };
  }, [isCardOpen, isDetailOpen, updatePosition]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (!isCardOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!groupRef.current?.contains(target) && !popoverRef.current?.contains(target)) closeCard(true);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCard(true);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeCard, isCardOpen]);

  const beginHoverPreview = () => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = null;
    if (cardState !== "closed" || previewTimerRef.current) return;
    previewTimerRef.current = setTimeout(() => {
      previewTimerRef.current = null;
      setCardState("preview");
    }, 340);
  };

  const copyEmail = async () => {
    if (!emailAddress) return;
    try {
      await navigator.clipboard.writeText(emailAddress);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  const popoverStyle = position ? ({
    left: position.left,
    top: position.top,
    "--footer-email-pointer-left": `${position.pointerLeft}px`,
  } as CSSProperties) : undefined;

  const popover = isCardOpen && typeof document !== "undefined" ? createPortal(
    <div aria-label="SpeakUp email contact" className="footer-email-popover" data-positioned={position ? "true" : "false"} data-state={cardState} id={popoverId} onPointerEnter={clearTimers} onPointerLeave={schedulePreviewDismissal} ref={popoverRef} role="dialog" style={popoverStyle}>
      {emailAddress ? <>
        <div className="footer-email-popover-header">
          <span aria-hidden="true" className="footer-email-popover-avatar"><Image alt="" height={370} src={publicAsset("/brand/speakup-primary.png")} width={1250} /></span>
          <div><p className="footer-email-popover-label">SpeakUp</p><p className="footer-email-popover-address">{emailAddress}</p></div>
        </div>
        <a className="footer-email-popover-send" href={emailHref ?? undefined}>Send email</a>
        <div className="footer-email-popover-utilities">
          <button aria-label={copyStatus === "copied" ? "Email copied" : "Copy email address"} className="footer-email-popover-copy" onClick={copyEmail} type="button"><CopyIcon /></button>
          <span className="footer-email-popover-copy-status">{copyStatus === "copied" ? "Copied!" : copyStatus === "failed" ? "Copy failed" : "Copy email"}</span>
        </div>
        <button aria-controls={detailId} aria-expanded={isDetailOpen} className="footer-email-popover-detail-toggle" onClick={() => setIsDetailOpen((isOpen) => !isOpen)} type="button"><span>{isDetailOpen ? "Close detailed view" : "Open detailed view"}</span><ExternalIcon /></button>
        <div className="footer-email-popover-detail" hidden={!isDetailOpen} id={detailId}><p>Official SpeakUp contact</p><a href={emailHref ?? undefined}>{emailAddress}</a></div>
        <span aria-live="polite" className="sr-only">{copyStatus === "copied" ? "Email copied to clipboard" : copyStatus === "failed" ? "Email could not be copied. Please try again." : ""}</span>
      </> : <><p className="footer-email-popover-label">Email SpeakUp</p><p className="footer-email-popover-message">A verified contact address has not yet been supplied.</p></>}
    </div>, document.body,
  ) : null;

  return (
    <div className="footer-social-cta-group" aria-label="SpeakUp social links" ref={groupRef}>
      <a aria-label="Instagram" className="footer-social-cta footer-social-cta--instagram" href={siteConfig.links.instagram ?? undefined} rel="noopener noreferrer" target="_blank"><SocialCtaArtwork network="Instagram" /></a>
      <a aria-label="LinkedIn" className="footer-social-cta footer-social-cta--linkedin" href={siteConfig.links.linkedIn ?? undefined} rel="noopener noreferrer" target="_blank"><SocialCtaArtwork network="LinkedIn" /></a>
      <a aria-label="TikTok" className="footer-social-cta footer-social-cta--tiktok" href={siteConfig.links.tikTok ?? undefined} rel="noopener noreferrer" target="_blank"><SocialCtaArtwork network="TikTok" /></a>
      <button aria-controls={popoverId} aria-expanded={isCardOpen} aria-label="Email SpeakUp" className="footer-social-cta footer-social-cta--email" data-card-active={isCardOpen} onClick={() => { clearTimers(); if (cardState === "pinned") closeCard(); else setCardState("pinned"); }} onPointerEnter={beginHoverPreview} onPointerLeave={() => { if (previewTimerRef.current) { clearTimeout(previewTimerRef.current); previewTimerRef.current = null; } schedulePreviewDismissal(); }} ref={emailTriggerRef} type="button"><SocialCtaArtwork network="Email" /></button>
      {popover}
    </div>
  );
}
