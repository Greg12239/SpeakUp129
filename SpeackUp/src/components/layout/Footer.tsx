import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/brand/Logo";
import { FooterSocialCtas } from "@/components/layout/FooterSocialCtas";
import { footerItems } from "@/content/site";

export function Footer() {
  return (
    <footer className="site-footer" id="footer" data-nav-theme="ink">
      <Container className="footer-inner">
        <a className="footer-wordmark" href="#home" aria-label="SpeakUp home">
          <Logo alt="" variant="wordmark" />
        </a>

        <nav className="footer-links" aria-label="Footer navigation">
          {footerItems.map((item) => {
            if (
              item.label === "Instagram" ||
              item.label === "LinkedIn" ||
              item.label === "Email"
            ) {
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

          <FooterSocialCtas />
        </nav>

        <p className="footer-note">SpeakUp</p>
      </Container>
    </footer>
  );
}
