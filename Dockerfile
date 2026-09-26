# Single-service image: builds the web app, then runs the backend, which serves
# frontend/dist in production (see backend/index.js).

FROM node:22-alpine AS build
WORKDIR /app
COPY shared/package.json shared/package-lock.json shared/
COPY frontend/package.json frontend/package-lock.json frontend/
RUN npm ci --prefix shared && npm ci --prefix frontend
COPY shared shared
COPY frontend frontend
RUN npm run build --prefix frontend

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY shared/package.json shared/package-lock.json shared/
COPY backend/package.json backend/package-lock.json backend/
RUN npm ci --omit=dev --prefix shared && npm ci --omit=dev --prefix backend
COPY shared shared
COPY backend backend
COPY --from=build /app/frontend/dist frontend/dist
USER node
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD wget -qO- http://127.0.0.1:${PORT:-8000}/readyz || exit 1
CMD ["node", "backend/index.js"]
