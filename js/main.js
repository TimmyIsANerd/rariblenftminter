$("document").ready(() => {
  $("#app").hide();
  $("#alert").hide();
  $('#mintcompletebtn').hide();

  const { ethereum } = window;
  
  function WalletTest() {
    if (!ethereum) {
      $("#alert").text("Please make sure you have MetaMask Wallet Installed!");
      $("#alert").fadeIn(400);
    } else {
      console.log("Ethereum Wallet located");
      WalletNetworkTest();
    }
  }

  WalletTest();

  const rinkebyChainId = "0x4";
  // If Wallet Network Change: Rinkeby
  ethereum.on("chainChanged", (chainId) => {
    if (chainId === rinkebyChainId) {
      $("#alert").text("You are connected to Rinkeby Test Network!");
      $("#alert").fadeIn(400);
    }
    if (chainId === "0x1") {
      $("#alert").text(
        "You are connected to Ethereum Network! You need to be on the Rinkeby Testnet to Mint your NFT"
      );
      $("#alert").fadeIn(400);
    }
  });

  async function WalletNetworkTest() {
    const rinkebyChainId = "0x4";
    let chainId = await ethereum.request({
      method: "eth_chainId",
    });
    console.log("Connected to chain " + chainId);
    if (chainId !== rinkebyChainId) {
      $("#alert").text(
        "Please make sure your wallet is connected to the Rinkeby Test Network!"
      );
      $("#alert").fadeIn(400);
      return false;
    }
  }

  $("#alert").click(() => {
    $("#alert").fadeOut(500);
  });

  /** Connect to Moralis server */
  const serverUrl = "";
  const appId = "";
  Moralis.start({ serverUrl, appId });
  let user = Moralis.User.current();
  const signIn = $("#authenticate");
  const logoutButton = $("#logout_button");
  console.log(logoutButton);

  // Check if Ethereum Object Exists
  async function login() {
    if (!ethereum) {
      WalletTest();
    } else {
      if (!user) {
        try {
          user = await Moralis.authenticate({
            signingMessage: "NFT Minter App!",
          });
          initApp();
        } catch (error) {
          console.log(error);
        }
      } else {
        Moralis.enableWeb3();
        initApp();
      }
    }
  }

  async function logout() {
    if (user) {
      let user = null;
      console.log(user);
      $("#app").fadeOut(800, () => {
        $("#art").fadeIn(800);
      });
    }
  }

  logoutButton.click(async () => {
    await logout();
    console.log("Log Out User");
    signIn.text("Login!");
  });

  signIn.click(async () => {
    await login();
    console.log("Authentication Triggered");
  });

  function initApp() {
    if (user) {
      $("#art").fadeOut(800, () => {
        $("#app").fadeIn(800);
      });
      document.querySelector("#submit_button").onclick = submit;
      signIn.text("Authenticated!");
    } else {
      alert("User isn't Logged In!");
    }
  }

  async function submit() {
    // First make sure App is connected to Rinkeby Test
    const rinkebyChainId = "0x4";
    let chainId = await ethereum.request({
      method: "eth_chainId",
    });
    console.log("Connected to chain " + chainId);
    if (chainId !== rinkebyChainId) {
      $("#alert").text(
        "Please make sure your wallet is connected to the Rinkeby Test Network!"
      );
      $("#alert").fadeIn(400);
      return false;
    }
    const input = document.querySelector("#input_image");
    const name = document.querySelector("#input_name").value;
    const description = document.querySelector("#input_description").value;
    // Validation Response
    if(name == "" || description == ""){
      $("#alert").text("Please make sure form is filled properly!");
      $("#alert").fadeIn(400);
      return false;
    }
    if(input == undefined){
      $("#alert").text("Please make sure form is filled properly!");
      $("#alert").fadeIn(400);
      return false;
    }


    $("#submit_button").text('Minting...');
    let data = input.files[0];
    const imageFile = new Moralis.File(data.name, data);
    await imageFile.saveIPFS();
    let imageHash = imageFile.hash();

    let metadata = {
      name: document.querySelector("#input_name").value,
      description: document.querySelector("#input_description").value,
      image: "/ipfs/" + imageHash,
    };
    console.log(metadata);
    const jsonFile = new Moralis.File("metadata.json", {
      base64: btoa(JSON.stringify(metadata)),
    });
    await jsonFile.saveIPFS();

    let metadataHash = jsonFile.hash();
    console.log(jsonFile.ipfs());
    let res = await Moralis.Plugins.rarible.lazyMint({
      chain: "rinkeby",
      userAddress: user.get("ethAddress"),
      tokenType: "ERC721",
      tokenUri: "ipfs://" + metadataHash,
      royaltiesAmount: 5, // 0.05% royalty. Optional
    });
    console.log(res);
    $('#mintMessage').html(`NFT minted.<br> <a target="_blank" href="https://rinkeby.rarible.com/token/${res.data.result.tokenAddress}:${res.data.result.tokenId}">View Your Published NFT!</a>`);
    // Success Message
    const SuccessMessageModal = document.getElementById('mintcomplete');
    const successModalBtn = document.getElementById('mintcompletebtn');
    successModalBtn.click();
    $("#submit_button").text('Minting');
  }

  // login();
  /** Useful Resources  */

  // https://docs.moralis.io/moralis-server/users/crypto-login
  // https://docs.moralis.io/moralis-server/getting-started/quick-start#user
  // https://docs.moralis.io/moralis-server/users/crypto-login#metamask

  /** Moralis Forum */

  // https://forum.moralis.io/
});
