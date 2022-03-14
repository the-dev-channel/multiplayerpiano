FROM node:17.7-buster-slim
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ["package.json", "yarn.lock", "./"]
RUN npm install npm
RUN npm install yarn
RUN yarn install --production --silent && mv node_modules ../
COPY . .
RUN chown -R node /usr/src/app
USER node
CMD ["npm", "start"]
