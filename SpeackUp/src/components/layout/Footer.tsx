import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/brand/Logo";
import { footerItems } from "@/content/site";

type SocialNetwork = "Instagram" | "Email" | "LinkedIn";

function isSocialNetwork(label: string): label is SocialNetwork {
  return label === "Instagram" || label === "Email" || label === "LinkedIn";
}

function SocialIcon({ network }: { network: SocialNetwork }) {
  if (network === "Instagram") {
    return (
      <svg aria-hidden="true" className="footer-social-cta-icon" viewBox="0 0 24 24">
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.1" />
        <circle cx="12" cy="12" r="4.15" />
        <circle className="footer-social-cta-icon-fill" cx="17.35" cy="6.65" r="1.15" />
      </svg>
    );
  }

  if (network === "LinkedIn") {
    return (
      <svg aria-hidden="true" className="footer-social-cta-icon" viewBox="0 0 24 24">
        <path d="M5 8.6v10.2M5 5.35v.1M9.3 18.8v-6.1c0-2.45 1.34-4.1 3.72-4.1 2.1 0 3.48 1.34 3.48 4.1v6.1M9.3 12.8c0-2.66 1.34-4.2 3.72-4.2 2.1 0 3.48 1.34 3.48 4.1" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="footer-social-cta-icon" viewBox="0 0 24 24">
      <rect x="3" y="4.7" width="18" height="14.6" rx="2.25" />
      <path d="m4.25 6.35 7.75 6.2 7.75-6.2" />
    </svg>
  );
}

function SocialCtaContent({ network }: { network: SocialNetwork }) {
  return (
    <span className="footer-social-cta-float">
      <span className="footer-social-cta-shadow">
        <span className="footer-social-cta-interactive">
          <span className="footer-social-cta-surface">
            <SocialIcon network={network} />
            <span className="footer-social-cta-label">{network}</span>
          </span>
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
        </nav>

        <p className="footer-note">SpeakUp</p>
      </Container>
    </footer>
  );
}
