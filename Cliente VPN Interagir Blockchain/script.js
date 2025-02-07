document.addEventListener("DOMContentLoaded", () => {
    const accountSelect = document.getElementById("accountSelect");
    const connectWalletButton = document.getElementById("connectWallet");
    const deployContractButton = document.getElementById("deployContract");
    const statusMessage = document.getElementById("statusMessage");

    let selectedAccount = null;
    let deployedContract = null;
    let selectedOption = null;
    const options = [
        { label: "1 mês", usd: 30 },
        { label: "3 meses", usd: 80 },
        { label: "6 meses", usd: 150 },
        { label: "1 ano", usd: 200 },
    ];

    //const temposExecucao = JSON.parse(localStorage.getItem("temposExecucao")) || {};

    function medirTempo(nome, callback) {
        const inicio = performance.now();
        callback(); // Executa o código alvo
        const fim = performance.now();

        temposExecucao[nome] = (fim - inicio).toFixed(2) + " ms"; // Registra o tempo

        // Salva os dados no localStorage
        localStorage.setItem("temposExecucao", JSON.stringify(temposExecucao));
    }

    // Função para baixar os tempos como JSON
    function baixarTempos() {
        const blob = new Blob([JSON.stringify(temposExecucao, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "tempos.json";
        a.click();
    }

    // Função para baixar o arquivo JSON
    function baixarJSON(info_user) {
        const jsonString = JSON.stringify(info_user, null, 2);  // Converte o objeto para string JSON
        const blob = new Blob([jsonString], { type: "application/json" });  // Cria um Blob com o tipo MIME 'application/json'
        const link = document.createElement("a");  // Cria um link
        link.href = URL.createObjectURL(blob);  // Cria uma URL para o Blob
        link.download = "info_user.json";  // Define o nome do arquivo a ser baixado
        link.click();  // Simula o clique no link para iniciar o download
    }

    function gerarChaves() {
        function gerarChaves() {
            // Verificar se a biblioteca foi carregada corretamente
            if (typeof elliptic === 'undefined') {
                console.error("A biblioteca elliptic não foi carregada corretamente.");
                return null;
            }
            // Criar o gerador de chave elliptic com a curva secp256k1
            const EC = elliptic.ec;
            const ec = new EC('secp256k1'); // Usando a curva secp256k1
            // Gerar o par de chaves
            const chave = ec.genKeyPair();
            // Obter a chave privada em formato hexadecimal
            const chavePrivada = chave.getPrivate('hex');
            // Obter a chave pública como coordenadas inteiras
            const pontoPublico = chave.getPublic(); // Objeto de ponto público
            const x = pontoPublico.getX().toString(); // Coordenada x
            const y = pontoPublico.getY().toString(); // Coordenada y
            // Retornar as chaves como um objeto
            return {
                chavePrivada: chavePrivada,
                chavePublicaX: x,
                chavePublicaY: y
            };
        }

        if (typeof elliptic === 'undefined') {
            console.error("A biblioteca elliptic não foi carregada corretamente.");
            return null;
        }

        // Criar o gerador de chave elliptic com a curva secp256k1
        const EC = elliptic.ec;
        const ec = new EC('secp256k1'); // Usando a curva secp256k1

        // Gerar o par de chaves
        const chave = ec.genKeyPair();

        // Obter a chave privada em formato hexadecimal
        const chavePrivada = chave.getPrivate('hex');

        // Obter a chave pública como coordenadas inteiras
        const pontoPublico = chave.getPublic(); // Objeto de ponto público
        const x = pontoPublico.getX().toString(); // Coordenada x
        const y = pontoPublico.getY().toString(); // Coordenada y

        // Retornar as chaves como um objeto
        return {
            chavePrivada: chavePrivada,
            chavePublicaX: x,
            chavePublicaY: y
        };
    }


    // Função para exibir a mensagem com estilo adequado
    function showStatusMessage(message, type = "info") {
        // Limpar as mensagens anteriores
        statusMessage.classList.add("hidden");
        setTimeout(() => {
            statusMessage.classList.remove("hidden");
            statusMessage.textContent = message;
            statusMessage.className = `status-message ${type}-message`;
        }, 500);  // Tempo para desaparecer a mensagem anterior antes de mostrar a nova
    }

    connectWalletButton.addEventListener("click", async () => {
        if (typeof window.ethereum !== "undefined") {
            const web3 = new Web3(window.ethereum);

            try {
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const accounts = await web3.eth.getAccounts();

                accountSelect.innerHTML = "<option value=''>Selecione uma conta</option>";
                accounts.forEach((account, index) => {
                    const option = document.createElement("option");
                    option.value = account;
                    option.textContent = `Conta ${index + 1}: ${account}`;
                    accountSelect.appendChild(option);
                });

                showStatusMessage("Carteira conectada. Selecione uma conta.", "success");
            } catch (error) {
                console.error(error);
                showStatusMessage("Erro ao conectar a carteira: " + error.message, "error");
            }
        } else {
            showStatusMessage("MetaMask não encontrada. Instale a extensão para continuar.", "error");
        }
    });

    accountSelect.addEventListener("change", (event) => {
        selectedAccount = event.target.value;
        if (selectedAccount) {
            showStatusMessage(`Conta selecionada: ${selectedAccount}`, "info");
            deployContractButton.disabled = false;
        }
    });

    //---------------Converter Dolar pra ETH

    /* 
        async function getEthereumPriceInUSD() {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
                const data = await response.json();
                return data.ethereum.usd;
            } catch (error) {
                console.error('Erro ao buscar a cotação do Ethereum:', error);
                return null;
            }
        }
    
        async function populateOptions() {
            const ethPriceInUSD = await getEthereumPriceInUSD();
            const timeSelection = document.getElementById('timeSelection');
    
            if (ethPriceInUSD) {
                options.forEach(option => {
                    const ethAmount = (option.usd / ethPriceInUSD).toFixed(6);
                    const optionElement = document.createElement('option');
                    optionElement.value = option.usd;
                    optionElement.textContent = `${option.label} - $${option.usd} (${ethAmount} ETH)`;
                    timeSelection.appendChild(optionElement);
                });
            } else {
                timeSelection.innerHTML = "<option value=''>Erro ao carregar cotações</option>";
            }
        }
    
        document.getElementById('timeSelection').addEventListener('change', function () {
            const selectedIndex = this.selectedIndex;
            if (selectedIndex > 0) {
                selectedOption = options[selectedIndex - 1]; // Armazena a opção selecionada
                console.log("Opção selecionada:", selectedOption);
            }
        });
    
        async function convertUsdToEth() {
            if (!selectedOption) {
                document.getElementById('result').innerText = 'Por favor, selecione uma opção válida.';
                return;
            }
    
            const ethPriceInUSD = await getEthereumPriceInUSD();
            if (ethPriceInUSD) {
                const ethAmount = selectedOption.usd / ethPriceInUSD;
                document.getElementById('result').innerText = `Valor em Ethereum: ${ethAmount.toFixed(6)} ETH`;
            } else {
                document.getElementById('result').innerText = 'Erro ao obter a cotação do Ethereum.';
            }
        }
    
        window.onload = populateOptions;
    */

    //--------------Fim Converter Dolar pra ETH

    const contractInfo = document.createElement("p");
    document.querySelector(".container").appendChild(contractInfo);

    deployContractButton.addEventListener("click", async () => {
        if (!selectedAccount) {
            showStatusMessage("Por favor, selecione uma conta.", "error");
            return;
        }

        try {
            // Carregando ABI e Bytecode
            const abiResponse = await fetch('abi.json');
            const bytecodeResponse = await fetch('bytecode.txt');
            const abi = await abiResponse.json();
            const bytecode = await bytecodeResponse.text();

            const web3 = new Web3(window.ethereum);
            const contract = new web3.eth.Contract(abi);
            const deployTransaction = contract.deploy({ data: bytecode });

            accountSelect.disabled = true;
            connectWallet.disabled = true;

            showStatusMessage("Fazendo deploy do contrato...", "info");

            const gasEstimate = await deployTransaction.estimateGas({ from: selectedAccount });

            let envioDeploy, fimDeploy, tempoDeploy;

            let temposExecucao;

            deployedContract = await deployTransaction.send({
                from: selectedAccount,
                gas: gasEstimate,
            })
                .on('transactionHash', (hash) => {
                    console.log("Transação enviada, aguardando mineração...", hash);
                    envioDeploy = performance.now(); // Tempo exato do envio
                })
                .once('receipt', (receipt) => {
                    fimDeploy = performance.now(); // Tempo da confirmação
                    tempoDeploy = ((fimDeploy - envioDeploy) / 1000).toFixed(4) + " s"; // Em segundos

                    temposExecucao = JSON.parse(localStorage.getItem(`tempos_${receipt.contractAddress}`)) || {};

                    temposExecucao["1 - Tempo Deploy Contrato"] = tempoDeploy;
                    console.log("Tempo real de deploy:", tempoDeploy);

                    // Salva no localStorage com o endereço do contrato
                    localStorage.setItem(`tempos_${receipt.contractAddress}`, JSON.stringify(temposExecucao));

                    showStatusMessage("Contrato implantado com sucesso!", "success");

                    contractInfo.innerHTML = `<strong>Endereço do contrato:</strong> ${receipt.contractAddress}<br>`;

                });

            // Enviando fundos para o contrato
            showStatusMessage("Enviando fundos do pagamento para o contrato...", "info");
            const amountInEther = "0.001";
            const amountInWei = web3.utils.toWei(amountInEther, "ether");

            let envioPagamentoContrato, fimPagamentoContrato, tempoPagamentoContrato;

            await web3.eth.sendTransaction({
                from: selectedAccount,
                to: deployedContract.options.address,
                value: amountInWei,
            })
                .on('transactionHash', (hash) => {
                    console.log("Transação enviada, aguardando mineração...", hash);
                    envioPagamentoContrato = performance.now();
                })
                .once('receipt', (receipt) => {
                    fimPagamentoContrato = performance.now();
                    tempoPagamentoContrato = ((fimPagamentoContrato - envioPagamentoContrato) / 1000).toFixed(4) + " s";

                    temposExecucao["2 - Tempo Transação para o Contrato"] = tempoPagamentoContrato;
                    console.log("Tempo real Transação para o Contrato:", tempoPagamentoContrato);

                    localStorage.setItem(`tempos_${deployedContract.options.address}`, JSON.stringify(temposExecucao));

                    showStatusMessage(`Fundos enviados com sucesso! Valor: ${amountInEther} Ether`, "success");
                });

            // Enviando pagamento para VPN
            showStatusMessage("Enviando o pagamento do contrato para a VPN...", "info");
            const vpnAddress = "0xdCcEEd9A4b102093bB0eC1e81a0969d9BB6b55a2";

            let envioVPN, fimVPN, tempoVPN;

            const tx = await deployedContract.methods
                .transferPayment(vpnAddress, amountInWei)
                .send({ from: selectedAccount })
                .on('transactionHash', (hash) => {
                    console.log("Transação para VPN enviada, aguardando mineração...", hash);
                    envioVPN = performance.now();
                })
                .once('receipt', (receipt) => {
                    fimVPN = performance.now();
                    tempoVPN = ((fimVPN - envioVPN) / 1000).toFixed(4) + " s";

                    temposExecucao["3 - Tempo Transação do Contrato Para a VPN"] = tempoVPN;
                    console.log("Tempo real Transação do Contrato Para a VPN:", tempoVPN);

                    localStorage.setItem(`tempos_${deployedContract.options.address}`, JSON.stringify(temposExecucao));

                    showStatusMessage("Pagamento enviado com sucesso!", "success");
                });

            console.log("Transação confirmada:", tx);

            // Medindo o tempo para obter o receiptCode
            let inicioReceiptCode = performance.now();
            const receiptCode = await deployedContract.methods.getReceiptCode().call({ from: selectedAccount });
            let fimReceiptCode = performance.now();
            let tempoReceiptCode = ((fimReceiptCode - inicioReceiptCode) / 1000).toFixed(4) + " s";

            temposExecucao["4 - Tempo Obtenção ReceiptCode"] = tempoReceiptCode;
            console.log("Tempo real Obtenção ReceiptCode:", tempoReceiptCode);
            localStorage.setItem(`tempos_${deployedContract.options.address}`, JSON.stringify(temposExecucao));

            console.log("ReceiptCode:", receiptCode);

            // Medindo o tempo de geração das chaves
            let inicioGeracaoChaves = performance.now();
            const chaves = gerarChaves();
            let fimGeracaoChaves = performance.now();
            let tempoGeracaoChaves = ((fimGeracaoChaves - inicioGeracaoChaves) / 1000).toFixed(4) + " s";

            temposExecucao["5 - Tempo Geração de Chaves"] = tempoGeracaoChaves;
            console.log("Tempo real Geração de Chaves:", tempoGeracaoChaves);
            localStorage.setItem(`tempos_${deployedContract.options.address}`, JSON.stringify(temposExecucao));

            if (chaves) {
                console.log("Chave Privada (hex):", chaves.chavePrivada);
                console.log("Chave Pública X:", chaves.chavePublicaX);
                console.log("Chave Pública Y:", chaves.chavePublicaY);
            }

            const url = "http://127.0.0.1:5000/verificarPagamento";

            const data = {
                addressContract: deployedContract.options.address,
                receiptCode: receiptCode,
                Quser: {
                    x: chaves.chavePublicaX,
                    y: chaves.chavePublicaY
                }
            };

            let inicioVerificacaoPagamento = performance.now();

            fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(result => {

                    let fimVerificacaoPagamento = performance.now();
                    let tempoVerificacaoPagamento = ((fimVerificacaoPagamento - inicioVerificacaoPagamento) / 1000).toFixed(4) + " s";

                    temposExecucao["6 - Tempo Verificação Pagamento"] = tempoVerificacaoPagamento;
                    console.log("Tempo real Verificação Pagamento:", tempoVerificacaoPagamento);
                    localStorage.setItem(`tempos_${deployedContract.options.address}`, JSON.stringify(temposExecucao));

                    console.log("Resposta do servidor:", result);

                    if (!result) {
                        console.log("❌ Pagamento não encontrado.");
                    } else {

                        contractInfo.innerHTML += `<br>✅ Pagamento verificado com sucesso!<br>`;
                        //showStatusMessage("✅ Pagamento verificado com sucesso!", "success");

                        const info_user = {
                            IDuser: result.IDuser,
                            Kuser: chaves.chavePrivada,
                            Quser: {
                                x: chaves.chavePublicaX,
                                y: chaves.chavePublicaY
                            },
                            pagamento: {
                                addressContract: deployedContract.options.address,
                                receiptCode: receiptCode
                            }
                        };

                        console.log("Informações do usuário:", info_user);

                        baixarJSON(info_user);

                        contractInfo.innerHTML += `<br>✅ Informações de autenticação baixadas!<br>`;
                        //showStatusMessage("✅ Informações de autenticação baixadas!", "success");
                    }
                })
                .catch(error => {
                    console.error("Erro ao enviar requisição:", error);
                });

        } catch (error) {
            console.error(error);
            showStatusMessage("Erro durante o processo: " + error.message, "error");
        }
    });



});
