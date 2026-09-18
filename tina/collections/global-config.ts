import type { Collection } from "tinacms";

const linkFields = [
  { name: "title", label: "Link Label", type: "string" },
  { name: "link", label: "Link URL", type: "string" },
];

export const GlobalConfigCollection: Collection = {
  name: "config",
  label: "Global Config",
  path: "src/content/config",
  format: "json",
  ui: {
    global: true,
  },
  fields: [
    {
      name: "favicon",
      label: "Favicon",
      type: "image",
      description: "Legacy top-level favicon field kept for TinaCloud schema compatibility. Prefer Site Identity & SEO → Favicon for editing.",
    },
    {
      name: "seo",
      label: "Site Identity & SEO",
      type: "object",
      fields: [
        { name: "title", label: "Site Name", type: "string" },
        { name: "description", label: "Default Meta Description", type: "string", ui: { component: "textarea" } },
        { name: "siteOwner", label: "Site Owner", type: "string" },
        { name: "logo", label: "Logo", type: "image" },
        {
          name: "favicon",
          label: "Favicon",
          type: "image",
          description: "Upload the browser tab/site icon. Recommended: square PNG, SVG, or ICO.",
        },
        {
          name: "footerLogo",
          label: "Footer Logo",
          type: "image",
          description: "Upload the logo used in the footer. Falls back to the header logo when empty.",
        },
      ],
    },
    {
      name: "contactForm",
      label: "Contact Form",
      type: "object",
      fields: [
        { name: "formspreeEndpoint", label: "Formspree Endpoint URL", type: "string" },
        { name: "heading", label: "Heading", type: "string" },
        { name: "description", label: "Description", type: "string", ui: { component: "textarea" } },
        { name: "buttonText", label: "Button Text", type: "string" },
        { name: "note", label: "Form Note", type: "string", ui: { component: "textarea" } },
        { name: "subject", label: "Email Subject", type: "string" },
      ],
    },
    {
      name: "codeInjection",
      label: "Code Injection",
      type: "object",
      fields: [
        { name: "headerCode", label: "Header Code", type: "string", ui: { component: "textarea" } },
        { name: "footerCode", label: "Footer Code", type: "string", ui: { component: "textarea" } },
      ],
    },
    {
      name: "contactLinks",
      label: "Contact Links",
      type: "object",
      list: true,
      ui: { itemProps: (item) => ({ label: item.title }) },
      fields: [
        { name: "title", label: "Title", type: "string" },
        { name: "link", label: "Link", type: "string" },
        { name: "icon", label: "Icon", type: "string" },
      ],
    },
    {
      name: "footerStarfield",
      label: "Show starfield in footer",
      type: "boolean",
    },
  ],
};
