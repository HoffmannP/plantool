FROM node:20-slim

WORKDIR /usr/src/app

COPY build /usr/src/app

CMD [ "node", "index.js/usr/src/app/index.js" ]
