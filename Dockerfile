FROM node:14 as dependencies
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:14 as builder
WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN yarn build

FROM node:14 as runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["yarn", "start"]

# FROM node:14 AS base
# WORKDIR /app
# COPY package.json ./
# RUN yarn install 
# COPY . .

# FROM base AS build
# ENV NODE_ENV=production
# WORKDIR /build
# COPY --from=base /app /.
# RUN yarn run build

# FROM node:14 AS production
# ENV NODE_ENV=production
# WORKDIR /app
# COPY --from=build /build/package*.json ./
# COPY --from=build /build/.next ./.next
# COPY --from=build /build/public ./public
# RUN yarn install next

# EXPOSE 3000
# CMD ["yarn", "start"]


# FROM node:14

# WORKDIR /app
# ENV NODE_EVNV = production

# COPY package*.json /app

# RUN yarn install 
# COPY . /app

# RUN yarn run build

# EXPOSE 3000 

# CMD ["yarn", "start"]