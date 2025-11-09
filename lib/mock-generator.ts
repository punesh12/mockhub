import { faker } from "@faker-js/faker"

export type MockTemplate =
  | "user"
  | "product"
  | "post"
  | "comment"
  | "order"
  | "custom"

export function generateMockData(template: MockTemplate = "custom"): any {
  switch (template) {
    case "user":
      return {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        avatar: faker.image.avatar(),
        bio: faker.person.bio(),
        createdAt: faker.date.past().toISOString(),
        isActive: faker.datatype.boolean(),
      }

    case "product":
      return {
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: faker.commerce.price(),
        category: faker.commerce.department(),
        image: faker.image.url(),
        inStock: faker.datatype.boolean(),
        rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
        createdAt: faker.date.past().toISOString(),
      }

    case "post":
      return {
        id: faker.string.uuid(),
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(3),
        author: {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          avatar: faker.image.avatar(),
        },
        tags: faker.helpers.arrayElements(
          ["tech", "design", "business", "lifestyle", "travel"],
          { min: 1, max: 3 }
        ),
        likes: faker.number.int({ min: 0, max: 1000 }),
        views: faker.number.int({ min: 0, max: 10000 }),
        publishedAt: faker.date.past().toISOString(),
      }

    case "comment":
      return {
        id: faker.string.uuid(),
        content: faker.lorem.paragraph(),
        author: {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          avatar: faker.image.avatar(),
        },
        likes: faker.number.int({ min: 0, max: 100 }),
        createdAt: faker.date.past().toISOString(),
      }

    case "order":
      return {
        id: faker.string.uuid(),
        orderNumber: faker.string.alphanumeric(10).toUpperCase(),
        customer: {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          email: faker.internet.email(),
        },
        items: Array.from(
          { length: faker.number.int({ min: 1, max: 5 }) },
          () => ({
            id: faker.string.uuid(),
            name: faker.commerce.productName(),
            quantity: faker.number.int({ min: 1, max: 5 }),
            price: faker.commerce.price(),
          })
        ),
        total: faker.commerce.price(),
        status: faker.helpers.arrayElement([
          "pending",
          "processing",
          "shipped",
          "delivered",
        ]),
        createdAt: faker.date.past().toISOString(),
      }

    case "custom":
    default:
      return {
        id: faker.string.uuid(),
        name: faker.lorem.word(),
        description: faker.lorem.sentence(),
        value: faker.number.int({ min: 1, max: 100 }),
        createdAt: faker.date.past().toISOString(),
        status: faker.helpers.arrayElement(["active", "inactive", "pending"]),
      }
  }
}

export function generateMockDataArray(
  template: MockTemplate,
  count: number = 5
): any[] {
  return Array.from({ length: count }, () => generateMockData(template))
}
