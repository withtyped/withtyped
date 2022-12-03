import { faker } from '@faker-js/faker';
import { z } from 'zod';

export const bookGuard = z.object({
  id: z.string(),
  name: z.string(),
  authors: z.object({ name: z.string(), email: z.string().optional() }).array(),
  price: z.number(),
});

export type Book = z.infer<typeof bookGuard>;

export const createBook = (): Book => ({
  id: faker.datatype.uuid(),
  name: faker.commerce.productName(),
  authors: [
    { name: faker.name.fullName(), email: faker.internet.email() },
    { name: faker.name.fullName() },
  ],
  price: faker.datatype.number(100),
});

export const createBookWithoutId = (): Omit<Book, 'id'> => {
  const { id, ...book } = createBook();

  return book;
};
