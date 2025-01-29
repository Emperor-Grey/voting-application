FROM oven/bun:latest
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

WORKDIR /app

COPY . .

RUN bun install

EXPOSE 3002

# Use next build instead of bun build
RUN bun run build

CMD ["bun", "run", "start"]
