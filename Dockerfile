FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_BFF_URL=http://ecom-bff:4000
ENV NEXT_PUBLIC_BFF_URL=$NEXT_PUBLIC_BFF_URL

RUN npm run build

EXPOSE 3001

ENV PORT=3001

CMD ["npm", "start"]
