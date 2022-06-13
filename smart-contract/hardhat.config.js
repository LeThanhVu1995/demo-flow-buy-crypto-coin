require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: "https://speedy-nodes-nyc.moralis.io/f68ad5cc611a06ad6e84fe8e/eth/rinkeby",
      accounts: [
        "9237ed5df7305b68aa3b4dbfa315d3b1ff5374c9d3467f1abb26cd1997c0be5c",
      ],
      gas: 2100000,
      gasPrice: 8000000000,
    },
  },
};
