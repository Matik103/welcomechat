
// Fix line 105 by adding proper type checking
if (error instanceof Error) {
  console.error('Error creating assistant:', error.message);
} else {
  console.error('Unknown error creating assistant:', error);
}
