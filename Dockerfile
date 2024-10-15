# Step 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files including the public folder
COPY . .

# Build the Next.js app
RUN npm run build

# Step 2: Serve the built application
FROM node:18-alpine AS runner

WORKDIR /app

# Copy the built application and public folder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["npm", "run", "start"]