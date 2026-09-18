export const contactMockup17BlockSchema = {
  name: 'contactMockup17',
  label: 'Contact Page Template Sections',
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
      name: 'formSection',
      label: 'Message Form Section',
      fields: [
        { name: 'eyebrow', label: 'Eyebrow', type: 'string' },
        { name: 'title', label: 'Title', type: 'string' },
        { name: 'description', label: 'Description', type: 'string', ui: { component: 'textarea' } },
        { name: 'buttonText', label: 'Button Text', type: 'string' },
        { name: 'note', label: 'Form Note', type: 'string', ui: { component: 'textarea' } },
        { name: 'formAction', label: 'Form Action URL / Formspree Endpoint', type: 'string', description: 'Optional. Leave blank to keep the form non-submitting until an endpoint is added.' },
        { name: 'subject', label: 'Email Subject', type: 'string' },
      ],
    },
    {
      type: 'object',
      name: 'inboxes',
      label: 'Where to Write / Inbox Cards',
      fields: [
        { name: 'eyebrow', label: 'Eyebrow', type: 'string' },
        { name: 'title', label: 'Title', type: 'string' },
        {
          name: 'cards',
          label: 'Inbox Cards',
          type: 'object',
          list: true,
          fields: [
            { name: 'title', label: 'Title', type: 'string' },
            { name: 'description', label: 'Description', type: 'string', ui: { component: 'textarea' } },
            { name: 'email', label: 'Email', type: 'string' },
            { name: 'note', label: 'Note', type: 'string', ui: { component: 'textarea' } },
          ],
        },
      ],
    },
    {
      type: 'object',
      name: 'requests',
      label: 'Specific Requests Section',
      fields: [
        { name: 'eyebrow', label: 'Eyebrow', type: 'string' },
        { name: 'title', label: 'Title', type: 'string' },
        { name: 'intro', label: 'Intro', type: 'string', ui: { component: 'textarea' } },
        {
          name: 'cards',
          label: 'Request Cards',
          type: 'object',
          list: true,
          fields: [
            { name: 'icon', label: 'Icon', type: 'string', options: ['alert', 'document', 'mail'] },
            { name: 'title', label: 'Title', type: 'string' },
            { name: 'text', label: 'Text', type: 'string', ui: { component: 'textarea' } },
          ],
        },
      ],
    },
  ],
};
