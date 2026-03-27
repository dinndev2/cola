
export const capitalize = (str: string) => {
  return str
  .split('_') // 1. Break it into ["brave", "scarlet", "badger"]
  .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // 2. Capitalize each
  .join(' '); // 3. Glue back with spaces: "Brave Scarlet Badger"
};

export const getRandomInt = (max:number) => {
  return Math.floor(Math.random() * max);
}

export const generateId = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

