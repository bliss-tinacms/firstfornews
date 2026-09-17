function cleanSlug(value?: string | null): string {
  if (!value || typeof value !== "string") return "";
  let input = value.trim().toLowerCase();
  if (!input) return "";
  if (input.startsWith("http://") || input.startsWith("https://")) {
    input = input.split("/").slice(3).join("/");
  }
  input = input.split("?")[0].split("#")[0].split("\\").join("/");
  while (input.startsWith("/")) input = input.slice(1);
  while (input.endsWith("/")) input = input.slice(0, -1);
  while (input.includes("//")) input = input.split("//").join("/");

  const parts = input.split("/").map((part) => {
    let out = "";
    let dash = false;
    for (const ch of part) {
      const ok = (ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9");
      if (ok) {
        out += ch;
        dash = false;
      } else if (!dash) {
        out += "-";
        dash = true;
      }
    }
    while (out.startsWith("-")) out = out.slice(1);
    while (out.endsWith("-")) out = out.slice(0, -1);
    return out;
  }).filter(Boolean);

  return parts.join("/");
}

function fileSlug(item: any): string {
  return cleanSlug(item?._sys?.filename || item?._sys?.basename || item?.slug || "");
}

export function getBlogRouteSlug(item: any): string {
  const raw = cleanSlug(item?.permalink) || fileSlug(item);
  return raw.startsWith("blog/") ? raw.slice(5) : raw;
}

export function getBlogPermalink(item: any): string {
  const slug = getBlogRouteSlug(item);
  return slug ? "/" + slug : "/blog";
}

export function getCategoryRouteSlug(item: any): string {
  return cleanSlug(item?._sys?.filename || item?._sys?.basename || item?.title || item?.name || "");
}

export function getCategoryPermalink(item: any): string {
  const slug = getCategoryRouteSlug(item);
  return slug ? "/" + slug : "/blog";
}

export function getPageRouteSlug(item: any): string {
  return cleanSlug(item?.permalink) || fileSlug(item);
}

export function getPagePermalink(item: any): string {
  const slug = getPageRouteSlug(item);
  return slug ? "/" + slug : "/";
}
