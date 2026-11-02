import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/brand/Logo";
import { footerItems } from "@/content/site";
import { publicAsset } from "@/lib/public-asset";

type SocialNetwork = "Instagram" | "Email" | "LinkedIn";

function isSocialNetwork(label: string): label is SocialNetwork {
  return label === "Instagram" || label === "Email" || label === "LinkedIn";
}

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

function SocialCtaContent({ network }: { network: SocialNetwork }) {
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

function socialAriaLabel(network: SocialNetwork, available: boolean) {
  if (!available) {
    return `${network} contact link unavailable`;
  }

  if (network === "Email") {
    return "Email SpeakUp";
  }

  return `${network}: visit SpeakUp`;
}

export function Footer() {
  return (
    <footer className="site-footer" id="footer" data-nav-theme="ink">
      <Container className="footer-inner">
        <a className="footer-wordmark" href="#home" aria-label="SpeakUp home">
          <Logo alt="" variant="wordmark" />
        </a>

        <nav className="footer-links" aria-label="Footer navigation">
          {footerItems.map((item) => {
            if (isSocialNetwork(item.label)) {
              return null;
            }

            return item.href ? (
              <a
                href={item.href}
                key={item.label}
                {...(item.external
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                {item.label}
              </a>
            ) : (
              <span aria-disabled="true" key={item.label}>
                {item.label}
              </span>
            );
          })}

          <div className="footer-social-cta-group" aria-label="SpeakUp social links">
            {footerItems.map((item) => {
              if (!isSocialNetwork(item.label)) {
                return null;
              }

              const socialClass = `footer-social-cta footer-social-cta--${item.label.toLowerCase()}`;
              const ariaLabel = socialAriaLabel(item.label, Boolean(item.href));

              return item.href ? (
                <a
                  className={socialClass}
                  href={item.href}
                  key={item.label}
                  aria-label={ariaLabel}
                  {...(item.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  <SocialCtaContent network={item.label} />
                </a>
              ) : (
                <span
                  aria-disabled="true"
                  aria-label={ariaLabel}
                  className={`${socialClass} is-unavailable`}
                  key={item.label}
                >
                  <SocialCtaContent network={item.label} />
                </span>
              );
            })}
          </div>
        </nav>

        <p className="footer-note">SpeakUp</p>
      </Container>
    </footer>
  );
}
