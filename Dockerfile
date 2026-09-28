# Container image for the Chatly API.
#
# Lives at the repo root, but builds only `backend/`, so hosts that clone the
# whole repository need no "root directory" setting. The frontend is deployed
# separately to Vercel and is not copied in.

FROM node:20-alpine

WORKDIR /app

# Dependencies are their own layer: a code-only change reuses the cached install.
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ ./

# Uploads only land on disk when Cloudinary is unconfigured, and on these hosts
# the filesystem is ephemeral. Created so the app can boot either way.
RUN mkdir -p uploads

ENV NODE_ENV=production
# config/env.js reads process.env.PORT and falls back to 5000, so a host that
# injects its own PORT overrides this without a rebuild.
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
