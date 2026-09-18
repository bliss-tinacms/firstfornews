/**
 * Per-collection data loaders + the data shapes they return.
 *
 * Loaders call the generated Tina client and pipe the result through
 * `requestWithMetadata()` so the editor overlay flows in when the page
 * renders inside the admin iframe and `tinaField()` has its metadata.
 *
 * Types below are pure derivations — no hand-written shapes. Each one is
 * either inferred from a loader's return type (`CmsConfig`/`CmsPage`/
 * `CmsBlog`) or `Extract`/index-accessed off those. The Tina collection
 * is the source of truth; regen with `tinacms dev` and everything
 * downstream updates.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import type { TinaRichTextContent } from '@tinacms/astro';
import { requestWithMetadata } from '@tinacms/astro/data';
import client from '../../tina/__generated__/client';
import { BlogDocument, CategoryDocument, ConfigDocument, PageDocument, UserDocument } from '../../tina/__generated__/types';

function localContentRoots() {
	const roots = [
		process.cwd(),
		process.env.PASSENGER_APP_ROOT,
		process.env.APP_ROOT,
		fileURLToPath(new URL('../../..', import.meta.url)),
		fileURLToPath(new URL('../..', import.meta.url)),
	].filter(Boolean) as string[];
	return Array.from(new Set(roots));
}

function readFrontmatterValue(collection: 'blog' | 'page', slug?: string | null, key = 'permalink') {
	if (!slug) return null;
	for (const root of localContentRoots()) {
		try {
			const filePath = join(root, 'src', 'content', collection, slug + '.mdx');
			const text = readFileSync(filePath, 'utf8');
			const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
			if (!match) continue;
			const lines = match[1].split(/\r?\n/);
			for (const line of lines) {
				const found = line.match(new RegExp('^' + key + '\\s*:\\s*(.*)$'));
				if (found) {
					let value = found[1].trim();
					if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
						value = value.slice(1, -1);
					}
					return value || null;
				}
			}
		} catch (_error) {
			// Try the next possible app root.
		}
	}
	return null;
}

function readLocalFrontmatter(collection: 'blog' | 'page', slug?: string | null) {
	if (!slug) return null;
	const filename = slug.endsWith('.mdx') ? slug : slug + '.mdx';
	for (const root of localContentRoots()) {
		try {
			const filePath = join(root, 'src', 'content', collection, filename);
			const parsed = matter(readFileSync(filePath, 'utf8'));
			if (!parsed.data || !Object.keys(parsed.data).length) continue;
			return {
				...parsed.data,
				body: parsed.content || undefined,
				_sys: { filename: filename.replace(/\.mdx$/, '') },
			};
		} catch (_error) {
			// Try the next possible app root.
		}
	}
	return null;
}

function readLocalPageFrontmatter(slug?: string | null) {
	return readLocalFrontmatter('page', slug);
}

function readLocalBlogFrontmatter(slug?: string | null) {
	return readLocalFrontmatter('blog', slug);
}

function readLocalJson(collection: 'category' | 'user' | 'config' | 'navigation', slug?: string | null) {
	if (!slug) return null;
	const requested = slug.endsWith('.json') ? slug : slug + '.json';
	for (const root of localContentRoots()) {
		try {
			const dir = join(root, 'src', 'content', collection);
			let filename = requested;
			try {
				const requestedLower = requested.toLowerCase();
				const matched = readdirSync(dir).find((file) => file.toLowerCase() === requestedLower);
				if (matched) filename = matched;
			} catch (_error) {
				// Fall back to requested filename.
			}
			const filePath = join(dir, filename);
			const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
			return { ...parsed, _sys: { filename: filename.replace(/\.json$/, '') } };
		} catch (_error) {
			// Try the next possible app root.
		}
	}
	return null;
}

function listLocalFrontmatter(collection: 'blog' | 'page') {
	for (const root of localContentRoots()) {
		try {
			const dir = join(root, 'src', 'content', collection);
			return readdirSync(dir)
				.filter((file) => file.endsWith('.mdx'))
				.flatMap((file) => {
					const doc = readLocalFrontmatter(collection, file);
					return doc ? [hydratePermalink(collection, doc as any)] : [];
				});
		} catch (_error) {
			// Try next root.
		}
	}
	return null;
}

function hydratePermalink<T extends { _sys?: { filename?: string | null } | null; permalink?: string | null }>(collection: 'blog' | 'page', node: T): T {
	const permalink = node.permalink || readFrontmatterValue(collection, node._sys?.filename || null, 'permalink');
	return permalink ? ({ ...node, permalink } as T) : node;
}

function tinaProxyEndpoints() {
	// Do not SSR-fetch this same Passenger app's public /tina-content-proxy.
	// Self-fetching the live domain during page render can deadlock/timeout under cPanel Passenger.
	// Public pages should use generated/local source fallbacks; Tina preview/editor metadata uses
	// getEditable* loaders via requestWithMetadata.
	const endpoints = [
		process.env.TINA_UPSTREAM_CONTENT_API_URL,
		process.env.TINA_DIRECT_CONTENT_API_URL,
	].filter(Boolean) as string[];
	return Array.from(new Set(endpoints));
}

async function fetchGithubPageFrontmatter(relativePath: string) {
	const branch = process.env.TINA_BRANCH || process.env.NEXT_PUBLIC_TINA_BRANCH || 'main';
	const repo = process.env.GITHUB_CONTENT_REPO || 'bliss-tinacms/firstfornews';
	const url = `https://raw.githubusercontent.com/${repo}/${branch}/src/content/page/${relativePath}`;
	try {
		const response = await fetch(url, { cache: 'no-store', headers: { 'cache-control': 'no-cache' } });
		if (!response.ok) return null;
		const text = await response.text();
		const parsed = matter(text);
		if (!parsed.data || !Object.keys(parsed.data).length) return null;
		return {
			...parsed.data,
			_sys: { filename: relativePath.replace(/\.mdx$/, '') },
		};
	} catch (_error) {
		return null;
	}
}

async function fetchLiveTina<T>(query: string, variables?: Record<string, unknown>, pick?: (json: any) => T | null | undefined) {
	for (const endpoint of tinaProxyEndpoints()) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 2000);
		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ query, variables }),
				cache: 'no-store',
				signal: controller.signal,
			});
			if (!response.ok) continue;
			const json = await response.json();
			const data = pick ? pick(json) : json?.data;
			if (data) return data;
		} catch (_error) {
			// Fall back to generated Tina client/local source below.
		} finally {
			clearTimeout(timeout);
		}
	}
	return null;
}

async function fetchLiveTinaResult<TData>(query: string, variables?: Record<string, unknown>) {
	for (const endpoint of tinaProxyEndpoints()) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 2000);
		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ query, variables }),
				cache: 'no-store',
				signal: controller.signal,
			});
			if (!response.ok) continue;
			const json = await response.json();
			if (json?.data) return { data: json.data as TData, query, variables: variables ?? {} };
		} catch (_error) {
			// Fall back to generated Tina client/local source below.
		} finally {
			clearTimeout(timeout);
		}
	}
	return null;
}

function liveOrGenerated<TData>(query: string, variables: Record<string, unknown>, generated: () => Promise<any>) {
	return fetchLiveTinaResult<TData>(query, variables).then((live) => live ?? generated());
}

export async function getConfig() {
	const localConfig = readLocalJson('config', 'config.json');
	if (localConfig) return { data: { config: localConfig } } as any;

	const query = `query Config($relativePath: String!) {
		config(relativePath: $relativePath) {
			seo { title description siteOwner logo favicon footerLogo }
			contactForm { formspreeEndpoint heading description buttonText note subject }
			codeInjection { headerCode footerCode }
			contactLinks { title link icon }
			footerStarfield
		}
	}`;
	const liveConfig = await fetchLiveTina(query, { relativePath: 'config.json' }, (json) => json?.data?.config);
	if (liveConfig) return { data: { config: liveConfig } } as any;
	return requestWithMetadata(client.queries.config({ relativePath: 'config.json' }));
}


async function getLiveNavigation(relativePath: 'header.json' | 'footer.json') {
	try {
		const filePath = join(process.cwd(), 'src', 'content', 'navigation', relativePath);
		const navigation = JSON.parse(readFileSync(filePath, 'utf8'));
		if (navigation?.items) return { data: { navigation } } as any;
	} catch (_error) {
		// Fall through to Tina Cloud/generated client.
	}

	const query = `query Navigation($relativePath: String!) {
		navigation(relativePath: $relativePath) {
			title
			items { label href children { label href } }
		}
	}`;

	const liveNavigation = await fetchLiveTina(query, { relativePath }, (json) => json?.data?.navigation);
	if (liveNavigation) return { data: { navigation: liveNavigation } } as any;

	return requestWithMetadata(client.queries.navigation({ relativePath }));
}

export const getHeaderNavigation = () => getLiveNavigation('header.json');

export const getFooterNavigation = () => getLiveNavigation('footer.json');



export const getPage = (slug: string) =>
	requestWithMetadata(client.queries.page({ relativePath: `${slug}.mdx` }), { priority: 'primary' });

export const getEditablePage = (slug: string) => {
	const relativePath = slug.endsWith('.mdx') ? slug : `${slug}.mdx`;
	// Editor/sidebar data MUST come from the generated Tina client query so
	// requestWithMetadata can attach the form/schema metadata. Do not use
	// public/live/local fallbacks here; those are for public rendering only.
	const localPage = readLocalPageFrontmatter(relativePath);
	if (localPage) {
		return requestWithMetadata(Promise.resolve({
			data: { page: localPage as any },
			query: PageDocument,
			variables: { relativePath },
		}), { priority: 'primary' });
	}
	return requestWithMetadata(client.queries.page({ relativePath }), { priority: 'primary' });
};

async function getLivePage(slug: string) {
	const relativePath = slug.endsWith('.mdx') ? slug : slug + '.mdx';
	const query = `query Page($relativePath: String!) {
		page(relativePath: $relativePath) {
			title
			seo { metaTitle metaDescription ogTitle ogDescription ogImage canonicalUrl noindex nofollow }
			blocks {
				__typename
				... on PageBlocksContent { body }
				... on PageBlocksHomepageTemplate { hero { eyebrow title description buttonText buttonLink image imageAlt } why { eyebrow title paragraphOne paragraphTwo standards { label title text } } newsroom { heading subheading submitHeading submitButtonText submitButtonLink prompts { title text } } wireFeature { eyebrow quote author byline image imageAlt } coverage { title description topics { number title text } } contact { eyebrow title description note cards { title email text accent } } }
				... on PageBlocksAboutMockup17 { hero { eyebrow headline lede } purpose { eyebrow title paragraphOne pullquote paragraphTwo } coverage { eyebrow title intro items { number title text link } } standardsSection { eyebrow title intro items { number title text } } independence { eyebrow title image imageAlt paragraphOne paragraphTwo buttonText buttonLink } newsroom { eyebrow title intro contacts { icon title email text } } }
				... on PageBlocksOurTeamMockup17 { hero { eyebrow headline lede } leadership { eyebrow title people { name role location image imageAlt bio } } seniorStaff { eyebrow title people { name role location image imageAlt bio } } }
				... on PageBlocksContactMockup17 { hero { eyebrow headline lede } formSection { eyebrow title description buttonText note formAction subject } inboxes { eyebrow title cards { title description email note } } requests { eyebrow title intro cards { icon title text } } }
				... on PageBlocksHero { headline tagline starfield image { src alt } actions { label type icon link } }
				... on PageBlocksCallout { text url }
				... on PageBlocksCta { title description actions { label type icon link } }
				... on PageBlocksFeatures { title description items { title text icon } }
				... on PageBlocksSplit { title body reverse image { src alt } actions { label type icon link } }
				... on PageBlocksStats { title description stats { stat type } }
				... on PageBlocksTestimonial { title description testimonials { quote author role avatar } }
				... on PageBlocksVideo { url autoPlay loop }
			}
			_sys { filename }
		}
	}`;

	const livePage = await fetchLiveTina(query, { relativePath }, (json) => json?.data?.page);
	if (livePage) return { data: { page: livePage } } as any;

	const localPage = readLocalPageFrontmatter(relativePath);
	if (localPage) {
		return {
			data: {
				page: {
					...localPage,
					_sys: { filename: relativePath.replace(/\.mdx$/, '') },
				},
			},
		} as any;
	}

	const githubPage = await fetchGithubPageFrontmatter(relativePath);
	if (githubPage) return { data: { page: githubPage } } as any;

	return requestWithMetadata(client.queries.page({ relativePath }), { priority: 'primary' });
}

export const getPublicPage = (slug: string) => getLivePage(slug);

export const getEditableBlog = (slug: string) => {
	const relativePath = slug.endsWith('.mdx') ? slug : `${slug}.mdx`;
	const localBlog = readLocalBlogFrontmatter(relativePath);
	if (localBlog) {
		return requestWithMetadata(Promise.resolve({
			data: { blog: hydratePermalink('blog', localBlog as any) },
			query: BlogDocument,
			variables: { relativePath },
		}), { priority: 'primary' });
	}
	return requestWithMetadata(client.queries.blog({ relativePath }), { priority: 'primary' });
};

export async function getBlog(slug: string) {
	const relativePath = slug.endsWith('.mdx') ? slug : slug + '.mdx';
	const query = `query Blog($relativePath: String!) {
		blog(relativePath: $relativePath) {
			title
			description
			seo { metaTitle metaDescription ogTitle ogDescription ogImage canonicalUrl noindex nofollow }
			permalink
			pubDate
			updatedDate
			category { ... on Category { title description _sys { filename } } }
			author { ... on User { name role avatar bio email _sys { filename } } }
			heroImage
			authorAlt
			heroImageAlt
			body
			_sys { filename }
		}
	}`;
	const liveBlog = await fetchLiveTina(query, { relativePath }, (json) => json?.data?.blog);
	if (liveBlog) return { data: { blog: liveBlog } } as any;
	const localBlog = readLocalBlogFrontmatter(relativePath);
	if (localBlog) return { data: { blog: hydratePermalink('blog', localBlog as any) } } as any;
	return requestWithMetadata(client.queries.blog({ relativePath }), { priority: 'primary' });
}


async function getLiveUser(slug: string) {
	const relativePath = slug.endsWith('.json') ? slug : slug + '.json';
	const query = `query User($relativePath: String!) {
		user(relativePath: $relativePath) {
			name
			role
			avatar
			bio
			email
			seo { metaTitle metaDescription ogTitle ogDescription ogImage canonicalUrl noindex nofollow }
			_sys { filename }
		}
	}`;

	const liveUser = await fetchLiveTina(query, { relativePath }, (json) => json?.data?.user);
	if (liveUser) return { data: { user: liveUser } } as any;
	const localUser = readLocalJson('user', relativePath);
	if (localUser) return { data: { user: localUser } } as any;

	return requestWithMetadata(client.queries.user({ relativePath }));
}

export const getEditableUser = (slug: string) => {
	const relativePath = slug.endsWith('.json') ? slug : `${slug}.json`;
	const localUser = readLocalJson('user', relativePath);
	if (localUser) {
		return requestWithMetadata(Promise.resolve({
			data: { user: localUser as any },
			query: UserDocument,
			variables: { relativePath },
		}), { priority: 'primary' });
	}
	return requestWithMetadata(client.queries.user({ relativePath }), { priority: 'primary' });
};

export const getUser = (slug: string) => getLiveUser(slug);

export const getEditableCategory = (slug: string) => {
	const relativePath = slug.endsWith('.json') ? slug : `${slug}.json`;
	const localCategory = readLocalJson('category', relativePath);
	if (localCategory) {
		return requestWithMetadata(Promise.resolve({
			data: { category: localCategory as any },
			query: CategoryDocument,
			variables: { relativePath },
		}), { priority: 'primary' });
	}
	return requestWithMetadata(client.queries.category({ relativePath }), { priority: 'primary' });
};

export async function getCategory(slug: string) {
	const relativePath = slug.endsWith('.json') ? slug : `${slug}.json`;
	const query = `query Category($relativePath: String!) {
		category(relativePath: $relativePath) {
			title
			description
			seo { metaTitle metaDescription ogTitle ogDescription ogImage canonicalUrl noindex nofollow }
			_sys { filename }
		}
	}`;
	const liveCategory = await fetchLiveTina(query, { relativePath }, (json) => json?.data?.category);
	if (liveCategory) return { data: { category: liveCategory } } as any;
	const localCategory = readLocalJson('category', relativePath);
	if (localCategory) return { data: { category: localCategory } } as any;
	return requestWithMetadata(client.queries.category({ relativePath }));
}

export async function listPages() {
	const query = `query PageConnection {
		pageConnection {
			edges {
				node {
					title
					permalink
					seo { metaTitle metaDescription ogTitle ogDescription ogImage canonicalUrl noindex nofollow }
					_sys { filename }
				}
			}
		}
	}`;
	const livePages = await fetchLiveTina(query, undefined, (json) => json?.data?.pageConnection?.edges);
	if (Array.isArray(livePages)) {
		return livePages
			.flatMap((edge) => (edge?.node ? [edge.node] : []))
			.map((node) => hydratePermalink('page', node));
	}
	const localPages = listLocalFrontmatter('page');
	if (localPages) return localPages as any;
	const result = await client.queries.pageConnection();
	return (result.data.pageConnection.edges ?? [])
		.flatMap((edge) => (edge?.node ? [edge.node] : []))
		.map((node) => hydratePermalink('page', node));
}

export async function listBlogs() {
	const query = `query BlogConnection {
		blogConnection {
			edges {
				node {
					title
					description
					permalink
					pubDate
					updatedDate
					heroImage
					heroImageAlt
					seo { metaTitle metaDescription ogTitle ogDescription ogImage canonicalUrl noindex nofollow }
					category { ... on Category { title description _sys { filename } } }
					author { ... on User { name role avatar bio email _sys { filename } } }
					_sys { filename }
				}
			}
		}
	}`;
	const liveBlogs = await fetchLiveTina(query, undefined, (json) => json?.data?.blogConnection?.edges);
	const nodes = Array.isArray(liveBlogs)
		? liveBlogs.flatMap((edge) => (edge?.node ? [edge.node] : []))
		: null;
	if (nodes) {
		return nodes
			.map((node) => hydratePermalink('blog', node))
			.sort((a, b) => {
				const ad = a.pubDate ? new Date(a.pubDate).valueOf() : 0;
				const bd = b.pubDate ? new Date(b.pubDate).valueOf() : 0;
				return bd - ad;
			});
	}
	const localBlogs = listLocalFrontmatter('blog');
	if (localBlogs) {
		return (localBlogs as any[]).sort((a, b) => {
			const ad = a.pubDate ? new Date(a.pubDate).valueOf() : 0;
			const bd = b.pubDate ? new Date(b.pubDate).valueOf() : 0;
			return bd - ad;
		});
	}
	const result = await client.queries.blogConnection();
	return (result.data.blogConnection.edges ?? [])
		.flatMap((edge) => (edge?.node ? [edge.node] : []))
		.map((node) => hydratePermalink('blog', node))
		.sort((a, b) => {
			const ad = a.pubDate ? new Date(a.pubDate).valueOf() : 0;
			const bd = b.pubDate ? new Date(b.pubDate).valueOf() : 0;
			return bd - ad;
		});
}

export type CmsConfig = Awaited<ReturnType<typeof getConfig>>['data']['config'];
export type CmsPage = Awaited<ReturnType<typeof getPage>>['data']['page'];
export type CmsBlog = Awaited<ReturnType<typeof getBlog>>['data']['blog'];
export type CmsUser = Awaited<ReturnType<typeof getUser>>['data']['user'];
export type CmsCategory = Awaited<ReturnType<typeof getCategory>>['data']['category'];

export type PageBlock = NonNullable<NonNullable<CmsPage['blocks']>[number]>;
export type PageBlockTypename = PageBlock['__typename'];

export type HeroBlock = Extract<PageBlock, { __typename: 'PageBlocksHero' }>;
export type CalloutBlock = Extract<PageBlock, { __typename: 'PageBlocksCallout' }>;
export type FeaturesBlock = Extract<PageBlock, { __typename: 'PageBlocksFeatures' }>;
export type StatsBlock = Extract<PageBlock, { __typename: 'PageBlocksStats' }>;
export type CtaBlock = Extract<PageBlock, { __typename: 'PageBlocksCta' }>;
export type ContentBlock = Extract<PageBlock, { __typename: 'PageBlocksContent' }>;
export type TestimonialBlock = Extract<PageBlock, { __typename: 'PageBlocksTestimonial' }>;
export type VideoBlock = Extract<PageBlock, { __typename: 'PageBlocksVideo' }>;
export type SplitBlock = Extract<PageBlock, { __typename: 'PageBlocksSplit' }>;

export type CmsConfigNav = any;
export type CmsConfigFooterNav = any;
export type CmsConfigContactLink = NonNullable<NonNullable<CmsConfig['contactLinks']>[number]>;
export type CmsConfigSeo = NonNullable<CmsConfig['seo']>;

export type Action = NonNullable<NonNullable<HeroBlock['actions']>[number]>;
export type ImageField = NonNullable<HeroBlock['image']>;
export type FeatureItem = NonNullable<NonNullable<FeaturesBlock['items']>[number]>;
export type StatItem = NonNullable<NonNullable<StatsBlock['stats']>[number]>;
export type TestimonialItem = NonNullable<NonNullable<TestimonialBlock['testimonials']>[number]>;

/** Tina rich-text bodies are typed as `any` in the generated client; this is what `<TinaMarkdown>` expects. */
export type RichText = TinaRichTextContent;
