import { defineCollection, z } from 'astro:content';

const docsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().optional(),
    seeAlso: z.array(z.object({
      title: z.string(),
      href: z.string(),
    })).optional(),
  }),
});

export const collections = {
  docs: docsCollection,
};

