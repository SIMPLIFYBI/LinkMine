import { buildEmailLayout, emailButton, emailPanel, escapeHtml } from "./emailLayout";

export const WELCOME_SUBJECT = "Welcome to YouMine — Let’s get started";

export function buildWelcomeEmailHtml({ firstName = "" }) {
  const name = firstName ? escapeHtml(firstName) : "there";
  const content = `
    <p style="margin:0 0 14px;color:#d8e7f4;font-size:15px;line-height:1.65;">Hi ${name},</p>
    <p style="margin:0 0 20px;color:#d8e7f4;font-size:15px;line-height:1.65;">Your YouMine account is ready. Browse expertise, open Vault resources, connect with providers, and create a public profile when you are ready to be discovered.</p>
    ${emailPanel(`<div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:10px;">Start where it matters</div><ul style="margin:0;padding-left:20px;color:#c7d9e9;font-size:14px;line-height:1.7;"><li>Find verified consultants and specialists.</li><li>Post work opportunities and manage responses.</li><li>Build a public consultant or creator profile.</li></ul>`)}
    ${emailPanel(`<div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:8px;">For clients</div><p style="margin:0 0 14px;color:#c7d9e9;font-size:14px;line-height:1.6;">Post a job, compare relevant expertise, and contact providers directly.</p>${emailButton({ href: "https://youmine.io/jobs?tab=my-jobs", label: "Post a job" })}${emailButton({ href: "https://youmine.io/consultants", label: "Browse consultants", secondary: true })}`)}
    ${emailPanel(`<div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:8px;">For consultants and creators</div><p style="margin:0 0 14px;color:#c7d9e9;font-size:14px;line-height:1.6;">Create a profile, show your services or digital resources, and start building visibility.</p>${emailButton({ href: "https://youmine.io/account", label: "Complete my profile" })}${emailButton({ href: "https://youmine.io/vault", label: "Explore the Vault", secondary: true })}`)}
  `;

  return buildEmailLayout({ eyebrow: "Welcome to YouMine", title: "Your account is ready", preheader: "Start exploring YouMine.", content });
}

export function buildWelcomeEmailText({ firstName = "" }) {
  const name = firstName || "there";
  return `Welcome to YouMine — Let’s get started

Hi ${name},

Thanks for creating an account with YouMine. We connect mining companies with trusted consultants and contractors.

Get started
- Browse the marketplace and discover verified experts.
- Set up your profile and preferences.
- Post a job or showcase your portfolio.

For Clients
- Post your job and receive interest from relevant consultants.
- Compare experience, portfolios, and availability.
- Contact providers directly.
CTA: https://youmine.io/jobs?tab=my-jobs
Browse consultants: https://youmine.io/consultants

For Consultants
- Complete your profile and add a portfolio.
- List services, locations, and specialties.
- Respond quickly to enquiries.
Complete profile: https://youmine.io/account
Explore jobs: https://youmine.io/jobs

© 2025 YouMine. Built for the mining industry.`;
}