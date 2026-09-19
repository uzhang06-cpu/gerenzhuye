# ---------- 构建 ----------
# 用 Debian 而不是 Alpine：vite 8 的 rolldown 和 esbuild 都带原生二进制，在 musl 上易踩坑。
# 产物是纯 JS，所以运行阶段仍然换回 Alpine 压体积。
FROM node:24-bookworm-slim AS build
WORKDIR /app

# 只先拷各包的 package.json，依赖没变时这层能命中缓存
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/client/package.json packages/client/
COPY packages/server/package.json packages/server/
RUN npm ci --no-audit --no-fund

COPY packages ./packages
RUN npm run build -w @skillswap/client && npm run build -w @skillswap/server

# ---------- 运行 ----------
FROM node:24-alpine
WORKDIR /app

# 端口与仓库原来的 nginx 镜像保持一致，Sealos 上已有的端口配置不用改
ENV NODE_ENV=production \
    PORT=80

# 由 CI 传入 commit sha，/api/health 会回显它，方便确认线上跑的是哪一次构建
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

COPY packages/server/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund

# 服务端 bundle 在 /app/dist，前端产物在 /app/public（两者是兄弟目录，与代码里的默认路径一致）
COPY --from=build /app/packages/server/dist ./dist
COPY --from=build /app/packages/client/dist ./public

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||80)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
