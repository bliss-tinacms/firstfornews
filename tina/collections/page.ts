import type { Collection } from 'tinacms';
import { heroBlockSchema } from '../../src/components/blocks/hero.template';
import { featuresBlockSchema } from '../../src/components/blocks/features.template';
import { statsBlockSchema } from '../../src/components/blocks/stats.template';
import { ctaBlockSchema } from '../../src/components/blocks/cta.template';
import { testimonialBlockSchema } from '../../src/components/blocks/testimonial.template';
import { calloutBlockSchema } from '../../src/components/blocks/callout.template';
import { contentBlockSchema } from '../../src/components/blocks/content.template';
import { videoBlockSchema } from '../../src/components/blocks/video.template';
import { splitBlockSchema } from '../../src/components/blocks/split.template';
import { aboutMockup17BlockSchema } from '../../src/components/blocks/about-mockup17.template';
import { contactMockup17BlockSchema } from '../../src/components/blocks/contact-mockup17.template';
import { ourTeamMockup17BlockSchema } from '../../src/components/blocks/our-team-mockup17.template';
import { seoFields } from '../fields/seo';
import { viewFrontendField } from '../fields/view-frontend';
import { homepageTemplateBlockSchema } from '../../src/components/blocks/homepage-template.template';


function slugifyFilename(value?: string | null): string {
  if (!value || typeof value !== "string") return "untitled";
  let input = value.trim().toLowerCase();
  if (!input) return "untitled";

  if (input.startsWith("http://") || input.startsWith("https://")) {
    const parts = input.split("/");
    input = parts.slice(3).join("/");
  }

  input = input.split("?")[0].split("#")[0];
  input = input.split("\\").join("/");
  while (input.startsWith("/")) input = input.slice(1);
  while (input.endsWith("/")) input = input.slice(0, -1);
  if (input.startsWith("blog/")) input = input.slice(5);

  let output = "";
  let lastWasDash = false;
  for (const ch of input) {
    const isLetter = ch >= "a" && ch <= "z";
    const isNumber = ch >= "0" && ch <= "9";
    const isSlash = ch === "/";
    const isAllowed = isLetter || isNumber || isSlash || ch === "-" || ch === "_" || ch === ".";
    if (isAllowed) {
      output += ch;
      lastWasDash = false;
    } else if (!lastWasDash) {
      output += "-";
      lastWasDash = true;
    }
  }

  while (output.startsWith("-")) output = output.slice(1);
  while (output.endsWith("-")) output = output.slice(0, -1);
  while (output.includes("//")) output = output.split("//").join("/");
  return output || "untitled";
}

function cleanPublicSlug(value?: string | null): string {
  if (!value || typeof value !== "string") return "";
  let input = value.trim().toLowerCase();
  if (!input || input === "untitled") return "";

  if (input.startsWith("http://") || input.startsWith("https://")) {
    const parts = input.split("/");
    input = parts.slice(3).join("/");
  }

  input = input.split("?")[0].split("#")[0];
  input = input.split("\\").join("/");
  while (input.startsWith("/")) input = input.slice(1);
  while (input.endsWith("/")) input = input.slice(0, -1);
  while (input.includes("//")) input = input.split("//").join("/");
  return input;
}

function filenameFromDocument(document: any): string {
  return cleanPublicSlug(document?._sys?.filename || document?._sys?.basename || "");
}

export const PageCollection: Collection = {
  name: 'page',
  label: 'Pages',
  path: 'src/content/page',
  format: 'mdx',
  ui: {
    filename: {
      readonly: false,
      parse: (filename) => slugifyFilename(filename),
      slugify: (values) => slugifyFilename(values?.title || 'untitled'),
    },
    router: ({ document }) => {
      const slug = cleanPublicSlug((document as any)?.permalink) || filenameFromDocument(document);
      if (!slug || slug === "home" || slug === "index") return "/";
      return "/" + slug;
    },
  },
  fields: [
    viewFrontendField('page'),
    {
      name: 'title',
      label: 'Title',
      type: 'string',
      isTitle: true,
      required: true,
      description: 'Main visible page title shown at the top of the frontend page.',
    },
    {
      name: 'permalink',
      label: 'Permalink',
      type: 'string',
      description: 'Optional custom public URL path. Leave blank to use the filename/slug.',
    },

    seoFields,
    {
      type: 'object',
      list: true,
      name: 'blocks',
      label: 'Page Sections',
      description:
        "The visible content of the page. When the page starts with a Hero block, its Headline is the main on-page heading â€” edit that to change what visitors see at the top.",
      ui: { visualSelector: true },
      templates: [
        homepageTemplateBlockSchema,
        aboutMockup17BlockSchema,
        ourTeamMockup17BlockSchema,
        contactMockup17BlockSchema,
        heroBlockSchema,
        calloutBlockSchema,
        featuresBlockSchema,
        statsBlockSchema,
        ctaBlockSchema,
        contentBlockSchema,
        testimonialBlockSchema,
        videoBlockSchema,
        splitBlockSchema,
      ],
    },
  ],
};
