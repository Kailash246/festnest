import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────
   FestNest Privacy Policy
   DPDP Act 2023 compliant · Last Updated: April 2026
   ───────────────────────────────────────────────────────────── */

const LAST_UPDATED = "5 April 2026";
const EFFECTIVE_DATE = "5 April 2026";
const CONTACT_EMAIL = "support@festnest.in";
const GRIEVANCE_EMAIL = "grievance@festnest.in";
const COMPANY = "FestNest";

/* ─── Table of Contents ─── */
const SECTIONS = [
  { id: "introduction",      label: "Introduction" },
  { id: "data-collected",    label: "Information We Collect" },
  { id: "how-we-use",        label: "How We Use Your Data" },
  { id: "legal-basis",       label: "Legal Basis for Processing" },
  { id: "consent",           label: "User Consent" },
  { id: "data-sharing",      label: "Data Sharing & Third Parties" },
  { id: "data-retention",    label: "Data Retention" },
  { id: "your-rights",       label: "Your Rights (DPDP Act)" },
  { id: "security",          label: "Data Security" },
  { id: "children",          label: "Children's Privacy" },
  { id: "changes",           label: "Policy Changes" },
  { id: "contact",           label: "Contact & Grievance" },
];

/* ─── Sub-components ─── */

function SectionHeading({ id, number, children }) {
  return (
    <h2
      id={id}
      style={{
        fontFamily: "'Sora', sans-serif",
        fontSize: "1.25rem",
        fontWeight: 700,
        color: "#0f172a",
        marginTop: "2.5rem",
        marginBottom: "0.75rem",
        paddingTop: "0.5rem",
        borderTop: "2px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        scrollMarginTop: "80px",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1.75rem",
          height: "1.75rem",
          borderRadius: "6px",
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          color: "#fff",
          fontSize: "0.7rem",
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {number}
      </span>
      {children}
    </h2>
  );
}

function SubHeading({ children }) {
  return (
    <h3
      style={{
        fontFamily: "'Sora', sans-serif",
        fontSize: "0.95rem",
        fontWeight: 700,
        color: "#334155",
        marginTop: "1.25rem",
        marginBottom: "0.4rem",
      }}
    >
      {children}
    </h3>
  );
}

function Para({ children, style }) {
  return (
    <p
      style={{
        fontSize: "0.9375rem",
        lineHeight: 1.8,
        color: "#475569",
        marginBottom: "0.75rem",
        ...style,
      }}
    >
      {children}
    </p>
  );
}

function BulletList({ items }) {
  return (
    <ul
      style={{
        paddingLeft: "1.25rem",
        marginBottom: "0.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
      }}
    >
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            fontSize: "0.9375rem",
            lineHeight: 1.7,
            color: "#475569",
            listStyleType: "disc",
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function Pill({ children, color = "#2563eb" }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.15rem 0.6rem",
        borderRadius: "20px",
        background: color + "18",
        color: color,
        fontSize: "0.78rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function InfoBox({ icon, title, children, accent = "#2563eb" }) {
  return (
    <div
      style={{
        borderLeft: `3px solid ${accent}`,
        background: accent + "08",
        borderRadius: "0 10px 10px 0",
        padding: "0.9rem 1.1rem",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: "0.85rem",
          fontWeight: 700,
          color: accent,
          marginBottom: "0.35rem",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
        }}
      >
        <span>{icon}</span> {title}
      </div>
      <div style={{ fontSize: "0.9rem", color: "#475569", lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

function RightCard({ number, title, description }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.9rem",
        padding: "0.9rem",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        marginBottom: "0.6rem",
        alignItems: "flex-start",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2rem",
          height: "2rem",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #2563eb18, #7c3aed18)",
          color: "#2563eb",
          fontSize: "0.85rem",
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {number}
      </span>
      <div>
        <div
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "0.88rem",
            fontWeight: 700,
            color: "#1e293b",
            marginBottom: "0.2rem",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: 1.6 }}>
          {description}
        </div>
      </div>
    </div>
  );
}

function ThirdPartyRow({ name, purpose, link }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.7rem 0.9rem",
        borderBottom: "1px solid #f1f5f9",
        flexWrap: "wrap",
        gap: "0.4rem",
      }}
    >
      <span
        style={{
          fontWeight: 700,
          fontSize: "0.88rem",
          color: "#1e293b",
          minWidth: "110px",
        }}
      >
        {name}
      </span>
      <span style={{ fontSize: "0.875rem", color: "#64748b", flex: 1, padding: "0 0.5rem" }}>
        {purpose}
      </span>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: "0.775rem",
          color: "#2563eb",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        Privacy Policy ↗
      </a>
    </div>
  );
}

/* ─── Main Component ─── */
export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [tocOpen, setTocOpen] = useState(false);
  const observerRef = useRef(null);

  /* Highlight active TOC item on scroll */
  useEffect(() => {
    const callback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveSection(entry.target.id);
      });
    };
    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: "-20% 0px -70% 0px",
    });
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTocOpen(false);
  };

  return (
    <>
      {/* Google Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: "#f8fafc",
          minHeight: "100vh",
          color: "#1e293b",
        }}
      >

        {/* ── Top Banner ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #4c1d95 100%)",
            padding: "3rem 1.5rem 2.5rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* decorative circles */}
          {[
            { top: "-60px", right: "-60px", size: "200px", opacity: 0.08 },
            { bottom: "-40px", left: "-40px", size: "160px", opacity: 0.06 },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: s.top,
                right: s.right,
                bottom: s.bottom,
                left: s.left,
                width: s.size,
                height: s.size,
                borderRadius: "50%",
                background: "#fff",
                opacity: s.opacity,
                pointerEvents: "none",
              }}
            />
          ))}

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "20px",
              padding: "0.3rem 0.9rem",
              marginBottom: "1rem",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "#bfdbfe", fontWeight: 600 }}>
              🛡️ DPDP Act 2023 Compliant
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 800,
              color: "#fff",
              marginBottom: "0.6rem",
              lineHeight: 1.15,
            }}
          >
            Privacy Policy
          </h1>
          <p style={{ color: "#93c5fd", fontSize: "0.95rem", marginBottom: "1.25rem" }}>
            🪺 FestNest · India's Campus Event Discovery Platform
          </p>

          <div
            style={{
              display: "inline-flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "6px",
                padding: "0.3rem 0.7rem",
                fontSize: "0.78rem",
                color: "#bfdbfe",
              }}
            >
              Last Updated: {LAST_UPDATED}
            </span>
            <span
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "6px",
                padding: "0.3rem 0.7rem",
                fontSize: "0.78rem",
                color: "#bfdbfe",
              }}
            >
              Effective: {EFFECTIVE_DATE}
            </span>
            <span
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "6px",
                padding: "0.3rem 0.7rem",
                fontSize: "0.78rem",
                color: "#bfdbfe",
              }}
            >
              Jurisdiction: India
            </span>
          </div>
        </div>

        {/* ── Body Layout ── */}
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "2rem 1.5rem 4rem",
            display: "flex",
            gap: "2.5rem",
            alignItems: "flex-start",
          }}
        >

          {/* ── Sidebar TOC (desktop) ── */}
          <aside
            style={{
              width: "220px",
              flexShrink: 0,
              position: "sticky",
              top: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.1rem",
              // Hide on small screens via JS-applied class or inline check
            }}
            className="pp-toc-sidebar"
          >
            <p
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: "0.7rem",
                fontWeight: 800,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.5rem",
              }}
            >
              Contents
            </p>
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                style={{
                  textAlign: "left",
                  background: activeSection === id ? "#2563eb12" : "transparent",
                  border: "none",
                  borderLeft: `2px solid ${activeSection === id ? "#2563eb" : "transparent"}`,
                  padding: "0.45rem 0.7rem",
                  fontSize: "0.825rem",
                  color: activeSection === id ? "#2563eb" : "#64748b",
                  fontWeight: activeSection === id ? 700 : 400,
                  cursor: "pointer",
                  borderRadius: "0 6px 6px 0",
                  transition: "all 0.15s ease",
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1.4,
                }}
              >
                {label}
              </button>
            ))}
          </aside>

          {/* ── Main Content ── */}
          <main
            style={{
              flex: 1,
              minWidth: 0,
              background: "#fff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "2.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >

            {/* Mobile TOC toggle */}
            <button
              onClick={() => setTocOpen(!tocOpen)}
              style={{
                display: "none", // shown via media query in real app
                width: "100%",
                padding: "0.7rem 1rem",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer",
                textAlign: "left",
                marginBottom: "1.5rem",
                fontFamily: "'DM Sans', sans-serif",
              }}
              className="pp-mobile-toc-btn"
            >
              📋 Jump to section {tocOpen ? "▲" : "▼"}
            </button>

            {/* ══════════════════════════════════════
                SECTION 1 — INTRODUCTION
            ══════════════════════════════════════ */}
            <SectionHeading id="introduction" number="01">Introduction</SectionHeading>

            <Para>
              Welcome to <strong>FestNest</strong>, operated by{" "}
              <strong>{COMPANY}</strong> ("we", "us", or "our"). FestNest is India's
              centralized campus event discovery platform, connecting students with
              hackathons, cultural fests, workshops, sports events, and more across
              colleges and universities nationwide.
            </Para>
            <Para>
              This Privacy Policy explains what personal data we collect when you use
              FestNest, why we collect it, how we use and protect it, and what rights
              you hold under the{" "}
              <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>{" "}
              and other applicable Indian laws.
            </Para>
            <InfoBox icon="ℹ️" title="Who This Applies To" accent="#2563eb">
              This Policy applies to all users of the FestNest platform — including
              students who browse and register for events, and organizers who create
              and manage event listings — whether accessed through our website or any
              future mobile application.
            </InfoBox>
            <Para>
              By creating an account or using FestNest in any way, you acknowledge
              that you have read, understood, and agreed to the practices described
              in this Policy. If you disagree with any part of it, please stop using
              FestNest and contact us to delete your account.
            </Para>

            {/* ══════════════════════════════════════
                SECTION 2 — INFORMATION WE COLLECT
            ══════════════════════════════════════ */}
            <SectionHeading id="data-collected" number="02">Information We Collect</SectionHeading>

            <Para>
              We collect only the information necessary to provide and improve our
              services. Here is a plain-language breakdown:
            </Para>

            <SubHeading>2.1 Account & Profile Data</SubHeading>
            <Para>When you sign up, we collect:</Para>
            <Para>
              <Pill>Students</Pill>
            </Para>
            <BulletList
              items={[
                "First name and last name",
                "Email address (used to create your account)",
                "College or university name",
                "Course / branch (e.g., B.Tech CSE)",
                "Year of study (e.g., 2nd Year)",
                "Profile photo (if you choose to upload one)",
                "Phone number (optional)",
              ]}
            />
            <Para>
              <Pill color="#7c3aed">Organizers</Pill>
            </Para>
            <BulletList
              items={[
                "Organization or college name",
                "Department or branch",
                "City of operation",
                "Contact email address",
                "Contact phone number",
                "Profile or organization photo (optional)",
              ]}
            />

            <SubHeading>2.2 Event & Content Data</SubHeading>
            <BulletList
              items={[
                "Event details you submit: title, description, category, date, location, prizes, registration fee",
                "Event poster images and brochure PDFs uploaded when posting events",
                "Saved events list (events you bookmark on the platform)",
                "Registration actions (events you register your interest in)",
              ]}
            />

            <SubHeading>2.3 Technical & Usage Data</SubHeading>
            <Para>
              We automatically collect certain data when you interact with FestNest:
            </Para>
            <BulletList
              items={[
                "IP address and approximate geographic location (city/region level)",
                "Browser type, device type, and operating system",
                "Pages visited, features used, and time spent on the platform",
                "Search queries entered on FestNest",
                "Error logs and diagnostic data to help us fix problems",
                "Referring URLs (how you arrived at FestNest)",
              ]}
            />

            <SubHeading>2.4 Cookies & Similar Technologies</SubHeading>
            <Para>
              FestNest uses cookies and similar local storage technologies to keep
              you logged in (session token stored in <code>localStorage</code>),
              remember your preferences, and improve page performance. We do{" "}
              <strong>not</strong> use third-party advertising cookies or tracking
              pixels. You can clear cookies at any time through your browser
              settings; doing so will log you out of your account.
            </Para>

            {/* ══════════════════════════════════════
                SECTION 3 — HOW WE USE DATA
            ══════════════════════════════════════ */}
            <SectionHeading id="how-we-use" number="03">How We Use Your Data</SectionHeading>

            <Para>We use the data we collect for these specific purposes:</Para>

            {[
              { icon: "🔐", purpose: "Authentication & Account Management", detail: "Creating and securing your account, verifying your identity, enabling login sessions, and managing account recovery." },
              { icon: "🎉", purpose: "Event Discovery & Matching", detail: "Showing you relevant events based on your college, interests, and course. Personalizing search results and featured listings." },
              { icon: "📣", purpose: "Event Publishing (Organizers)", detail: "Processing and reviewing event submissions, publishing approved events to the public feed, and notifying organizers about approval status." },
              { icon: "📧", purpose: "Platform Communications", detail: "Sending transactional emails (account confirmation, event approval, password reset). Sending platform updates and important announcements relevant to your use of FestNest." },
              { icon: "🛡️", purpose: "Safety & Moderation", detail: "Reviewing reported content, preventing fraudulent or abusive activity, and maintaining a safe, trustworthy community for students." },
              { icon: "📊", purpose: "Analytics & Improvement", detail: "Understanding how users interact with FestNest to improve features, fix bugs, and prioritize what to build next. We use aggregated, anonymized data for this." },
              { icon: "⚖️", purpose: "Legal Compliance", detail: "Meeting our obligations under Indian law, responding to lawful government requests, and enforcing our Terms of Service." },
            ].map((item, i) => (
              <InfoBox key={i} icon={item.icon} title={item.purpose} accent="#2563eb">
                {item.detail}
              </InfoBox>
            ))}

            <Para>
              We will <strong>never</strong> sell your personal data to third
              parties, use it for profiling unrelated to FestNest's core features,
              or share it with advertisers.
            </Para>

            {/* ══════════════════════════════════════
                SECTION 4 — LEGAL BASIS (DPDP ACT)
            ══════════════════════════════════════ */}
            <SectionHeading id="legal-basis" number="04">Legal Basis for Processing</SectionHeading>

            <Para>
              Under the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>,
              every organization that processes personal data must have a valid lawful
              basis. FestNest processes your data on the following grounds:
            </Para>

            {[
              { basis: "Consent", desc: "You give us explicit, informed consent at the time of registration by accepting this Privacy Policy. You may withdraw consent at any time by deleting your account." },
              { basis: "Contractual Necessity", desc: "Processing is necessary to provide the service you signed up for — creating your profile, publishing your events, and enabling registration flows." },
              { basis: "Legitimate Interests", desc: "We process limited usage and analytics data to maintain platform security, prevent abuse, and improve FestNest features — balanced against your privacy rights." },
              { basis: "Legal Obligation", desc: "We may process or retain data when required by Indian law, court orders, or regulatory requests from competent Indian authorities." },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "0.9rem",
                  marginBottom: "0.7rem",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  padding: "0.85rem 1rem",
                  border: "1px solid #e2e8f0",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 800,
                    color: "#2563eb",
                    fontSize: "0.8rem",
                    minWidth: "140px",
                    paddingTop: "0.1rem",
                  }}
                >
                  {item.basis}
                </span>
                <span style={{ fontSize: "0.9rem", color: "#475569", lineHeight: 1.6 }}>
                  {item.desc}
                </span>
              </div>
            ))}

            {/* ══════════════════════════════════════
                SECTION 5 — USER CONSENT
            ══════════════════════════════════════ */}
            <SectionHeading id="consent" number="05">User Consent</SectionHeading>

            <Para>
              FestNest collects your personal data only with your free, informed, and
              specific consent. Here is how consent works on our platform:
            </Para>
            <BulletList
              items={[
                "When you create an account, you are shown this Privacy Policy and must accept it before proceeding. This constitutes your explicit consent.",
                "For any new type of data use that was not covered when you signed up, we will ask for fresh consent before proceeding.",
                "You can withdraw consent at any time by submitting an account deletion request to support@festnest.in. We will delete your personal data within 30 days of receiving a valid request.",
                "Withdrawing consent will not affect the legality of any processing we carried out before you withdrew it.",
                "Certain limited data (such as event submissions that were publicly listed) may be retained in anonymized or archived form as required by our legal obligations even after account deletion.",
              ]}
            />

            {/* ══════════════════════════════════════
                SECTION 6 — DATA SHARING
            ══════════════════════════════════════ */}
            <SectionHeading id="data-sharing" number="06">Data Sharing & Third Parties</SectionHeading>

            <Para>
              We do not sell, trade, or rent your personal data. We share data only
              with the following trusted service providers who help us operate
              FestNest, and only to the extent necessary for those services:
            </Para>

            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  background: "#f8fafc",
                  padding: "0.6rem 0.9rem",
                  borderBottom: "1px solid #e2e8f0",
                  gap: "0.4rem",
                }}
              >
                <span style={{ fontWeight: 800, fontSize: "0.78rem", color: "#1e293b", minWidth: "110px" }}>SERVICE</span>
                <span style={{ fontWeight: 800, fontSize: "0.78rem", color: "#1e293b", flex: 1 }}>PURPOSE</span>
                <span style={{ fontWeight: 800, fontSize: "0.78rem", color: "#1e293b" }}>POLICY</span>
              </div>
              <ThirdPartyRow
                name="Firebase (Google)"
                purpose="User authentication, account creation, and sign-in sessions"
                link="https://firebase.google.com/support/privacy"
              />
              <ThirdPartyRow
                name="Cloudinary"
                purpose="Hosting and serving event poster images and brochure PDFs"
                link="https://cloudinary.com/privacy"
              />
              <ThirdPartyRow
                name="Cloud Hosting (MongoDB Atlas)"
                purpose="Storing platform data — user profiles, events, saved lists"
                link="https://www.mongodb.com/legal/privacy-policy"
              />
              <ThirdPartyRow
                name="Email Provider (SMTP)"
                purpose="Sending transactional emails — account confirmation, event status"
                link="#"
              />
            </div>

            <Para>
              All third-party providers are contractually required to keep your data
              confidential, use it only for the stated purpose, and maintain security
              standards consistent with applicable law.
            </Para>
            <Para>
              We may disclose data to Indian government authorities or law enforcement
              agencies when required to do so by applicable law, court order, or to
              protect the safety of our users. We will, where legally permitted,
              notify affected users of such disclosures.
            </Para>

            {/* ══════════════════════════════════════
                SECTION 7 — DATA RETENTION
            ══════════════════════════════════════ */}
            <SectionHeading id="data-retention" number="07">Data Retention</SectionHeading>

            <Para>
              We keep your personal data only for as long as necessary to provide
              the service and meet our legal obligations. Here is our retention
              schedule in plain language:
            </Para>

            {[
              { type: "Active account data", period: "Retained for the lifetime of your account", note: "Profile info, saved events, and account preferences." },
              { type: "Event submissions", period: "2 years after the event end date", note: "Necessary for organizer dispute resolution and historical records." },
              { type: "Authentication logs", period: "90 days", note: "Login timestamps and session records for security monitoring." },
              { type: "Deleted account data", period: "30 days after deletion request", note: "After which it is permanently and irreversibly purged from our systems." },
              { type: "Anonymized analytics", period: "Indefinitely (no personal data)", note: "Aggregated usage statistics that cannot identify any individual." },
              { type: "Legal compliance data", period: "As required by applicable Indian law", note: "Minimum necessary data retained to satisfy statutory obligations." },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.4rem 1rem",
                  padding: "0.75rem 0.9rem",
                  background: i % 2 === 0 ? "#f8fafc" : "#fff",
                  borderRadius: "8px",
                  marginBottom: "0.3rem",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e293b" }}>{item.type}</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.1rem" }}>{item.note}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Pill color="#2563eb">{item.period}</Pill>
                </div>
              </div>
            ))}

            {/* ══════════════════════════════════════
                SECTION 8 — YOUR RIGHTS (DPDP ACT)
            ══════════════════════════════════════ */}
            <SectionHeading id="your-rights" number="08">Your Rights Under the DPDP Act</SectionHeading>

            <Para>
              The Digital Personal Data Protection Act, 2023 grants every Indian
              data principal (that's you) a set of enforceable rights over your
              personal data. We are committed to honoring these rights promptly and
              without making the process unnecessarily difficult.
            </Para>

            <InfoBox icon="⚡" title="How to Exercise Your Rights" accent="#7c3aed">
              Email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#7c3aed", fontWeight: 600 }}>
                {CONTACT_EMAIL}
              </a>{" "}
              with the subject line "Data Rights Request — [Your Right]". We will
              respond within <strong>30 days</strong>. We may ask you to verify your
              identity before processing the request.
            </InfoBox>

            <RightCard
              number="§ 1"
              title="Right to Access"
              description="You can request a copy of all personal data we hold about you — your profile information, saved events, account activity, and any other data tied to your account."
            />
            <RightCard
              number="§ 2"
              title="Right to Correction & Completion"
              description="If any data we hold about you is inaccurate, incomplete, or outdated, you have the right to request that we correct or update it. Most profile data can be edited directly in your FestNest account settings."
            />
            <RightCard
              number="§ 3"
              title="Right to Erasure (Right to be Forgotten)"
              description="You can request the permanent deletion of your personal data and account. We will process this within 30 days. Note: publicly listed event data you submitted may be anonymized rather than deleted if required for platform integrity."
            />
            <RightCard
              number="§ 4"
              title="Right to Withdraw Consent"
              description="You may withdraw the consent you gave when signing up, at any time and without penalty. Withdrawal does not make prior processing unlawful. To withdraw, submit a deletion request or contact us directly."
            />
            <RightCard
              number="§ 5"
              title="Right to Grievance Redressal"
              description="If you believe your data rights have been violated, you can raise a complaint with our Grievance Officer. If unsatisfied with our response, you may escalate to the Data Protection Board of India once it is constituted under the DPDP Act."
            />
            <RightCard
              number="§ 6"
              title="Right to Nominate"
              description="You may nominate another individual to exercise your data rights on your behalf in the event of your death or incapacity, as provided under Section 14 of the DPDP Act."
            />

            {/* ══════════════════════════════════════
                SECTION 9 — DATA SECURITY
            ══════════════════════════════════════ */}
            <SectionHeading id="security" number="09">Data Security</SectionHeading>

            <Para>
              Protecting your personal data is a core responsibility we take
              seriously. We implement the following security measures:
            </Para>
            <BulletList
              items={[
                "All data in transit is encrypted using TLS/HTTPS — your browser shows a padlock icon when connected to FestNest.",
                "Passwords are hashed using bcrypt with a strong salt factor. We never store plain-text passwords.",
                "Authentication uses industry-standard JSON Web Tokens (JWT) with defined expiry periods.",
                "Firebase Authentication handles sign-in sessions using Google's security infrastructure.",
                "Access to production databases is restricted to authorized personnel only, with role-based access control.",
                "We perform periodic security reviews and promptly apply security patches.",
                "File uploads (event posters, brochures) are stored on Cloudinary with access controls to prevent unauthorized retrieval.",
              ]}
            />

            <InfoBox icon="⚠️" title="In Case of a Data Breach" accent="#dc2626">
              If we become aware of a security incident that compromises your personal
              data, we will notify affected users promptly via email and take
              immediate steps to contain and investigate the breach, in accordance
              with DPDP Act requirements.
            </InfoBox>

            <Para>
              Despite our best efforts, no system is completely invulnerable. We
              encourage you to use a strong, unique password for your FestNest
              account and to log out of shared devices.
            </Para>

            {/* ══════════════════════════════════════
                SECTION 10 — CHILDREN'S PRIVACY
            ══════════════════════════════════════ */}
            <SectionHeading id="children" number="10">Children's Privacy</SectionHeading>

            <Para>
              FestNest is designed for college students and event organizers.{" "}
              <strong>
                Our platform is not intended for children under the age of 18.
              </strong>{" "}
              We do not knowingly collect personal data from anyone below the age of
              18.
            </Para>
            <Para>
              Under the DPDP Act, 2023, processing personal data of children requires
              verifiable parental consent. If we discover that a user under 18 has
              created an account without parental consent, we will delete that
              account and all associated data immediately.
            </Para>
            <Para>
              If you are a parent or guardian and believe your child has created a
              FestNest account, please contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#2563eb" }}>
                {CONTACT_EMAIL}
              </a>{" "}
              and we will act promptly.
            </Para>

            {/* ══════════════════════════════════════
                SECTION 11 — POLICY CHANGES
            ══════════════════════════════════════ */}
            <SectionHeading id="changes" number="11">Changes to This Privacy Policy</SectionHeading>

            <Para>
              We may update this Privacy Policy from time to time as our platform
              evolves, we add new features, or legal requirements change. Here is
              how we handle changes:
            </Para>
            <BulletList
              items={[
                "We will update the "Last Updated" date at the top of this page whenever we make changes.",
                "For material changes (those that meaningfully affect how we use your data or your rights), we will notify you via email at the address associated with your account at least 14 days before the changes take effect.",
                "For minor changes (grammar corrections, clarifications, non-material updates), we will update the page and you will be notified on your next login.",
                "If you continue to use FestNest after a policy update takes effect, it means you accept the updated terms. If you do not agree, you can request account deletion before the effective date.",
              ]}
            />

            {/* ══════════════════════════════════════
                SECTION 12 — CONTACT & GRIEVANCE
            ══════════════════════════════════════ */}
            <SectionHeading id="contact" number="12">Contact & Grievance Redressal</SectionHeading>

            <Para>
              We want to make it easy to reach us with privacy questions or
              concerns. Here are all the ways to get in touch:
            </Para>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              {[
                {
                  label: "General Privacy Queries",
                  email: CONTACT_EMAIL,
                  desc: "Questions about this Policy, your data, or how we handle information.",
                  accent: "#2563eb",
                },
                {
                  label: "Grievance Officer",
                  email: GRIEVANCE_EMAIL,
                  desc: "Formal complaints about data rights violations under the DPDP Act.",
                  accent: "#7c3aed",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "1.1rem",
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      color: item.accent,
                      marginBottom: "0.5rem",
                    }}
                  >
                    {item.label}
                  </div>
                  <a
                    href={`mailto:${item.email}`}
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#1e293b",
                      textDecoration: "none",
                      marginBottom: "0.4rem",
                      wordBreak: "break-all",
                    }}
                  >
                    {item.email}
                  </a>
                  <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <Para>
              <strong>Company:</strong> {COMPANY}
              <br />
              <strong>Jurisdiction:</strong> India — disputes arising from this
              Privacy Policy are subject to the laws of India and the exclusive
              jurisdiction of courts in India.
            </Para>
            <Para>
              <strong>Response Time:</strong> We endeavour to respond to all
              privacy-related enquiries within <strong>7 business days</strong>, and
              to formally acknowledge data rights requests within{" "}
              <strong>30 days</strong> as required by the DPDP Act.
            </Para>
            <Para>
              If you are dissatisfied with our response to a grievance, you have the
              right to escalate your complaint to the{" "}
              <strong>Data Protection Board of India</strong> once it is established
              under the DPDP Act, 2023.
            </Para>

            {/* ── Footer divider ── */}
            <div
              style={{
                marginTop: "2.5rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                🪺 FestNest · {COMPANY}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                Last updated: {LAST_UPDATED}
              </span>
            </div>
          </main>
        </div>

        {/* ── Responsive styles ── */}
        <style>{`
          @media (max-width: 768px) {
            .pp-toc-sidebar { display: none !important; }
            .pp-mobile-toc-btn { display: flex !important; }
          }
          @media (max-width: 640px) {
            main { padding: 1.5rem !important; }
          }
          code {
            font-family: 'Courier New', monospace;
            background: #f1f5f9;
            padding: 0.1em 0.4em;
            border-radius: 4px;
            font-size: 0.85em;
            color: #7c3aed;
          }
          a { color: #2563eb; }
        `}</style>
      </div>
    </>
  );
}
