# Content Protection for AR EDITZ

Add a protection layer to prevent unauthorized copying, downloading, and hotlinking of video and poster samples while maintaining a smooth viewing experience for clients.

## User Review Required

> [!IMPORTANT]
>
> - 100% protection against OS-level screenshots or specialized recording software is not possible in a standard web browser.
> - We will implement "deterrence" (making it difficult for average users) using the strongest available browser-level techniques.
> - We will use short-lived "signed URLs" for all media so they cannot be easily shared or hotlinked.

## Proposed Changes

### Database & Storage (Backend)

- Update storage bucket settings: Make `product-media` private (remove public read).
- Add a new database migration to tighten RLS policies on `storage.objects`.

### Media Access (Server-Side)

- Implement a server function to generate short-lived signed URLs (e.g., valid for 1 hour) for product media.
- This ensures media links expire and cannot be hotlinked elsewhere.

### Frontend Protection (Deterrence)

- **Video Player**:
  - Disable right-click context menu on video elements.
  - Disable the standard browser "Download" option in the control bar.
  - Use `onContextMenu={(e) => e.preventDefault()}`.
- **Image Viewer**:
  - Disable right-click and dragging on poster images.
  - Overlay a transparent "guard" div to prevent "Save Image As".
- **Visual Deterrence (Watermark)**:
  - Add a subtle, semi-transparent "AR EDITZ" watermark overlay to the video player and image lightbox.
- **Capture Deterrence**:
  - Implement a visibility/focus listener to detect if the user switches tabs or if a capture event might be starting (where APIs allow).
  - Display a warning toast/notification if suspicious behavior is detected.

### Admin Portal (No Change)

- Ensure the admin panel still has full access to manage media.

## Technical Details

- **Signed URLs**: Use `supabase.storage.from('product-media').createSignedUrl(path, 3600)`.
- **Watermark**: CSS-based overlay using absolute positioning and `pointer-events: none`.
- **Deterrence Logic**:
  - `onContextMenu`: Prevent default browser menu.
  - `onDragStart`: Prevent image dragging.
  - `controlsList="nodownload"`: Standard HTML5 video attribute for Chromium-based browsers.
- **Storage Privacy**: Update `public: false` in `storage.buckets`.

## Next Steps

1. Create a migration to make the bucket private.
2. Update `src/routes/index.tsx` to use signed URLs for all media.
3. Add the UI protection layers (watermark, context menu blocking, guard overlays).
4. Add the capture warning logic.  
  
`Content-Disposition: inline`
5. No `Content-Disposition: attachment`
6. No public bucket
7. Private bucket
8. Short-lived signed URLs
9. Server-side authorization before generating URL
10. Storage policies
11. No permanent media URLs in database/frontend
12. No raw storage path exposed unnecessarily
13. Hotlinking prevention
14. Watermark
15. Right-click/download deterrence  
  
WATERMARK — DO NOT DAMAGE THE ORIGINAL SAMPLE DESIGN
  The AR EDITZ watermark is only a **secondary anti-copying deterrent**.
  It must NEVER interfere with the client's ability to properly judge the sample.
  ### STRICT REQUIREMENTS
  - Never modify the original uploaded image or video file.
  - Never permanently embed the watermark into the owner's original media.
  - Do not place the watermark over important design elements.
  - Do not cover text, faces, logos, products, main subjects, or other important content.
  - Do not use a large or intrusive watermark.
  - Do not use high opacity.
  - Do not repeat the watermark excessively if it makes the sample visually messy.
  - Keep the watermark subtle, professional, and visually unobtrusive.
  - Position it in an area that does not interfere with the actual sample content whenever possible.
  ### MOST IMPORTANT RULE
  **The sample itself is more important than the watermark.**
  If a watermark placement would noticeably damage the visual quality or make the sample difficult to evaluate, **do not place it there.**
  The original uploaded media must remain completely unchanged.
  The watermark should exist only as a viewing-layer deterrent.
  The main security should come from:
  **Private Supabase Storage + Storage policies + authorized signed URLs + short URL expiry + no download mechanism + anti-hotlinking.**
  Do not compensate for weak security by making the watermark huge or intrusive.
  ### FINAL RESULT
  The client should see:
  **A clean, professional AR EDITZ sample with a subtle ownership indication — NOT a sample covered by a watermark.**