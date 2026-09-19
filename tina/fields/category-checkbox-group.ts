// @ts-nocheck
import React from "react";

const CATEGORY_OPTIONS = [
  { label: "Business", value: "src/content/category/Business.json" },
  { label: "Featured", value: "src/content/category/Featured.json" },
  { label: "Health", value: "src/content/category/Health.json" },
  { label: "Lifestyle", value: "src/content/category/Lifestyle.json" },
  { label: "Politics", value: "src/content/category/Politics.json" },
  { label: "Technology", value: "src/content/category/Technology.json" },
  { label: "World", value: "src/content/category/World.json" },
];

function basename(value: unknown) {
  return String(value || "")
    .split("/")
    .pop()
    ?.replace(/\.(json|mdx?)$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "";
}

function normalizeItem(item: any): string[] {
  if (!item) return [];
  if (typeof item === "string") return [item, basename(item)];
  if (typeof item === "object") {
    const candidates = [
      item.category,
      item.value,
      item.label,
      item.title,
      item.name,
      item._sys?.path,
      item._sys?.relativePath,
      item._sys?.filename,
    ].filter(Boolean);
    return candidates.flatMap((candidate) => [String(candidate), basename(candidate)]);
  }
  return [String(item), basename(item)];
}

function normalizeValue(value: any) {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const keys = new Set<string>();
  for (const item of raw) {
    for (const key of normalizeItem(item)) {
      if (key) keys.add(key);
    }
  }
  return keys;
}

function canonicalize(value: any) {
  const keys = normalizeValue(value);
  return CATEGORY_OPTIONS
    .filter((option) => keys.has(option.value) || keys.has(basename(option.value)) || keys.has(option.label) || keys.has(basename(option.label)))
    .map((option) => option.value);
}

function toTinaCategoryObjects(values: string[]) {
  return values.map((value) => ({ category: value }));
}

export function CategoryCheckboxGroupField({ input, field, disabled = false }: any) {
  const [hydratedSelected, setHydratedSelected] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    try {
      const hash = String(window.location.hash || "");
      const slug = hash.split("/").filter(Boolean).pop();
      if (!slug || slug === "~") return;
      const relativePath = `${slug}.mdx`;
      fetch(`/tina-content-proxy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          query: `query BlogCategoryRead($relativePath:String!){ blog(relativePath:$relativePath){ categories } }`,
          variables: { relativePath },
        }),
      })
        .then((response) => response.json())
        .then((payload) => {
          const values = canonicalize(payload?.data?.blog?.categories);
          if (values.length) setHydratedSelected(values);
        })
        .catch(() => {});
    } catch (_error) {}
  }, [input?.name]);

  const selected = hydratedSelected ?? canonicalize(input?.value);
  const selectedSet = new Set(selected);
  const name = input?.name || field?.name || "categories";

  function toggle(value: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(value);
    else next.delete(value);
    const values = CATEGORY_OPTIONS.filter((option) => next.has(option.value)).map((option) => option.value);
    setHydratedSelected(values);
    try {
      const hash = String(window.location.hash || "");
      const slug = hash.split("/").filter(Boolean).pop();
      if (!slug || slug === "~") return;
      fetch(`/tina-content-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({
          query: `mutation UpdateBlogCategories($relativePath:String!,$params:BlogMutation!){ updateBlog(relativePath:$relativePath, params:$params){ categories } }`,
          variables: { relativePath: `${slug}.mdx`, params: { categories: values } },
        }),
      }).catch(() => {});
    } catch (_error) {}
  }

  return React.createElement(
    "div",
    {
      id: name,
      style: { display: "flex", flexDirection: "column", gap: "0.35rem" },
      "data-ffn-category-checkbox-group": "true",
      "data-ffn-selected-categories": selected.join(","),
    },
    CATEGORY_OPTIONS.map((option) => {
      const id = `field-${name}-option-${basename(option.value)}`;
      const checked = selectedSet.has(option.value);
      return React.createElement(
        "label",
        {
          key: option.value,
          htmlFor: id,
          style: { display: "flex", alignItems: "center", gap: "0.5rem", cursor: disabled ? "not-allowed" : "pointer", color: "#374151", fontSize: "14px" },
        },
        React.createElement("input", {
          id,
          name,
          type: "checkbox",
          value: option.value,
          checked,
          disabled,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => toggle(option.value, event.target.checked),
          style: { width: "16px", height: "16px" },
          "data-ffn-category-value": option.value,
        }),
        React.createElement("span", null, option.label),
      );
    }),
  );
}

export { CATEGORY_OPTIONS };
