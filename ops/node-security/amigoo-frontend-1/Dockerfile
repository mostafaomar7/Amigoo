FROM node@sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d AS fixed
FROM local/node-security-original/amigoo-frontend-1:20261024
USER root
COPY --from=fixed /usr/local/bin/node /usr/local/bin/node
ENV NODE_VERSION=22.23.4
RUN ["/usr/local/bin/node", "-e", "if(process.version!=='v22.23.4')process.exit(1);const z=require('node:zlib');const b=Buffer.from('Mosalam.com security preflight');if(!z.brotliDecompressSync(z.brotliCompressSync(b)).equals(b))process.exit(2);console.log(process.version,process.versions.openssl)"]
