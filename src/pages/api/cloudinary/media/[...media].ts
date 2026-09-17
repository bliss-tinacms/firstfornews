import type { APIContext } from "astro";
import { v2 as cloudinary } from "cloudinary";
import { isAuthorized } from "@tinacms/auth";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function getCredentials() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Missing Cloudinary environment variables");
  }

  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
}

async function authorized(request: Request, url: URL) {
  if (process.env.NODE_ENV === "development") return true;

  const reqForTina = {
    query: Object.fromEntries(url.searchParams.entries()),
    headers: {
      authorization: request.headers.get("authorization") || undefined,
    },
  };

  const user = await isAuthorized(reqForTina as any);
  return Boolean(user && (user as any).verified);
}

function cleanPath(value: string | null | undefined) {
  return (value || "").replace(/^\/+|\/+$/g, "");
}

function directoryPrefix(directory: string | null) {
  const clean = cleanPath(directory);
  return clean ? clean + "/" : "";
}

function rootPrefix() {
  const clean = cleanPath(process.env.CLOUDINARY_ROOT_FOLDER || process.env.CLOUDINARY_FOLDER || "firstfornews");
  return clean ? clean + "/" : "";
}

function withRootPrefix(path: string) {
  const root = rootPrefix();
  const clean = cleanPath(path);
  if (!root) return clean;
  if (!clean) return root.replace(/\/$/, "");
  return clean.startsWith(root) ? clean : root + clean;
}

function stripRootPrefix(publicId: string) {
  const root = rootPrefix();
  return root && publicId.startsWith(root) ? publicId.slice(root.length) : publicId;
}

function itemFromCloudinary(asset: any) {
  const publicId = asset.public_id || "";
  const displayId = stripRootPrefix(publicId);
  const parts = displayId.split("/");
  const filename = parts.pop() || displayId || publicId;
  const directory = parts.length ? "/" + parts.join("/") : "/";
  const src = asset.secure_url || asset.url;

  return {
    type: "file",
    id: displayId,
    filename,
    directory,
    src,
    thumbnails: {
      "75x75": src,
      "400x400": src,
      "1000x1000": src,
    },
  };
}

export async function GET({ request }: APIContext) {
  try {
    const url = new URL(request.url);
    if (!(await authorized(request, url))) return json({ message: "Unauthorized" }, 401);
    getCredentials();

    const directory = url.searchParams.get("directory") || "";
    const offset = url.searchParams.get("offset") || undefined;
    const prefix = withRootPrefix(directory);

    let search = cloudinary.search
      .expression(prefix ? `resource_type:image AND public_id:${prefix}*` : "resource_type:image")
      .sort_by("created_at", "desc")
      .max_results(50);

    if (offset) search = search.next_cursor(offset);
    const result = await search.execute();

    return json({
      items: (result.resources || []).map(itemFromCloudinary),
      offset: result.next_cursor || null,
    });
  } catch (e: any) {
    console.error("Cloudinary media GET failed", e);
    return json({ message: "Cloudinary media GET failed", e: e?.message || String(e) }, 500);
  }
}

export async function POST({ request }: APIContext) {
  try {
    const url = new URL(request.url);
    if (!(await authorized(request, url))) return json({ message: "Unauthorized" }, 401);
    getCredentials();

    const form = await request.formData();
    const file = form.get("file");
    const directory = directoryPrefix(String(form.get("directory") || ""));
    const filename = String(form.get("filename") || (file as File)?.name || "upload");

    if (!(file instanceof File)) return json({ message: "Missing upload file" }, 400);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dataUri = `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
    const publicId = withRootPrefix(directory + filename.replace(/\.[^.]+$/, ""));

    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      overwrite: true,
      resource_type: "image",
    });

    return json(result);
  } catch (e: any) {
    console.error("Cloudinary media POST failed", e);
    return json({ message: "Cloudinary media POST failed", e: e?.message || String(e) }, 500);
  }
}

export async function DELETE({ request, params }: APIContext) {
  try {
    const url = new URL(request.url);
    if (!(await authorized(request, url))) return json({ message: "Unauthorized" }, 401);
    getCredentials();

    const mediaParam = Array.isArray((params as any).media) ? (params as any).media.join("/") : String((params as any).media || "");
    const publicId = withRootPrefix(decodeURIComponent(mediaParam));
    if (!publicId) return json({ message: "Missing media id" }, 400);

    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return json(result);
  } catch (e: any) {
    console.error("Cloudinary media DELETE failed", e);
    return json({ message: "Cloudinary media DELETE failed", e: e?.message || String(e) }, 500);
  }
}
