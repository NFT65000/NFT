const _ = require("lodash");

//test
// rarities = [
//   [
//     25,
//     25,
//     25
//   ],
//   [
//     25,
//     25,
//     25
//   ]
// ];
// total = 10;

//result
// [
//   'a,z', 'c,z', 'b,z',
//   'a,z', 'b,y', 'b,z',
//   'a,x', 'b,z', 'a,z',
//   'a,z'
// ]

const getPermutationsWithRarities = (layerfiles, rarities, total) => {
  let permutations = [];
  let spreadRarities = rarities.map((rarity) => {
    let rarityWithCount = calcCountFromPercent(rarity, total);
    let spreadRarity = [];
    rarityWithCount.forEach((count, traitIndex) => {
      spreadRarity.push(...Array(count).fill(traitIndex));
    });
    // return _.shuffle(spreadRarity);
    return spreadRarity;
  });

  let noMatches = 0;
  while(noMatches < 1000 && spreadRarities[0].length != 0){
    let pick = [];
    let pickedIds = [];
    spreadRarities.forEach((spreadRarity, layerIndex)=>{
      let pickedId = _.random(0, spreadRarity.length - 1);
      pickedIds.push(pickedId);
      pick.push(spreadRarity[pickedId]);
    });

    if(_.filter(permutations, _.matches(pick)).length == 0){
      noMatches = 0;
      permutations.push(pick);
      pickedIds.forEach((pickedId, layerIndex) => {
        spreadRarities[layerIndex].splice(pickedId, 1);
      });
    }else{
      noMatches ++;
    }
  }

  return permutations.map(p=>p.map((t, l)=>layerfiles[l][t]).join(','));
};

const calcCountFromPercent = (rarity, total) => {
  let rarityWithCount = [];
  let sum = 0;
  rarity.forEach((percent, traitIndex) => {
    rarityWithCount[traitIndex] = Math.floor((total * percent) / 100);
    sum += rarityWithCount[traitIndex];
  });
  for (let i = 0; i < total - sum; i++) {
    rarityWithCount[i % rarity.length]++;
  }
  return rarityWithCount;
};

module.exports = {
  getPermutationsWithRarities
};