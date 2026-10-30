import type { CollectionConfig } from "payload"

export const AuditLogs: CollectionConfig = {
  slug: "audit-logs",
  admin: {
    useAsTitle: "action",
    group: "System",
  },
  access: {
    create: ({ req }) => req.user?.collection === "users",
    delete: () => false,
    read: ({ req }) =>
      req.user?.collection === "users" && req.user.role === "admin",
    update: () => false,
  },
  fields: [
    { name: "actor", type: "relationship", relationTo: "users" },
    { name: "action", type: "text", required: true },
    { name: "entityType", type: "text", required: true },
    { name: "entityId", type: "text" },
    { name: "occurredAt", type: "date", required: true },
    { name: "metadata", type: "json" },
  ],
}
