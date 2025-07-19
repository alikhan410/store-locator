#!/bin/bash

# Ignore build if not on main branch
if [ "$VERCEL_GIT_BRANCH" != "main" ]; then
  echo "Skipping build for non-main branch: $VERCEL_GIT_BRANCH"
  exit 0
else
  exit 1
fi