#!/bin/bash

echo "VERCEL_GIT_COMMIT_REF is: $VERCEL_GIT_COMMIT_REF"

if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then
  echo "Skipping build for non-main branch: $VERCEL_GIT_COMMIT_REF"
  exit 0
else
  echo "Proceeding with build for main branch"
  exit 1
fi
