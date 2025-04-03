#!/bin/bash

# List of migrations to repair
migrations=(
  "20240328"
  "20240328"
  "20240328"
  "20240328"
  "20240328"
  "20240328"
  "20240328"
  "20240330"
  "20240330"
  "20240330"
  "20240330"
  "20240331"
  "20240331"
  "20240401"
  "20240401"
  "20240403"
  "20240403"
  "20240403"
  "20240512"
)

# Loop through migrations and repair each one
for migration in "${migrations[@]}"
do
  echo "Repairing migration: $migration"
  supabase migration repair --status applied "$migration"
done 