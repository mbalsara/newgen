import { builder } from './builder.js'

// Import all service GraphQL definitions
import '../services/patients/graphql.js'

export const schema = builder.toSchema()
