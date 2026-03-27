
export const capitalize = (str: string) => {
  return str
  .split('_') // 1. Break it into ["brave", "scarlet", "badger"]
  .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // 2. Capitalize each
  .join(' '); // 3. Glue back with spaces: "Brave Scarlet Badger"
};

export const getRandomInt = (max:number) => {
  return Math.floor(Math.random() * max);
}
