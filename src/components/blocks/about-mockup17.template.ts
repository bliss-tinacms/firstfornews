export const aboutMockup17BlockSchema = {
  name: 'aboutMockup17',
  label: 'About Page Template Sections',
  fields: [
    {
      type: 'object',
      name: 'hero',
      label: 'Hero Section',
      fields: [
        { name: 'eyebrow', label: 'Eyebrow', type: 'string' },
        { name: 'headline', label: 'Headline', type: 'string' },
        { name: 'lede', label: 'Lede', type: 'string', ui: { component: 'textarea' } },
      ],
    },
    {
      type: 'object',
      name: 'purpose',
      label: 'Our Purpose Section',
      fields: [
        { name: 'eyebrow', label: 'Eyebrow', type: 'string' },
        { name: 'title', label: 'Title', type: 'string' },
        { name: 'paragraphOne', label: 'Paragraph 1', type: 'string', ui: { component: 'textarea' } },
        { name: 'pullquote', label: 'Pullquote', type: 'string', ui: { component: 'textarea' } },
        { name: 'paragraphTwo', label: 'Paragraph 2', type: 'string', ui: { component: 'textarea' } },
      ],
    },
    {
      type: 'object',
      name: 'coverage',
      label: 'Coverage Section',
      fields: [
        { name: 'eyebrow', label: 'Eyebrow', type: 'string' },
        { name: 'title', label: 'Title', type: 'string' },
        { name: 'intro', label: 'Intro', type: 'string', ui: { component: 'textarea' } },
        {
          name: 'items',
          label: 'Coverage Cards',
          type: 'object',
          list: true,
          fields: [
            { name: 'number', label: 'Number', type: 'string' },
            { name: 'title', label: 'Title', type: 'string' },
            { name: 'text', label: 'Text', type: 'string', ui: { component: 'textarea' } },
            { name: 'link', label: 'Link', type: 'string' },
          ],
        },
      ],
    },
    {
      type: 'object',
      name: 'standardsSection',
      label: 'What We Stand For Section',
      fields: [
        { name: 'eyebrow', label: 'Eyebrow', type: 'string' },
        { name: 'title', label: 'Title', type: 'string' },
        { name: 'intro', label: 'Intro', type: 'string', ui: { component: 'textarea' } },
        {
          name: 'items',
          label: 'Standards Rows',
          type: 'object',
          list: true,
          fields: [
            { name: 'number', label: 'Number', type: 'string' },
            { name: 'title', label: 'Title', type: 'string' },
            { name: 'text', label: 'Text', type: 'string', ui: { component: 'textarea' } },
          ],
        },
      ],
    },
    {
      type: 'object',
      name: 'independence',
      label: 'Independence Section',
      fields: [
        { name: 'eyebrow', label: 'Eyebrow', type: 'string' },
        { name: 'title', label: 'Title', type: 'string' },
        { name: 'image', label: 'Image', type: 'image' },
        { name: 'imageAlt', label: 'Image Alt Text', type: 'string' },
        { name: 'paragraphOne', label: 'Paragraph 1', type: 'string', ui: { component: 'textarea' } },
        { name: 'paragraphTwo', label: 'Paragraph 2', type: 'string', ui: { component: 'textarea' } },
        { name: 'buttonText', label: 'Button Text', type: 'string' },
        { name: 'buttonLink', label: 'Button Link', type: 'string' },
      ],
    },
    {
      type: 'object',
      name: 'newsroom',
      label: 'Reach the Newsroom Section',
      fields: [
        { name: 'eyebrow', label: 'Eyebrow', type: 'string' },
        { name: 'title', label: 'Title', type: 'string' },
        { name: 'intro', label: 'Intro', type: 'string', ui: { component: 'textarea' } },
        {
          name: 'contacts',
          label: 'Contact Cards',
          type: 'object',
          list: true,
          fields: [
            { name: 'icon', label: 'Icon', type: 'string', options: ['chat', 'alert', 'document'] },
            { name: 'title', label: 'Title', type: 'string' },
            { name: 'email', label: 'Email', type: 'string' },
            { name: 'text', label: 'Text', type: 'string', ui: { component: 'textarea' } },
          ],
        },
      ],
    },
  ],
};
