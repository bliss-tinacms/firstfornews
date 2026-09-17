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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { TinaRichTextContent } from '@tinacms/astro';
import { requestWithMetadata } from '@tinacms/astro/data';
import client from '../../tina/__generated__/client';

function readFrontmatterValue(collection: 'blog' | 'page', slug?: string | null, key = 'permalink') {
	if (!slug) return null;
	try {
		const filePath = join(process.cwd(), 'src', 'content', collection, slug + '.mdx');
		const text = readFileSync(filePath, 'utf8');
		const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
		if (!match) return null;
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
		return null;
	}
	return null;
}

function hydratePermalink<T extends { _sys?: { filename?: string | null } | null; permalink?: string | null }>(collection: 'blog' | 'page', node: T): T {
	const permalink = node.permalink || readFrontmatterValue(collection, node._sys?.filename || null, 'permalink');
	return permalink ? ({ ...node, permalink } as T) : node;
}
export const getConfig = () =>
	requestWithMetadata(client.queries.config({ relativePath: 'config.json' }));


async function getLiveNavigation(relativePath: 'header.json' | 'footer.json') {
	const query = `query Navigation($relativePath: String!) {
		navigation(relativePath: $relativePath) {
			title
			items { label href children { label href } }
		}
	}`;

	const endpoints = [
		process.env.NEXT_PUBLIC_TINA_CONTENT_API_URL,
		process.env.TINA_PUBLIC_TINA_CONTENT_API_URL,
		process.env.PUBLIC_TINA_CONTENT_API_URL,
		'https://firstfornews.net/tina-content-proxy',
	].filter(Boolean) as string[];

	for (const endpoint of endpoints) {
		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ query, variables: { relativePath } }),
				cache: 'no-store',
			});
			if (!response.ok) continue;
			const json = await response.json();
			if (json?.data?.navigation) return { data: { navigation: json.data.navigation } } as any;
		} catch (_error) {
			// fall back below
		}
	}

	return requestWithMetadata(client.queries.navigation({ relativePath }));
}

export const getHeaderNavigation = () => getLiveNavigation('header.json');

export const getFooterNavigation = () => getLiveNavigation('footer.json');



export const getPage = (slug: string) =>
	requestWithMetadata(client.queries.page({ relativePath: `${slug}.mdx` }), { priority: 'primary' });

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

	const endpoints = [
		process.env.NEXT_PUBLIC_TINA_CONTENT_API_URL,
		process.env.TINA_PUBLIC_TINA_CONTENT_API_URL,
		process.env.PUBLIC_TINA_CONTENT_API_URL,
		'https://firstfornews.net/tina-content-proxy',
	].filter(Boolean) as string[];

	for (const endpoint of endpoints) {
		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ query, variables: { relativePath } }),
				cache: 'no-store',
			});
			if (!response.ok) continue;
			const json = await response.json();
			if (json?.data?.page) return { data: { page: json.data.page } } as any;
		} catch (_error) {
			// Fall back below.
		}
	}

	return requestWithMetadata(client.queries.page({ relativePath }), { priority: 'primary' });
}

export const getPublicPage = (slug: string) => getLivePage(slug);

export const getBlog = (slug: string) =>
	requestWithMetadata(client.queries.blog({ relativePath: `${slug}.mdx` }), { priority: 'primary' });




async function getLiveUser(slug: string) {
	const relativePath = slug.endsWith('.json') ? slug : slug + '.json';
	const query = `query User($relativePath: String!) {
		user(relativePath: $relativePath) {
			name
			role
			avatar
			bio
			email
			_sys { filename }
		}
	}`;

	const endpoints = [
		process.env.NEXT_PUBLIC_TINA_CONTENT_API_URL,
		process.env.TINA_PUBLIC_TINA_CONTENT_API_URL,
		process.env.PUBLIC_TINA_CONTENT_API_URL,
		'https://firstfornews.net/tina-content-proxy',
	].filter(Boolean) as string[];

	for (const endpoint of endpoints) {
		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ query, variables: { relativePath } }),
				cache: 'no-store',
			});
			if (!response.ok) continue;
			const json = await response.json();
			if (json?.data?.user) return { data: { user: json.data.user } } as any;
		} catch (_error) {
			// Fall back below.
		}
	}

	return requestWithMetadata(client.queries.user({ relativePath }));
}

export const getUser = (slug: string) => getLiveUser(slug);

export async function listPages() {
	const result = await client.queries.pageConnection();
	return (result.data.pageConnection.edges ?? [])
		.flatMap((edge) => (edge?.node ? [edge.node] : []))
		.map((node) => hydratePermalink('page', node));
}

export async function listBlogs() {
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

export type CmsConfigNav = NonNullable<NonNullable<CmsConfig['nav']>[number]>;
export type CmsConfigFooterNav = NonNullable<NonNullable<CmsConfig['footerNav']>[number]>;
export type CmsConfigContactLink = NonNullable<NonNullable<CmsConfig['contactLinks']>[number]>;
export type CmsConfigSeo = NonNullable<CmsConfig['seo']>;

export type Action = NonNullable<NonNullable<HeroBlock['actions']>[number]>;
export type ImageField = NonNullable<HeroBlock['image']>;
export type FeatureItem = NonNullable<NonNullable<FeaturesBlock['items']>[number]>;
export type StatItem = NonNullable<NonNullable<StatsBlock['stats']>[number]>;
export type TestimonialItem = NonNullable<NonNullable<TestimonialBlock['testimonials']>[number]>;

/** Tina rich-text bodies are typed as `any` in the generated client; this is what `<TinaMarkdown>` expects. */
export type RichText = TinaRichTextContent;
