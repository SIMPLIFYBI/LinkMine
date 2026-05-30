# YouMine Mobile Store Metadata

This file is the working source for the first store-ready mobile release.

## Product Identity

- App name: `YouMine`
- Bundle ID / App ID: `io.youmine.app`
- Platform shell: Capacitor over the existing Next.js app
- Hosted fallback URL: `https://youmine.io`

## Core Positioning

- One-line description: `Browse mining consultants, jobs, training, and talent from your phone.`
- Short subtitle ideas:
  - `Mining jobs and consultants`
  - `Mining talent and training`
  - `Your mobile mining network`

## Draft Store Descriptions

### App Store short description

`Find mining consultants, browse jobs, follow industry activity, and stay close to opportunities from one mobile app.`

### Long description draft

`YouMine helps mining professionals and mining businesses discover consultants, contractors, roles, training, and industry opportunities in one place. The mobile app gives you a faster way to browse the network, review profiles, and stay connected while away from your desk.`

`Use YouMine to explore consultant profiles, scan current jobs, review industry activity, and keep up with new opportunities through a mobile-first experience built on the same core platform as the web app.`

## Required URLs

- Production site: `https://youmine.io`
- Privacy policy: `https://youmine.io/privacy`
- Terms: `https://youmine.io/terms`
- Support contact: add a real support email before store submission

## Asset Sources

- App icon source: [public/mobile/app-icon-source.svg](c:/Users/james/source/repos/LinkMine/public/mobile/app-icon-source.svg)
- Splash source: [public/mobile/splash-source.svg](c:/Users/james/source/repos/LinkMine/public/mobile/splash-source.svg)

These are source artwork files only. Final PNG exports for Android/iOS launch assets still need to be generated.

## First Android Testing Checklist

1. Install Android Studio and open [android](c:/Users/james/source/repos/LinkMine/android).
2. Confirm the shell loads the hosted app at `https://youmine.io`.
3. Test landing page, consultants, jobs, auth entry, account, and Talent Hub access.
4. Confirm external links, uploads, and session persistence behave correctly inside the WebView.
5. Log any screens that feel too web-like for an app and tighten those before store submission.

## Before Submission

1. Replace placeholder source assets with final exported icon and splash files in native asset catalogs.
2. Add final support email and marketing copy.
3. Decide whether `io.youmine.app` remains the production app ID.
4. Add native deep-link callback handling for auth.
5. Test on at least one physical Android device and one iPhone.