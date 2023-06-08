# Build stage
FROM node:18-alpine as builder
WORKDIR /etc/sample
ENV CI=true
COPY . .

# Install toolchain
RUN npm add --location=global pnpm@^8.6

# Install dependencies and build
RUN pnpm i
RUN pnpm -r build

# Prune dependencies for production
RUN rm -rf node_modules packages/*/node_modules
RUN NODE_ENV=production pnpm i

# Clean up
RUN rm -rf pnpm-*.yaml

# Seal stage
FROM node:18-alpine as app
WORKDIR /etc/sample
COPY --from=builder /etc/sample .
EXPOSE 9001
ENTRYPOINT ["sh", "-c", "cd packages/sample && npm start"]
