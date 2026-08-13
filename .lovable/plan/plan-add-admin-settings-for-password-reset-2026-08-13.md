# Plan: Add Admin Settings for Password Reset

Add a settings page to the admin portal to allow the owner to change their password.

## User Review Required

- **Technical Detail**: The password reset will use the Supabase `updateUser` function. The user must be logged in to access this page.

## Proposed Changes

### Admin UI
- Create `src/routes/admin/settings.tsx` with a password change form.
- Add a "Settings" button to the admin sidebar in `src/routes/admin.tsx`.

### Security & Logic
- Implement a `PasswordChangeForm` component with validation (current password, new password, confirm new password).
- Use `supabase.auth.updateUser` to update the password.
- Add success/error toast notifications.

## Technical Details

### New Files
- `src/routes/admin/settings.tsx`: The settings page route and component.

### Modified Files
- `src/routes/admin.tsx`: Add the "Settings" link to the sidebar navigation.
