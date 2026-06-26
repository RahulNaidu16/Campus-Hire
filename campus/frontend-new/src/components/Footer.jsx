import { useRef } from "react";
import campusLogo from "../assets/campus-logo.svg";

const navColumns = [
  { heading: "Product", links: ["Jobs", "Analytics", "Prediction", "Resume Tools"] },
  { heading: "Company", links: ["About", "Careers", "Blog", "Press"] },
  { heading: "Account", links: ["Sign in", "Register", "Profile", "Settings"] },
];

export default function Footer({ onNavigate }) {
  const footerRef = useRef(null);

  const handleLinkClick = (event, page) => {
    if (!page || !onNavigate) return;
    event.preventDefault();
    onNavigate(page);
  };

  return (
    <footer ref={footerRef} style={styles.footer}>
      <div style={styles.footerTop}>
        <div style={styles.footerBrand}>
          <div style={styles.footerLogo}>
            <img src={campusLogo} alt="CampusHire logo" style={styles.logoImage} />
            <span style={{ marginLeft: 12 }}>
              <span style={{ color: "#38bdf8" }}>Campus</span> Hire
            </span>
          </div>
          <p style={styles.footerTagline}>
            The AI-powered placement portal trusted by universities and top recruiters across India.
          </p>
          <div style={styles.footerSocials}>
            {['⬡', '𝕏', 'in', '✉'].map((icon, index) => (
              <div key={index} className="footer-soc-icon" style={styles.socialIcon}>
                {icon}
              </div>
            ))}
          </div>
        </div>

        {navColumns.map((column) => (
          <div key={column.heading} style={styles.footerCol}>
            <h4 style={styles.footerColHead}>{column.heading}</h4>
            {column.links.map((link) => {
              const pageMap = {
                Jobs: "jobs",
                Analytics: "analytics",
                "Sign in": "login",
                Register: "register",
              };
              const page = pageMap[link];
              return (
                <a
                  key={link}
                  href="#"
                  className="footer-link-hover"
                  style={styles.footerLink}
                  onClick={page ? (event) => handleLinkClick(event, page) : undefined}
                >
                  {link}
                </a>
              );
            })}
          </div>
        ))}
      </div>
      <div style={styles.footerBottom}>© 2025 Campus Hire. All rights reserved.</div>
    </footer>
  );
}

const styles = {
  footer: {
    background: "#04060c",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    padding: "64px 24px 32px",
    marginTop: 48,
  },
  footerTop: {
    display: "flex",
    gap: 80,
    marginBottom: 52,
    maxWidth: 1280,
    margin: "0 auto 52px",
  },
  footerBrand: { flex: 2 },
  footerLogo: {
    display: "flex",
    alignItems: "center",
    fontSize: 20,
    fontWeight: 700,
    color: "#f8fafc",
    marginBottom: 12,
    letterSpacing: "-0.3px",
  },
  logoImage: {
    width: 42,
    height: 42,
    objectFit: "contain",
  },
  footerTagline: {
    fontSize: 14,
    color: "#dbeafe",
    lineHeight: 1.75,
    marginBottom: 20,
    maxWidth: 280,
  },
  footerSocials: { display: "flex", gap: 10 },
  socialIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    cursor: "pointer",
    color: "#cbd5e1",
  },
  footerCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  footerColHead: {
    fontSize: 13,
    fontWeight: 700,
    color: "#f8fafc",
    marginBottom: 4,
    letterSpacing: "0.3px",
  },
  footerLink: {
    fontSize: 14,
    color: "#dbeafe",
    textDecoration: "none",
  },
  footerBottom: {
    borderTop: "1px solid rgba(255,255,255,0.05)",
    paddingTop: 24,
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    maxWidth: 1280,
    margin: "0 auto",
  },
};
