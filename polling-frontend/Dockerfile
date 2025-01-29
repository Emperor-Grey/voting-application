FROM node:20-alpine
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

WORKDIR /app

COPY . .

RUN yarn install

EXPOSE 3002

RUN yarn build

CMD ["yarn", "start"]
