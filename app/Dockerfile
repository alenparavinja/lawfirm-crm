# Build stage - compiles TypeScript to JS. The output is copied to the
# production stage; dev dependencies and source files do not make it
# into the final image.
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production stage - only the compiled output and runtime dependencies.
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# Non-root user for the process. Alpine's node image ships with a 'node'
# user already created.
USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
