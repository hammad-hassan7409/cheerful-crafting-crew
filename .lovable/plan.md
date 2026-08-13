# Plan: AR EDITZ Visual & Media Display Upgrade

This plan focuses on improving the UI/UX to a professional creative portfolio style and fixing the media display issue where uploaded videos and images are not rendering correctly.

## 1. UI/UX Professional Redesign
- **Color Palette & Typography**: Refine the Blue (#0066FF / oklch(0.5 0.2 250)) and Zinc (oklch(0.5 0.05 250)) palette. Introduce a dark-themed, sleek creative aesthetic.
- **Visual Hierarchy**: Use larger, bold typography for headings and clean, subtle text for metadata.
- **Card Design**: Redesign product cards with glassmorphism effects, better spacing, and smoother hover transitions.
- **Navigation**: Improve the header with a more premium feel, better logo placement, and consistent padding.
- **Responsiveness**: Ensure the layout adapts gracefully across all screen sizes (Desktop, Tablet, Mobile).

## 2. Media Display Fixes
- **Video Rendering**: Ensure videos use a proper HTML5 player with basic controls. Fix path resolution if storage URLs are not fully qualified.
- **Image Rendering**: Implement a lightbox or a "zoom-to-view" feature for posters to allow high-quality viewing.
- **Loading States**: Add skeleton loaders or smooth fade-ins for media to prevent layout shifts.

## Technical Details
- **Frontend**: Update `src/routes/index.tsx` with enhanced Tailwind classes and structured layouts.
- **Styles**: Modify `src/styles.css` to include specialized theme variables for the creative portfolio look.
- **Components**: Enhance `src/components/ui/button.tsx` or local card components for better hover interactions.
- **Media Logic**: Verify `supabase.storage.getPublicUrl()` usage if needed to ensure accessible URLs.

## Security & Constraints
- No changes to backend logic, authentication, or WhatsApp functionality.
- Existing pricing and product data will be preserved exactly.
