# Plan - Add Category Editing

Add an edit option for categories in the admin portal to allow users to fix mistakenly named categories.

## User Review Required

> [!NOTE]
> The edit option will be added to the Manage Categories page in the Admin Portal.

- No critical items requiring user attention.

## Proposed Changes

### Admin UI

#### [src/routes/admin/categories.tsx]
- Add `editingId` and `editingName` state to track which category is being renamed.
- Implement an `updateMutation` using TanStack Query to send updates to the database.
- Update the UI list to show an input field and "Save/Cancel" buttons when a category is in edit mode.
- Add an "Edit" icon button to each category row to trigger edit mode.
- Ensure the name is trimmed and converted to uppercase, consistent with the add logic.

## Technical Details

### Database Interaction
- Use `supabase.from("categories").update({ name }).eq("id", id)` to update the record.
- Invalidate the `categories` query on success to refresh the UI.

### Component Logic
- `handleEdit(category)`: Sets `editingId` and `editingName`.
- `handleUpdate()`: Triggers the mutation and resets state on success.
- `handleCancel()`: Resets editing state.
