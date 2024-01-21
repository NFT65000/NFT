const { getPermutationsWithRarities } = require("./utils/utils");

let p = getPermutationsWithRarities(
  [
    ["a", "b", "c", "d"],
    ["x", "y", "z", "q"],
    ["1", "2", "3", "4"],
    ["i", "j", "k", "o"],
    ["u", "v", "g", "t"],
    ["us", "vs", "gf", "ta"],
  ],
  [
    [40, 30, 20, 10],
    [35, 35, 25, 5],
    // [25, 25, 25, 25],
    // [25, 25, 25, 25],
    [25, 25, 25, 25],
    [25, 25, 25, 25],
    [25, 25, 25, 25],
    [25, 25, 25, 25],
  ],
  2846
);
