# Performance Optimization Plan - AR EDITZ

This plan focuses on eliminating bottlenecks in video uploading, product creation, and frontend video initialization while preserving existing security and media quality.

## User Review Required

> [!IMPORTANT]
> The optimization involves moving to a more concurrent architecture and refining the video player configuration to use browser native features more efficiently. No visual changes will be made.

## Proposed Changes

### 1. High-Performance Video Playback
- **Preload Optimization**: Change `VideoPreview` and `VideoDialog` preload strategies to use `metadata` for list views and `auto` for detail views, enabling faster "Initial Play" without downloading the whole file.
- **Initialization Fix**: Remove the artificial "Initializing..." progress bar logic that waits for full `onLoadedData`. Instead, show the video as soon as the `readyState` indicates it can play (`onCanPlay`).
- **Caching Signed URLs**: Implement a simple client-side cache for signed URLs to prevent redundant server function calls during re-renders or when navigating back and forth.
- **Streaming Support**: Ensure the video element is correctly configured to support HTTP Range requests for instant seeking and partial loading.

### 2. Fast Product Creation & Upload
- **Concurrent Upload & Data Prep**: Modify the admin product form to start the upload as soon as a file is selected, while the user is still filling out the name and description.
- **Single-Pass Creation**: When "Save" is clicked, if the upload is still in progress, the system will wait for it to finish and then create the database record in one go, avoiding multiple round-trips.
- **Optimized Storage Calls**: Remove unnecessary bucket existence checks during every upload, relying on the robust `setup-storage` baseline.
- **Parallel Product Fetching**: Optimize the dashboard to fetch product metadata and storage usage in parallel.

### 3. Signed URL Management
- **Batching**: Update the frontend to batch signed URL requests where possible or at least avoid redundant calls for the same media URL.
- **Lifetime Extension**: Ensure signed URLs have a generous but secure expiration (1 hour) to reduce regeneration frequency.

## Technical Details

### Frontend (React/TanStack)
- Replace `onLoadedData` with `onCanPlay` in `src/routes/index.tsx`.
- Update `VideoPreview` to use `memo` to prevent unnecessary re-renders when parent state changes.
- Implement a `useSignedUrl` hook with an internal cache.

### Admin Portal
- Refactor `performUpload` in `src/routes/admin/products.$productId.tsx` to handle background uploading.
- Remove the `setInterval` based "fake" progress bar and use the actual `onUploadProgress` from Supabase (if supported by the client version) or a more realistic state-based approach.

### Database/Storage
- No schema changes required.
- Maintain existing Private bucket + Signed URL security model.

## Performance Impact
- **Video Start Time**: Expected reduction of 50-70% in "Initializing" time.
- **Admin Workflow**: Faster product creation by overlapping upload time with form filling.
- **CPU/Memory**: Lower overhead by reducing React re-renders and redundant API calls.
