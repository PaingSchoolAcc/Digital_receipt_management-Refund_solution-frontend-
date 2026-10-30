import type {
  CollectionBeforeValidateHook,
  CollectionConfig,
  PayloadRequest,
  Where,
} from "payload"

const isAppUser = (req: PayloadRequest) => req.user?.collection === "users"

const isAppAdmin = (req: PayloadRequest) =>
  req.user?.collection === "users" && req.user.role === "admin"

const approvedMerchants: Where = {
  and: [
    { role: { equals: "merchant" } },
    { approvalStatus: { equals: "approved" } },
  ],
}

const preventPublicAdminRegistration: CollectionBeforeValidateHook = ({
  data,
  operation,
  req,
}) => {
  if (
    operation === "create" &&
    data?.role === "admin" &&
    req.user?.collection !== "admins" &&
    !(req.user?.collection === "users" && req.user.role === "admin")
  ) {
    throw new Error(
      "Admin accounts cannot be created through public registration.",
    )
  }
  return data
}

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    hidden: true,
    useAsTitle: "name",
  },
  auth: true,
  hooks: {
    beforeValidate: [preventPublicAdminRegistration],
  },
  access: {
    create: () => true,
    delete: ({ req }) => isAppAdmin(req),
    read: ({ req }) => {
      if (req.user?.collection === "admins" || isAppAdmin(req)) return true
      if (!isAppUser(req)) return approvedMerchants
      return {
        or: [
          { id: { equals: req.user?.id } },
          approvedMerchants,
        ],
      }
    },
    update: ({ req }) => {
      if (req.user?.collection === "admins" || isAppAdmin(req)) return true
      if (isAppUser(req)) return { id: { equals: req.user?.id } }
      return false
    },
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "customer",
      options: ["admin", "merchant", "cashier", "customer"],
    },
    {
      name: "phone",
      type: "text",
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "approvalStatus",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: ["pending", "approved", "rejected", "suspended"],
      access: {
        create: ({ req }) =>
          req.user?.collection === "admins" ||
          (req.user?.collection === "users" && req.user.role === "admin"),
        update: ({ req }) =>
          req.user?.collection === "admins" ||
          (req.user?.collection === "users" &&
            ["admin", "merchant"].includes(req.user.role)),
      },
    },
    {
      name: "merchant",
      type: "relationship",
      relationTo: "users",
      filterOptions: {
        and: [
          { role: { equals: "merchant" } },
          { approvalStatus: { equals: "approved" } },
        ],
      },
    },
    {
      name: "cashierIcNumber",
      type: "text",
      admin: {
        condition: (_, siblingData) => siblingData?.role === "cashier",
      },
    },
    {
      name: "approvalCode",
      type: "text",
      admin: {
        condition: (_, siblingData) => siblingData?.role === "cashier",
        description: "Optional merchant-issued code for in-person onboarding.",
      },
    },
    {
      name: "company",
      type: "group",
      admin: {
        condition: (_, siblingData) => siblingData?.role === "merchant",
      },
      fields: [
        { name: "legalName", type: "text" },
        { name: "registrationNumber", type: "text" },
        { name: "address", type: "textarea" },
      ],
    },
    {
      name: "paymentProfile",
      type: "group",
      fields: [
        {
          name: "bankAccountLast4",
          type: "text",
          admin: {
            description: "Only a masked account suffix is stored.",
          },
        },
        {
          name: "cardLast4",
          type: "text",
          admin: {
            description: "Only the final four card digits are stored.",
          },
        },
        {
          name: "paymentTokenReference",
          type: "text",
          admin: {
            description:
              "Reference from a PCI-compliant payment provider. Never store CVV or full card details.",
          },
        },
      ],
    },
  ],
}
