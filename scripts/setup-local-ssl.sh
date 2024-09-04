#!/bin/bash

mkcert -install
mkcert "*.thonlabs.io" localhost 127.0.0.1 ::1
mkdir -p ../certs
mv ./_wildcard.thonlabs.io+3.pem ../certs/thonlabs.crt
mv ./_wildcard.thonlabs.io+3-key.pem ../certs/thonlabs.key

echo "Certificates generated and moved to ./certs/"