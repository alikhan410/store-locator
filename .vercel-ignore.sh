#!/bin/bash

echo "VERCEL_GIT_BRANCH is: $VERCEL_GIT_BRANCH"

if [ "$VERCEL_GIT_BRANCH" != "main" ]; then
  echo "Skipping build for non-main branch: $VERCEL_GIT_BRANCH"
  exit 0
else
  echo "Proceeding with build for main branch"
  exit 1
fi