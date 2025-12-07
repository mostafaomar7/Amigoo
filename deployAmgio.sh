#!/bin/bash
docker compose -f /root/Amigoo/docker-compose.yml down
git --git-dir=/root/Amigoo/.git --work-tree=/root/Amigoo pull
docker image rm --force amigo-frontend
docker image rm --force amigo-backend
docker build /root/Amigoo/ -t amigo-frontend &
docker build /root/Amigoo/e-commerce/ -t amigo-backend &
wait
docker compose -f /root/Amigoo/docker-compose.yml up -d
