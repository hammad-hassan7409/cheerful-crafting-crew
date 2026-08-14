# Plan: Add Image Zoom Functionality to Product Detail Page

Add Zoom In, Zoom Out, and Reset Zoom controls for image/poster products on the product detail page while maintaining existing media protection.

## Proposed Changes

### Frontend Implementation
- **Update `src/routes/products.$productId.tsx`**:
    - Add `zoom` state (defaulting to 1.0).
    - Implement `handleZoomIn`, `handleZoomOut`, and `handleResetZoom` functions.
    - Add zoom controls (buttons) to the UI, visible only for image products.
    - Wrap the image in a transition-enabled `div` that applies the `scale` transformation.
    - Ensure the `ProtectedMedia` overlay still covers the zoomed image.
    - Style the zoom controls using the "Blue + Zinc" design system (consistent with existing buttons and cards).

### Security & Protection
- Maintain `onContextMenu` and `onDragStart` preventions.
- Keep the transparent overlay over the image.
- Ensure no download or "Save As" options are exposed.

## Technical Details
- **State**: `const [zoom, setZoom] = useState(1);`
- **Zoom Range**: 1.0 to 3.0 (adjustable).
- **Icons**: Use `ZoomIn`, `ZoomOut`, and `RotateCcw` from `lucide-react`.
- **Layout**: Place zoom controls as a floating bar on the image or just below the image container.

## Verification Plan
- Navigate to an image product detail page.
- Verify zoom buttons appear.
- Test Zoom In: Image should scale up.
- Test Zoom Out: Image should scale down (minimum 1.0).
- Test Reset: Image should return to original size.
- Verify right-click protection still works on zoomed image.
- Navigate to a video product and confirm zoom buttons are NOT present.
