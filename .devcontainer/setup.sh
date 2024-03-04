#!/bin/bash
cd .devcontainer
mkdir -p ./persistence/postgres || true
mkdir -p ./persistence/pgadmin || true
chmod  777 ./persistence/* || true
docker build -t pgists ./pgists
