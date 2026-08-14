# Plan: Rebuild Video System for AR EDITZ

We will rebuild the video system from scratch, focusing on reliability, performance, and original quality. The system will use native browser playback with custom external controls, ensuring media protection while providing a seamless user experience.

## Technical Details

### 1. Database and Schema Updates
- Update `src/lib/products-admin.functions.ts` to allow `media_type` as either `"image"` or `"video"`.
- The database schema already supports `media_type` as a string, so no migration is required, but we will ensure the application logic correctly handles both.

### 2. Admin Portal Enhancements
- **Multi-type Upload**: Update `handleFileUpload` to support both images and videos.
- **Local Preview**: Implement instant local preview for videos using `URL.createObjectURL`.
- **Efficient Uploading**: Use direct Supabase Storage uploads with correct MIME types and progress tracking.
- **No Processing**: Ensure videos are uploaded in their original quality without re-encoding.

### 3. Frontend Video Player
- **Custom Player Component**: Create a `VideoPlayer` component that uses the native `<video>` element with `preload="metadata"` and `playsInline`.
- **External Controls**: Build a custom control bar located *below* the video area, including Play/Pause, Progress/Seek, Time, Volume, and Fullscreen.
- **Reliable Playback**: Handle signed URL transitions smoothly.
- **No Overlays**: Ensure the video area remains clean, with no buttons or text over the media.

### 4. Media Security
- **Signed URLs**: Continue using short-lived signed URLs for private storage access.
- **Stability**: Ensure signed URLs are stable during playback and only refreshed when necessary.
- **Protected Media**: Wrap the player in the existing `ProtectedMedia` system to prevent unauthorized copying.

### 5. Files to be Modified
- `src/lib/products-admin.functions.ts`: Update validation schema.
- `src/routes/admin/products.$productId.tsx`: Update upload and preview logic.
- `src/routes/index.tsx`: Implement video preview in the gallery.
- `src/routes/products.$productId.tsx`: Implement the full video player with external controls.
- `src/components/VideoPlayer.tsx`: (New) Reusable video player component with external controls.

## User Review Required

> [!IMPORTANT]
> - The video bucket `product-media` must remain private for security.
> - Videos will play using signed URLs which provide security but require standard browser range-request support for efficient buffering.
