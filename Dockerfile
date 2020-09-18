FROM node:12-alpine

RUN apk --no-cache add curl unzip && \
    curl -O https://downloads.rclone.org/rclone-current-linux-amd64.zip && \
    unzip rclone-current-linux-amd64.zip && \
    cd rclone-*-linux-amd64 && \
    cp rclone /usr/bin/ && \
    chown root:root /usr/bin/rclone && \
    chmod 755 /usr/bin/rclone && \
    rm -rf /var/cache/apk/* /rcone-current-linux-amd64.zip

WORKDIR /usr/local/bin/google-sync

COPY package.json .
COPY package-lock.json .
RUN npm install --production

COPY lib .
COPY etc .
COPY etc/rclone.conf /root/.config/rclone/rclone.conf.example

CMD ["node", "lib/server.js"]