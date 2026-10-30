import type { CollectionConfig } from "payload"

const isAppUser = (user: { collection?: string } | null | undefined) =>
  user?.collection === "users"

export const Refunds: CollectionConfig = {
  slug: "refunds",
  admin: {
    useAsTitle: "id",
    group: "Receipt operations",
  },
  access: {
    create: ({ req }) => isAppUser(req.user),
    delete: ({ req }) =>
      req.user?.collection === "users" && req.user.role === "admin",
    read: ({ req }) => isAppUser(req.user),
    update: ({ req }) =>
      req.user?.collection === "users" &&
      ["admin", "merchant"].includes(req.user.role),
  },
  fields: [
    {
      name: "receipt",
      type: "relationship",
      relationTo: "receipts",
      required: true,
    },
    {
      name: "requestedBy",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
    { name: "requestDate", type: "date", required: true },
    { name: "amount", type: "number", required: true, min: 0 },
    { name: "reason", type: "textarea", required: true },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: ["pending", "approved", "rejected", "refunded"],
    },
    { name: "merchantNote", type: "textarea" },
  ],
}
