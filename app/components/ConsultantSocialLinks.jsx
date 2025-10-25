export default function ConsultantSocialLinks({ links = {}, className = "" }) {
  const items = [
    {
      key: "linkedin",
      href: links.linkedin_url,
      label: "LinkedIn",
      color: "#0A66C2",
      Icon: LinkedInIcon,
    },
    {
      key: "facebook",
      href: links.facebook_url,
      label: "Facebook",
      color: "#1877F2",
      Icon: FacebookIcon,
    },
    {
      key: "twitter",
      href: links.twitter_url,
      label: "Twitter/X",
      color: "#000000", // X brand is black
      Icon: XIcon,
    },
    {
      key: "instagram",
      href: links.instagram_url,
      label: "Instagram",
      color: "#E4405F", // Instagram brand pink (simplified)
      Icon: InstagramIcon,
    },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {items.map(({ key, href, label, color, Icon }) => {
        const active = typeof href === "string" && /^https:\/\//i.test(href);
        const baseClass =
          "inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 transition";
        const inactiveClass =
          "bg-white/5 ring-white/10 text-slate-400 cursor-not-allowed";
        const style =
          key === "twitter" && active
            ? { backgroundColor: "#ffffff", color: "#000000", boxShadow: "0 0 0 1px rgba(255,255,255,0.1) inset" }
            : active
            ? {
                backgroundColor: hexToRgba(color, 0.15),
                color,
                boxShadow: `0 0 0 1px ${hexToRgba(color, 0.35)} inset`,
              }
            : undefined;

        const content = (
          <span
            className={`${baseClass} ${active ? "" : inactiveClass}`}
            style={style}
            aria-label={label}
            title={active ? label : `${label} (not provided)`}
          >
            <Icon className="h-4 w-4" />
          </span>
        );

        return active ? (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            {content}
          </a>
        ) : (
          <div key={key} aria-disabled="true">
            {content}
          </div>
        );
      })}
    </div>
  );
}

function hexToRgba(hex, alpha = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.55 4.78 5.86V21h-4v-5.3c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.81V21H9z" />
    </svg>
  );
}
function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.41c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  );
}
function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.9l-4.3-5.64L5.73 22H3l7.06-8.06L2 2h7l3.95 5.27L18.244 2zm-1.206 18h1.89L8.33 4H6.36l10.678 16z" />
    </svg>
  );
}
function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.51 5.51 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zM18 6.25a1.25 1.25 0 1 1-1.25 1.25A1.25 1.25 0 0 1 18 6.25z" />
    </svg>
  );
}