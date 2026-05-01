FROM zricethezav/gitleaks:latest AS gitleaks-bin
FROM node:22-alpine
RUN apk update && apk add --no-cache git
COPY --from=gitleaks-bin /usr/bin/gitleaks /usr/local/bin/gitleaks
RUN chmod +x /usr/local/bin/gitleaks
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
