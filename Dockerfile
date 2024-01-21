FROM node:16-alpine
WORKDIR /app
RUN chown -R node:node /app
RUN chmod 755 /app
RUN apk add  --no-cache ffmpeg
COPY --chown=node:node package.json yarn.lock ./
RUN yarn install --frozen-lock-file
COPY --chown=node:node . .
USER node
EXPOSE 3000
CMD ["yarn", "start"]

