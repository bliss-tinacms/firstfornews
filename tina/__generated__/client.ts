import { createClient } from "tinacms/dist/client";
import { queries } from "./types.js";
export const client = createClient({ cacheDir: '/tmp/firstfornews-work/firstfornews/tina/__generated__/.cache/1789660848869', url: 'http://localhost:4001/graphql', token: 'undefined', queries,  });
export default client;
  