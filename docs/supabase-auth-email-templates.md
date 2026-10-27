# Supabase Auth Email Templates

Supabase Auth sends confirmation emails itself, so its templates are managed in the Supabase dashboard rather than by this application.

To apply the YouMine dark confirmation email:

1. In Supabase, open **Authentication** then **Email Templates**.
2. Select **Confirm signup**.
3. Set the subject to `Confirm your email address | YouMine`.
4. Replace the message body with the contents of `docs/supabase-confirm-signup-email.html` and save.

The template includes `{{ .ConfirmationURL }}`, which Supabase replaces with the secure confirmation link. Its fixed table backgrounds, dark-scheme metadata, and Outlook selectors match the app-generated emails and prevent light-background rendering in mobile mail clients.