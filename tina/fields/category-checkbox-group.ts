// @ts-nocheck
import React from "react";

const DEFAULT_CATEGORY_OPTIONS = [
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

function canonicalize(value: any, options: Array<{ label: string; value: string }>) {
  const keys = normalizeValue(value);
  return options
    .filter((option) => keys.has(option.value) || keys.has(basename(option.value)) || keys.has(option.label) || keys.has(basename(option.label)))
    .map((option) => option.value);
}

function categoryOptionsFromConnection(payload: any) {
  const edges = payload?.data?.categoryConnection?.edges;
  if (!Array.isArray(edges)) return [];
  return edges
    .map((edge: any) => edge?.node)
    .filter(Boolean)
    .map((node: any) => {
      const filename = node?._sys?.filename || basename(node?._sys?.path || node?._sys?.relativePath || node?.title);
      const value = node?._sys?.path || (filename ? `src/content/category/${filename}.json` : "");
      return value ? { label: String(node?.title || filename), value } : null;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.label.localeCompare(b.label));
}

function currentRelativePath() {
  const hash = String(window.location.hash || "");
  const slug = hash.split("/").filter(Boolean).pop();
  return !slug || slug === "~" ? null : `${slug}.mdx`;
}

async function proxyQuery(query: string, variables: Record<string, any> = {}) {
  const response = await fetch("/tina-content-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`Category proxy request failed (${response.status})`);
  return response.json();
}

export function CategoryCheckboxGroupField({ input, field, disabled = false }: any) {
  const initialOptions = Array.isArray(field?.options) && field.options.length ? field.options : DEFAULT_CATEGORY_OPTIONS;
  const [options, setOptions] = React.useState(initialOptions);
  const [hydratedSelected, setHydratedSelected] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    let active = true;
    const relativePath = currentRelativePath();
    Promise.all([
      proxyQuery(`query CategoryOptions { categoryConnection { edges { node { ... on Category { title _sys { path relativePath filename } } } } } }`),
      relativePath
        ? proxyQuery(`query BlogCategoryRead($relativePath:String!){ blog(relativePath:$relativePath){ categories } }`, { relativePath })
        : Promise.resolve(null),
    ])
      .then(([categoryPayload, blogPayload]) => {
        if (!active) return;
        const dynamicOptions = categoryOptionsFromConnection(categoryPayload);
        const nextOptions = dynamicOptions.length ? dynamicOptions : initialOptions;
        setOptions(nextOptions);
        const values = canonicalize(blogPayload?.data?.blog?.categories ?? input?.value, nextOptions);
        setHydratedSelected(values);
      })
      .catch(() => {
        if (active) setHydratedSelected(canonicalize(input?.value, initialOptions));
      });
    return () => { active = false; };
  }, [input?.name]);

  const selected = hydratedSelected ?? canonicalize(input?.value, options);
  const selectedSet = new Set(selected);
  const name = input?.name || field?.name || "categories";

  function toggle(value: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(value);
    else next.delete(value);
    const values = options.filter((option: any) => next.has(option.value)).map((option: any) => option.value);
    setHydratedSelected(values);
    // This is the Tina form contract: changing the checkbox must mark the form dirty so Save enables.
    input?.onChange?.(values);
    input?.onBlur?.();
  }

  return React.createElement(
    "div",
    {
      id: name,
      style: { display: "flex", flexDirection: "column", gap: "0.35rem" },
      "data-ffn-category-checkbox-group": "true",
      "data-ffn-selected-categories": selected.join(","),
    },
    options.map((option: any) => {
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

export const CATEGORY_OPTIONS = DEFAULT_CATEGORY_OPTIONS;
