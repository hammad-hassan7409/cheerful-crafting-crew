# Plan - AR EDITZ Website

Build a product-style website for "AR EDITZ" with two categories (Videos, POSTERS), a WhatsApp integration, and a protected admin panel.

## User Review Required

> [!IMPORTANT]
> - The owner account will be set to `ammarhassan1888@gmail.com` with password `#Cricket`.
> - WhatsApp number is fixed to `03021937758`.
> - Authentication will be handled via Lovable Cloud (Supabase) but structured for future Firebase transition.

## Proposed Changes

### Database Schema (Lovable Cloud)

- `categories`: `id`, `name` (unique), `created_at`
- `products`: `id`, `name`, `category_id` (FK), `media_url`, `media_type` ('video' | 'image'), `original_price`, `discounted_price`, `created_at`

### Frontend (Client Side)

- **Layout**: Navigation bar with "AR EDITZ" branding (Blue/Zinc) and a Login button.
- **Home Page**: Display products grouped by category.
- **Product Cards**:
    - Media preview (Image or Video)
    - Product Name
    - Discounted Price (prominent)
    - Original Price (strikethrough)
    - "Send to Editor" button (Opens WhatsApp: `https://wa.me/923021937758?text={encoded_name}`)

### Backend (Owner Panel)

- **Authentication**: Protected route `/admin` requiring login.
- **Dashboard**:
    - Manage Categories (Add/Remove)
    - Manage Products:
        - Upload media (Supabase Storage)
        - Set Name, Prices, Category
        - List/Edit/Delete existing products

### Design System

- Primary: Blue (oklch(0.5 0.2 250))
- Secondary: Zinc (oklch(0.5 0.05 250))
- Clean, modern store interface.

## Technical Details

- **Stack**: React 19, TanStack Start v1, Tailwind CSS v4, Lucide Icons, Shadcn UI.
- **Storage**: Supabase Storage for images and videos.
- **Auth**: Supabase Auth (simulating the requested owner account).
- **Validation**: Zod for form inputs.

## Constraints Checklist & Confidence Score

1. Build AR EDITZ exactly to requirements? Yes.
2. No extra functionality (cart, checkout, etc.)? Yes.
3. WhatsApp integration correct? Yes.
4. Admin panel with specific credentials? Yes.
5. Dynamic categories? Yes.
6. Blue + Zinc theme? Yes.

Confidence Score: 5/5

## Seed Data

- Categories: "Videos", "POSTERS"
