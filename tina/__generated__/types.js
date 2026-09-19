export function gql(strings, ...args) {
  let str = "";
  strings.forEach((string, i) => {
    str += string + (args[i] || "");
  });
  return str;
}
export const BlogPartsFragmentDoc = gql`
    fragment BlogParts on Blog {
  __typename
  viewPostShortcut
  title
  permalink
  description
  seo {
    __typename
    metaTitle
    metaDescription
    ogTitle
    ogDescription
    ogImage
    canonicalUrl
    noindex
    nofollow
  }
  pubDate
  updatedDate
  category {
    ... on Category {
      __typename
      title
      description
      seo {
        __typename
        metaTitle
        metaDescription
        ogTitle
        ogDescription
        ogImage
        canonicalUrl
        noindex
        nofollow
      }
    }
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
  }
  author {
    ... on User {
      __typename
      name
      role
      avatar
      bio
      email
      seo {
        __typename
        metaTitle
        metaDescription
        ogTitle
        ogDescription
        ogImage
        canonicalUrl
        noindex
        nofollow
      }
    }
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
  }
  heroImage
  authorAlt
  heroImageAlt
  body
}
    `;
export const CategoryPartsFragmentDoc = gql`
    fragment CategoryParts on Category {
  __typename
  title
  description
  seo {
    __typename
    metaTitle
    metaDescription
    ogTitle
    ogDescription
    ogImage
    canonicalUrl
    noindex
    nofollow
  }
}
    `;
export const PagePartsFragmentDoc = gql`
    fragment PageParts on Page {
  __typename
  viewPageShortcut
  title
  permalink
  seo {
    __typename
    metaTitle
    metaDescription
    ogTitle
    ogDescription
    ogImage
    canonicalUrl
    noindex
    nofollow
  }
  blocks {
    __typename
    ... on PageBlocksHomepageTemplate {
      hero {
        __typename
        eyebrow
        title
        description
        buttonText
        buttonLink
        image
        imageAlt
      }
      why {
        __typename
        eyebrow
        title
        paragraphOne
        paragraphTwo
        standards {
          __typename
          label
          title
          text
        }
      }
      newsroom {
        __typename
        heading
        subheading
        submitHeading
        submitButtonText
        submitButtonLink
        prompts {
          __typename
          title
          text
        }
      }
      wireFeature {
        __typename
        eyebrow
        quote
        author
        byline
        image
        imageAlt
      }
      coverage {
        __typename
        title
        description
        topics {
          __typename
          number
          title
          text
        }
      }
      contact {
        __typename
        eyebrow
        title
        description
        note
        cards {
          __typename
          title
          email
          text
          accent
        }
      }
    }
    ... on PageBlocksAboutMockup17 {
      hero {
        __typename
        eyebrow
        headline
        lede
      }
      purpose {
        __typename
        eyebrow
        title
        paragraphOne
        pullquote
        paragraphTwo
      }
      coverage {
        __typename
        eyebrow
        title
        intro
        items {
          __typename
          number
          title
          text
          link
        }
      }
      standardsSection {
        __typename
        eyebrow
        title
        intro
        items {
          __typename
          number
          title
          text
        }
      }
      independence {
        __typename
        eyebrow
        title
        image
        imageAlt
        paragraphOne
        paragraphTwo
        buttonText
        buttonLink
      }
      newsroom {
        __typename
        eyebrow
        title
        intro
        contacts {
          __typename
          icon
          title
          email
          text
        }
      }
    }
    ... on PageBlocksOurTeamMockup17 {
      hero {
        __typename
        eyebrow
        headline
        lede
      }
      leadership {
        __typename
        eyebrow
        title
        people {
          __typename
          name
          role
          location
          image
          imageAlt
          bio
          experience
          focus
        }
      }
      seniorStaff {
        __typename
        eyebrow
        title
        people {
          __typename
          name
          role
          location
          image
          imageAlt
          bio
          experience
          focus
        }
      }
    }
    ... on PageBlocksContactMockup17 {
      hero {
        __typename
        eyebrow
        headline
        lede
      }
      formSection {
        __typename
        eyebrow
        title
        description
        buttonText
        note
        formAction
        subject
      }
      inboxes {
        __typename
        eyebrow
        title
        cards {
          __typename
          title
          description
          email
          note
        }
      }
      requests {
        __typename
        eyebrow
        title
        intro
        cards {
          __typename
          icon
          title
          text
        }
      }
    }
    ... on PageBlocksHero {
      headline
      tagline
      actions {
        __typename
        label
        type
        icon
        link
      }
      image {
        __typename
        src
        alt
      }
      starfield
    }
    ... on PageBlocksCallout {
      text
      url
    }
    ... on PageBlocksFeatures {
      title
      description
      items {
        __typename
        icon
        title
        text
      }
    }
    ... on PageBlocksStats {
      title
      description
      stats {
        __typename
        stat
        type
      }
    }
    ... on PageBlocksCta {
      title
      description
      actions {
        __typename
        label
        type
        icon
        link
      }
    }
    ... on PageBlocksContent {
      body
    }
    ... on PageBlocksTestimonial {
      title
      description
      testimonials {
        __typename
        quote
        author
        role
        avatar
      }
    }
    ... on PageBlocksVideo {
      url
      autoPlay
      loop
    }
    ... on PageBlocksSplit {
      title
      body
      image {
        __typename
        src
        alt
      }
      reverse
      actions {
        __typename
        label
        type
        icon
        link
      }
    }
  }
}
    `;
export const UserPartsFragmentDoc = gql`
    fragment UserParts on User {
  __typename
  name
  role
  avatar
  bio
  email
  seo {
    __typename
    metaTitle
    metaDescription
    ogTitle
    ogDescription
    ogImage
    canonicalUrl
    noindex
    nofollow
  }
}
    `;
export const NavigationPartsFragmentDoc = gql`
    fragment NavigationParts on Navigation {
  __typename
  title
  items {
    __typename
    label
    href
    children {
      __typename
      label
      href
    }
  }
}
    `;
export const ConfigPartsFragmentDoc = gql`
    fragment ConfigParts on Config {
  __typename
  favicon
  seo {
    __typename
    title
    description
    siteOwner
    logo
    defaultSocialImage
    favicon
    footerLogo
  }
  contactForm {
    __typename
    formspreeEndpoint
    heading
    description
    buttonText
    note
    subject
  }
  codeInjection {
    __typename
    headerCode
    footerCode
  }
  contactLinks {
    __typename
    title
    link
    icon
  }
  footerStarfield
}
    `;
export const BlogDocument = gql`
    query blog($relativePath: String!) {
  blog(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...BlogParts
  }
}
    ${BlogPartsFragmentDoc}`;
export const BlogConnectionDocument = gql`
    query blogConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: BlogFilter) {
  blogConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...BlogParts
      }
    }
  }
}
    ${BlogPartsFragmentDoc}`;
export const CategoryDocument = gql`
    query category($relativePath: String!) {
  category(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...CategoryParts
  }
}
    ${CategoryPartsFragmentDoc}`;
export const CategoryConnectionDocument = gql`
    query categoryConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: CategoryFilter) {
  categoryConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...CategoryParts
      }
    }
  }
}
    ${CategoryPartsFragmentDoc}`;
export const PageDocument = gql`
    query page($relativePath: String!) {
  page(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...PageParts
  }
}
    ${PagePartsFragmentDoc}`;
export const PageConnectionDocument = gql`
    query pageConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: PageFilter) {
  pageConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...PageParts
      }
    }
  }
}
    ${PagePartsFragmentDoc}`;
export const UserDocument = gql`
    query user($relativePath: String!) {
  user(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...UserParts
  }
}
    ${UserPartsFragmentDoc}`;
export const UserConnectionDocument = gql`
    query userConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: UserFilter) {
  userConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...UserParts
      }
    }
  }
}
    ${UserPartsFragmentDoc}`;
export const NavigationDocument = gql`
    query navigation($relativePath: String!) {
  navigation(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...NavigationParts
  }
}
    ${NavigationPartsFragmentDoc}`;
export const NavigationConnectionDocument = gql`
    query navigationConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: NavigationFilter) {
  navigationConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...NavigationParts
      }
    }
  }
}
    ${NavigationPartsFragmentDoc}`;
export const ConfigDocument = gql`
    query config($relativePath: String!) {
  config(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...ConfigParts
  }
}
    ${ConfigPartsFragmentDoc}`;
export const ConfigConnectionDocument = gql`
    query configConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: ConfigFilter) {
  configConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...ConfigParts
      }
    }
  }
}
    ${ConfigPartsFragmentDoc}`;
export function getSdk(requester) {
  return {
    blog(variables, options) {
      return requester(BlogDocument, variables, options);
    },
    blogConnection(variables, options) {
      return requester(BlogConnectionDocument, variables, options);
    },
    category(variables, options) {
      return requester(CategoryDocument, variables, options);
    },
    categoryConnection(variables, options) {
      return requester(CategoryConnectionDocument, variables, options);
    },
    page(variables, options) {
      return requester(PageDocument, variables, options);
    },
    pageConnection(variables, options) {
      return requester(PageConnectionDocument, variables, options);
    },
    user(variables, options) {
      return requester(UserDocument, variables, options);
    },
    userConnection(variables, options) {
      return requester(UserConnectionDocument, variables, options);
    },
    navigation(variables, options) {
      return requester(NavigationDocument, variables, options);
    },
    navigationConnection(variables, options) {
      return requester(NavigationConnectionDocument, variables, options);
    },
    config(variables, options) {
      return requester(ConfigDocument, variables, options);
    },
    configConnection(variables, options) {
      return requester(ConfigConnectionDocument, variables, options);
    }
  };
}
import { createClient } from "tinacms/dist/client";
const generateRequester = (client) => {
  const requester = async (doc, vars, options) => {
    let url = client.apiUrl;
    if (options?.branch) {
      const index = client.apiUrl.lastIndexOf("/");
      url = client.apiUrl.substring(0, index + 1) + options.branch;
    }
    const data = await client.request({
      query: doc,
      variables: vars,
      url
    }, options);
    return { data: data?.data, errors: data?.errors, query: doc, variables: vars || {} };
  };
  return requester;
};
export const ExperimentalGetTinaClient = () => getSdk(
  generateRequester(
    createClient({
      url: "https://firstfornews.net/tina-content-proxy",
      queries
    })
  )
);
export const queries = (client) => {
  const requester = generateRequester(client);
  return getSdk(requester);
};
