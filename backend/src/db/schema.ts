import { pgTable, serial, varchar, text, decimal, boolean, integer, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'viewer']);

// Restaurants table
export const restaurants = pgTable('restaurants', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  logoUrl: varchar('logo_url', { length: 500 }),
  description: text('description'),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  wifiName: varchar('wifi_name', { length: 100 }),
  wifiPassword: varchar('wifi_password', { length: 100 }),
  customSections: jsonb('custom_sections'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#007bff'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Menu items table
export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  restaurantId: integer('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  category: varchar('category', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  availabilityTime: varchar('availability_time', { length: 50 }),
  isAvailable: boolean('is_available').default(true),
  sortOrder: integer('sort_order').default(0),
  itemCode: integer('item_code').default(0),
  isVeg: boolean('is_veg'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('admin'),
  email: varchar('email', { length: 100 }),
  fullName: varchar('full_name', { length: 100 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Feedback table
export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  restaurantId: integer('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  phoneNumber: varchar('phone_number', { length: 15 }),
  foodQuality: integer('food_quality').notNull(),
  service: integer('service').notNull(),
  ambiance: integer('ambiance').notNull(),
  pricing: integer('pricing').notNull(),
  comments: text('comments'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  menuItems: many(menuItems),
  feedback: many(feedback),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [menuItems.restaurantId],
    references: [restaurants.id],
  }),
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [feedback.restaurantId],
    references: [restaurants.id],
  }),
}));

// Type exports
export type Restaurant = typeof restaurants.$inferSelect;
export type NewRestaurant = typeof restaurants.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
