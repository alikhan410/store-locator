/**
 * Prisma 7 Configuration
 * Connection URLs are configured here instead of schema.prisma
 * See: https://pris.ly/d/config-datasource
 */
export default {
  datasource: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
};

