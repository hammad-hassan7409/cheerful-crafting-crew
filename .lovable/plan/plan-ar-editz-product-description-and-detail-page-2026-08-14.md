# Plan: AR EDITZ - Product Description and Detail Page

Implement a product description field in the admin panel with a 500-word limit and create a dedicated product detail page for customers to view detailed information and contact the editor.

## User Review Required

> [!IMPORTANT]
> The product detail page will use a new route `/products/$productId`. The existing "Send to Editor" button on the homepage will be updated to link to this detail page first, or should I keep the button on the homepage and just add a click handler to the card for the detail page? I will assume the card itself becomes clickable to the detail page, and the "Send to Editor" button remains on both for convenience.

## Proposed Changes

### Database
- Add `description` column to the `products` table.

### Admin Panel
- Update `src/routes/admin/products.$productId.tsx`:
    - Add `description` field to the Zod schema with a custom validator for the 500-word limit.
    - Add a `Textarea` component for the description in the form.
    - Implement real-time word count feedback and validation messages.

### Routing & Detail Page
- Create `src/routes/products.$productId.tsx`:
    - Fetch product data and signed media URL.
    - Implement a layout with media on one side (or top) and product info (Name, Prices, Description, Send to Editor button) on the other.
    - Maintain existing media protection (no right-click, etc.).
    - Ensure the WhatsApp link uses the correct international format and only contains the product name.

### Frontend Enhancements
- Update `src/routes/index.tsx`:
    - Wrap the `ProductCard` in a `Link` to the new detail page.
    - Ensure the "Send to Editor" button on the homepage still works directly if requested, or redirects to the detail page. (User asked for: "Main Product Listing → Click Product → Product Detail Page").

## Technical Details
- **Word Count Logic**: `description.trim().split(/\s+/).length` will be used to enforce the 500-word limit.
- **Media Protection**: Reuse the `ProtectedMedia` component on the new detail page.
- **Zod Validation**: `z.string().refine(val => val.trim().split(/\s+/).length <= 500, "Maximum description length is 500 words")`.
- **WhatsApp**: Use `https://wa.me/923021937758?text=${encodeURIComponent(product.name)}`.

## Constraints & Rules
- Blue + Zinc theme only.
- No Daraz branding/features (ratings, cart, etc.).
- 500-word limit is strict.
- WhatsApp number must be exactly `923021937758`.
- Message must only be the product name.
