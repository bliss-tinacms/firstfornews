import { defineConfig } from "tinacms";
import { BlogCollection } from "./collections/blog";
import { CategoryCollection } from "./collections/category";
import { GlobalConfigCollection } from "./collections/global-config";
import { NavigationCollection } from "./collections/navigation";
import { PageCollection } from "./collections/page";
import { UserCollection } from "./collections/user";

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.NEXT_PUBLIC_TINA_BRANCH ||
  process.env.TINA_BRANCH ||
  process.env.PUBLIC_TINA_BRANCH ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ||
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.WORKERS_CI_BRANCH ||
  process.env.CF_PAGES_BRANCH ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  contentApiUrlOverride: process.env.NEXT_PUBLIC_TINA_CONTENT_API_URL || process.env.TINA_PUBLIC_TINA_CONTENT_API_URL,
  branch,

  // Get this from tina.io
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || process.env.PUBLIC_TINA_CLIENT_ID || process.env.TINA_PUBLIC_CLIENT_ID || "40bc8cd1-d0fe-4061-b99c-d91be2de59e0",
  // Get this from tina.io
  token: process.env.NEXT_PUBLIC_TINA_TOKEN || process.env.TINA_PUBLIC_TINA_TOKEN || process.env.TINA_TOKEN,
    media: {
    loadCustomStore: async () => {
      const pack = await import("next-tinacms-cloudinary");
      return pack.TinaCloudCloudinaryMediaStore;
    },
  },
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },

  // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/schema/
  schema: {
    collections: [
      BlogCollection,
      CategoryCollection,
      PageCollection,
      UserCollection,
      NavigationCollection,
      GlobalConfigCollection,
    ],
  },
});
