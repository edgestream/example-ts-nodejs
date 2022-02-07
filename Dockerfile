FROM node
COPY src src
COPY package.json .
COPY tsconfig.json .
RUN npm install
RUN npm run build
ENTRYPOINT ["npm", "run", "serve"]
EXPOSE 8080