import React from 'react';
import type { TinaField } from 'tinacms';

type ViewKind = 'blog' | 'page';

function normalizeSlug(value?: string | null) {
  return String(value || '')
    .toLowerCase()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.(mdx?|json)$/i, '')
    .split('/')
    .map((part) => part.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
    .join('/');
}

function filenameFromBrowser(kind: ViewKind) {
  if (typeof window === 'undefined') return '';
  const text = decodeURIComponent(window.location.href || '').replace(/\\/g, '/');
  const pattern = kind === 'blog'
    ? /src\/content\/blog\/([^?#]+?)\.(mdx?|json)/i
    : /src\/content\/page\/([^?#]+?)\.(mdx?|json)/i;
  const match = text.match(pattern);
  return match?.[1] || '';
}

function resolveFrontendUrl(kind: ViewKind, values: Record<string, any>) {
  const raw =
    values?.permalink ||
    values?._sys?.filename ||
    values?.filename ||
    filenameFromBrowser(kind) ||
    values?.title ||
    values?.seoTitle ||
    '';

  const slug = normalizeSlug(raw);
  if (kind === 'blog') return slug ? '/' + (slug.startsWith('blog/') ? slug.slice(5) : slug) + '/' : '/blog/';
  if (!slug || slug === 'home' || slug === 'index') return '/';
  return '/' + slug + '/';
}

function ViewFrontendComponent(kind: ViewKind) {
  return function ViewFrontendField(props: any) {
    const values = props?.form?.getState?.()?.values || {};
    const href = resolveFrontendUrl(kind, values);
    const label = kind === 'blog' ? 'View Post' : 'View Page';

    return React.createElement(
      'div',
      {
        style: {
          border: '1px solid #bfdbfe',
          background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)',
          borderRadius: '12px',
          padding: '14px',
          margin: '0 0 18px',
          boxShadow: '0 6px 14px rgba(37, 99, 235, 0.06)',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '.12em',
            fontWeight: 800,
            color: '#1d4ed8',
            marginBottom: '8px',
          },
        },
        'Frontend Shortcut'
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', gap: '10px', alignItems: 'center' } },
        React.createElement(
          'code',
          {
            style: {
              flex: 1,
              minWidth: 0,
              background: '#fff',
              border: '1px solid #dbe3ef',
              borderRadius: '8px',
              padding: '10px 11px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '12px',
              color: '#334155',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
            title: href,
          },
          href
        ),
        React.createElement(
          'a',
          {
            href,
            target: '_blank',
            rel: 'noopener noreferrer',
            style: {
              border: 'none',
              background: '#14577a',
              color: '#fff',
              borderRadius: '8px',
              padding: '11px 14px',
              fontWeight: 800,
              fontSize: '13px',
              lineHeight: 1,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
            },
          },
          'View'
        )
      ),
      React.createElement(
        'p',
        { style: { margin: '10px 0 0', color: '#64748b', fontSize: '12px', lineHeight: 1.45 } },
        label + ' opens in a new tab. Save first if you changed the permalink.'
      )
    );
  };
}

export function viewFrontendField(kind: ViewKind): TinaField {
  return {
    type: 'string',
    name: kind === 'blog' ? 'viewPostShortcut' : 'viewPageShortcut',
    label: kind === 'blog' ? 'View Post' : 'View Page',
    ui: {
      component: ViewFrontendComponent(kind),
    },
  } as TinaField;
}
