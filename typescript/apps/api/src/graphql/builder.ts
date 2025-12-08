import SchemaBuilder from '@pothos/core'

export interface Context {
  // Add request context, user info, etc.
}

export const builder = new SchemaBuilder<{
  Context: Context
}>({
  plugins: [],
})

// Define base Query and Mutation types
builder.queryType({
  fields: (t) => ({
    hello: t.string({
      resolve: () => 'Hello from GraphQL!',
    }),
  }),
})

builder.mutationType({})
