/**
 * Island registry — single source of truth for every editable region the
 * bridge can refresh. Each entry maps a URL slug under `/tina-island/...`
 * to a fetcher + component + wrapper. Adding a new editable region = adding
 * one entry here; the dynamic `[name].ts` route picks it up automatically.
 */
import type { IslandRegistry } from '@tinacms/astro/experimental';
import type { QueryResult } from '@tinacms/astro/data';

import type { BlogQuery, CategoryQuery, ConfigQuery, PageQuery, UserQuery } from '../../tina/__generated__/types';
import type { CmsBlog, CmsCategory, CmsConfig, CmsPage, CmsUser } from './data';
import PageBody from '../components/islands/PageBody.astro';
import BlogBody from '../components/islands/BlogBody.astro';
import AuthorArchiveHeader from '../components/islands/AuthorArchiveHeader.astro';
import CategoryArchiveHeader from '../components/islands/CategoryArchiveHeader.astro';
import Header from '../templates/Header.astro';
import Footer from '../templates/Footer.astro';
import { getConfig, getEditableBlog, getEditableCategory, getEditablePage, getEditableUser } from './data';

export const islands: IslandRegistry = {
	page: {
		fetch: (_request, params) => getEditablePage(params.get('slug') ?? 'home'),
		component: PageBody,
		wrapper: { tag: 'main' },
		propsFromData: (data) => ({
			data: (data as QueryResult<PageQuery>).data?.page as CmsPage | undefined,
		}),
	},
	blog: {
		fetch: (_request, params) => getEditableBlog(params.get('slug') ?? ''),
		component: BlogBody,
		wrapper: { tag: 'article' },
		propsFromData: (data) => ({
			data: (data as QueryResult<BlogQuery>).data?.blog as CmsBlog | undefined,
		}),
	},
	author: {
		fetch: (_request, params) => getEditableUser(params.get('slug') ?? 'admin'),
		component: AuthorArchiveHeader,
		wrapper: { tag: 'div' },
		propsFromData: (data) => ({
			user: (data as QueryResult<UserQuery>).data?.user as CmsUser | undefined,
		}),
	},
	category: {
		fetch: (_request, params) => getEditableCategory(params.get('slug') ?? ''),
		component: CategoryArchiveHeader,
		wrapper: { tag: 'div' },
		propsFromData: (data) => ({
			category: (data as QueryResult<CategoryQuery>).data?.category as CmsCategory | undefined,
		}),
	},
	global: {
		fetch: () => getConfig(),
		component: Header,
		wrapper: { tag: 'div' },
		propsFromData: (data) => ({
			config: (data as QueryResult<ConfigQuery>).data?.config as CmsConfig | undefined,
		}),
	},
	'global-footer': {
		fetch: () => getConfig(),
		component: Footer,
		wrapper: { tag: 'div' },
		propsFromData: (data) => ({
			config: (data as QueryResult<ConfigQuery>).data?.config as CmsConfig | undefined,
		}),
	},
};
