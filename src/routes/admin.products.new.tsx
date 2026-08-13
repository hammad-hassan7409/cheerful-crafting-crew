import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/products/new")({
  beforeLoad: ({ navigate }) => {
    throw navigate({
      to: "/admin/products/$productId",
      params: { productId: "new" },
      replace: true,
    });
  },
});
