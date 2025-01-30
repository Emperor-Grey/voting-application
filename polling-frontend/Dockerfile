FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package.json yarn.lock ./

RUN yarn install

COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL

# Set environment variables during build time
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}

RUN yarn build

EXPOSE 3002

CMD ["yarn", "start"]