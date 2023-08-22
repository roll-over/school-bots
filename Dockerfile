FROM node:20

COPY package.json package.json

RUN npm install