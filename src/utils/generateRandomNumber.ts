export function generateRandomNumber() {
  // Generate a random number between 0 (inclusive) and 1 (exclusive)
  const randomNumber = Math.random();

  // Scale the random number to be between 0 and 100,000
  const scaledNumber = randomNumber * 100000;

  // Round down to the nearest integer
  const randomInteger = Math.floor(scaledNumber);

  return randomInteger;
}
