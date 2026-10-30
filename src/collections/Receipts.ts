import type { CollectionConfig } from "payload"

const isStaff = (
  user: { collection?: string; role?: string } | null | undefined,
) =>
  user?.collection === "users" &&
  ["admin", "merchant", "cashier"].includes(user.role ?? "")

export const Receipts: CollectionConfig = {
  slug: "receipts",
  admin: {
    useAsTitle: "receiptNumber",
    group: "Receipt operations",
  },
  access: {
    create: ({ req }) => isStaff(req.user),
    delete: ({ req }) =>
      req.user?.collection === "users" &&
      ["admin", "merchant"].includes(req.user.role),
    read: () => true,
    update: ({ req }) => isStaff(req.user),
  },
  fields: [
    {
      name: "receiptNumber",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    {
      name: "paymentType",
      type: "select",
      required: true,
      options: [
        "paynow",
        "card",
        "cash",
        "ewallet",
        "bank-transfer",
        "imported",
      ],
    },
    {
      name: "merchant",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
    { name: "cashier", type: "relationship", relationTo: "users" },
    { name: "customer", type: "relationship", relationTo: "users" },
    { name: "customerName", type: "text" },
    { name: "customerEmail", type: "email" },
    { name: "totalAmount", type: "number", required: true, min: 0 },
    { name: "transactionDate", type: "date", required: true },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "issued",
      options: [
        "issued",
        "viewed",
        "refund-pending",
        "partially-refunded",
        "refunded",
      ],
    },
    {
      name: "items",
      type: "array",
      required: true,
      fields: [
        { name: "name", type: "text", required: true },
        { name: "quantity", type: "number", required: true, min: 1 },
        { name: "unitPrice", type: "number", required: true, min: 0 },
      ],
    },
    { name: "importBatchReference", type: "text" },
  ],
}
