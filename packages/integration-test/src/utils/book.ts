import { faker } from '@faker-js/faker';
import { z } from 'zod';

type Author = {
  name: string;
  email?: string;
};

export type Book = {
  id: string;
  name: string;
  authors: Author[];
  price: number;
};

export const bookGuard = z.object({
  id: z.string(),
  name: z.string(),
  authors: z.object({ name: z.string(), email: z.string().optional() }).array(),
  price: z.number(),
});

export const createBook = (): Book => ({
  id: faker.datatype.uuid(),
  name: faker.commerce.productName(),
  authors: [
    { name: faker.name.fullName(), email: faker.internet.email() },
    { name: faker.name.fullName() },
  ],
  price: faker.datatype.number(100),
});
