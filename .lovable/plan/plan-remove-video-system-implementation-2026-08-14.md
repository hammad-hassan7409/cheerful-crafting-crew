# Plan: Remove Video System Implementation

Completely remove the existing video system while preserving all other functionality (posters, images, branding, design, auth, and admin management).

## User Review Required

> [!IMPORTANT]
> This plan will permanently remove all code and UI elements related to video uploads and playback. Existing video files in storage will not be automatically deleted, but they will no longer be visible or manageable through the app.

## Proposed Changes

### Frontend (Gallery & Product Detail)
- Remove `VideoPreview` and `VideoDialog` components from `src/routes/index.tsx`.
- Remove video-specific logic and conditional rendering from `src/routes/products.$productId.tsx`.
- Update `ProtectedMedia` to support only images.
- Remove "Initializing..." loading states specific to video.

### Admin Panel
- Remove video file type acceptance and video-specific upload handlers in `src/routes/admin/products.$productId.tsx`.
- Remove video previews and playback controls from the product editor.
- Update `productSchema` in `src/lib/products-admin.functions.ts` to reflect the removal of video.

### Backend & Library
- Simplify `src/hooks/use-signed-url.ts` to focus on image delivery (if needed, though it's generic).
- Clean up `src/lib/media.functions.ts` to remove video-specific path handling if applicable.
- Ensure the `product-media` storage bucket remains intact for posters/images.

## Technical Details

- **Database**: No schema changes are required (keeping `media_type` as it doesn't harm existing posters). We will only remove the *logic* that handles `video`.
- **UI/UX**: The "VIDEOS" category will remain in the database but will be empty/hidden in the gallery if no images are assigned to it.
- **Safety**: RLS policies and storage bucket configurations for images will not be touched.

## Constrained Actions
- No new video system will be built.
- Branding (AR EDITZ) and theme (Blue/Zinc) will be preserved.
- WhatsApp integration and "Send to Editor" logic will remain untouched.
