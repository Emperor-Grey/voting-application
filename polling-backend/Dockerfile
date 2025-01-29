ARG RUST_VERSION=1.83.0
ARG APP_NAME=polling

# Build stage
FROM rust:${RUST_VERSION}-alpine AS build
ARG APP_NAME

WORKDIR /app

RUN apk add --no-cache clang lld musl-dev git openssl musl musl-dev pkgconfig build-base
RUN apk add --no-cache openssl-dev
RUN apk add --no-cache openssl-libs-static

COPY Cargo.toml Cargo.lock ./

COPY . .

RUN cargo build --locked --release

RUN cp ./target/release/$APP_NAME /bin/server

# Final stage: Create a minimal runtime image
FROM alpine:3.18 AS final

ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

USER appuser

# Copy the binary from the build stage to the final image
COPY --from=build /bin/server /bin/

EXPOSE 3000

CMD ["/bin/server"]
