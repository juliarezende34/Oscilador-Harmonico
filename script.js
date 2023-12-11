(function () {
    // Calcula velocidade e posição
    var physics = (function () {
        // ondições iniciais
        var initialConditions = {
            position: 1.0, // A caixa é mostrada no topo inicialmente
            velocity: 0.0, // Velocidade
            springConstant: 100.0, // Quanto maior o valor, mais rígida é a mola
            mass: 10.0 // A massa do bloco
        };

        //Estado atual do sistema
        var state = {
            /*
            Position of the box:
              0 is when the box is at the center.
              1.0 is the maximum position to the top.
              -1.0 is the maximum position to the bottom.
            */
            position: 0,
            velocity: 0,
            springConstant: 0,
            mass: 0
        };

        var deltaT = 0.016; // A duração do incremento de tempo, em segundos.

        function resetStateToInitialConditions() {
            state.position = initialConditions.position;
            state.velocity = initialConditions.velocity;
            state.springConstant = initialConditions.springConstant;
            state.mass = initialConditions.mass;
        }

        // Retorna a aceleração (mudança de velocidade) para a posição dada
        function calculateAcceleration(y) {
            // Estamos usando a equação de movimento para o oscilador harmônico:
            // a = -(k/m) * y
            // Onde a é a aceleração, y é o deslocamento, k é a constante da mola e m é a massa.
            return -(state.springConstant / state.mass) * y;
        }
        //Calcula a nova velocidade: velocidade atual mais a mudança.
        function newVelocity(acceleration) {
            return state.velocity + deltaT * acceleration;
        }

        //Calcula a nova posição: posição atual mais a alteração.
        function newPosition() {
            return state.position + deltaT * state.velocity;
        }

        function updatePosition() {
            var acceleration = calculateAcceleration(state.position);
            state.velocity = newVelocity(acceleration);
            state.position = newPosition();
            //Ajusta os limites para oscilação entre 1 e 0
            if (state.position > 0.9) {
                state.position = 0.9;
                state.velocity = -state.velocity; //Velocidade reversa para mudar de direção
            }
            if (state.position < 0) {
                state.position = 0;
                state.velocity = -state.velocity; //Velocidade reversa para mudar de direção
            }
        }

        return {
            resetStateToInitialConditions: resetStateToInitialConditions,
            updatePosition: updatePosition,
            initialConditions: initialConditions,
            state: state,
        };
    })();

    // desenhar a posição visual da mola
    var graphics = (function () {
        var canvas = null, // Canvas DOM element.
            context = null, // Canvas context for drawing.
            canvasWidth = 520 * 0.5,
            canvasHeight = 550 * 0.5, // Altura da tela ajustada
            boxSize = 50,
            springInfo = {
                width: 30, // Largura da mola ajustada
                numberOfSegments: 20 //// Número de segmentos
            },
            colors = {
                shade30: "#108D7B",
                shade40: "#108D7B",
                shade50: "#30D4BC"
            };
        //Retorna a posição Y do meio da caixa
        function boxMiddleY(position) {
            var boxSpaceHeight = canvasHeight - boxSize;
            return boxSpaceHeight * (position + 1) / 2 + boxSize;
        }
        // Desenhe a mola da caixa para o centro. O argumento de posição é a posição da caixa e varia de -1 a 1.
        // O valor 0 corresponde à posição central, enquanto -1 e 1 são à esquerda e à direita respectivamente.
        function drawSpring(position) {
            var springEndY = boxMiddleY(position),
                springTopX = (canvasWidth - springInfo.width) / 2,
                springEndX = canvasWidth / 2,
                canvasMiddleY = 0,
                singleSegmentHeight = (canvasMiddleY - springEndY) / (springInfo.numberOfSegments - 1),
                springGoesRight = true;

            context.beginPath();
            context.lineWidth = 1;
            context.strokeStyle = colors.shade40;
            context.moveTo(springTopX, springEndY);

            for (var i = 0; i < springInfo.numberOfSegments; i++) {
                var currentSegmentHeight = singleSegmentHeight;
                if (i === 0 || i === springInfo.numberOfSegments - 1) { currentSegmentHeight /= 2; }

                springEndY += currentSegmentHeight;
                springEndX = springTopX;
                if (!springGoesRight) { springEndX += springInfo.width; }
                if (i === springInfo.numberOfSegments - 1) { springEndX = canvasWidth / 2; }

                context.lineTo(springEndX, springEndY);
                springGoesRight = !springGoesRight;
            }

            context.stroke();
        }
        // Desenha uma caixa na posição. Posição é um valor de -1 a 1.
        // O valor 0 corresponde à posição central, enquanto -1 e 1 são à esquerda e à direita respectivamente.
        function drawBox(position) {
            var boxLeftX = Math.floor((canvasWidth - boxSize) / 2);
            var startY = boxMiddleY(position) - boxSize / 2;

            // Rectangle
            context.beginPath();
            context.fillStyle = colors.shade50;
            context.fillRect(boxLeftX, startY, boxSize, boxSize);

            // Border around rectangle
            context.beginPath();
            context.lineWidth = 1;
            context.strokeStyle = colors.shade30;
            context.strokeRect(boxLeftX + 0.5, startY + 0.5, boxSize - 1, boxSize - 1);
        }

        //Desenha uma linha horizontal no meio
        function drawMiddleLine() {
            var middleY = Math.floor(0);

            context.beginPath();
            context.moveTo(0, middleY);
            context.lineTo(canvasWidth, middleY);
            context.lineWidth = 2;
            context.strokeStyle = colors.shade40;
            context.setLineDash([2, 3]);
            context.stroke();
            context.setLineDash([1, 0]);
        }
        // Limpa tudo e desenha toda a cena: a linha, a mola e a caixa.
        function drawScene(position) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            drawMiddleLine();
            drawSpring(position);
            drawBox(position);
        }

        function hideCanvasNotSupportedMessage() {
            document.getElementById("HarmonicOscillator-notSupportedMessage").style.display = 'none';
        }
        // Redimensiona a tela para preencher a largura do contêiner
        function fitToContainer() {
            canvas.style.width = '100%';
            canvas.style.height = canvasHeight + 'px';
            canvas.width = canvas.offsetWidth * 0.5;
            canvas.height = canvas.offsetHeight * 1.1;
        }

        // Cria uma tela para desenho e chama o argumento de sucesso
        function init(success) {
            //Encontre o elemento HTML da tela
            canvas = document.querySelector(".HarmonicOscillator-canvas");

            // Verifica se o navegador suporta desenho em tela
            if (!(window.requestAnimationFrame && canvas && canvas.getContext)) { return; }

            // Obtém o contexto da tela para desenho
            context = canvas.getContext("2d");
            if (!context) { return; } // Error, the browser does not support canvas

            // Se chegamos a este ponto significa que o navegador pode desenhar
            //Oculta a mensagem antiga do navegador
            hideCanvasNotSupportedMessage();

            //Atualiza o tamanho da tela
            fitToContainer();

            //Executa a função de retorno de sucesso
            success();
        }

        return {
            fitToContainer: fitToContainer,
            drawScene: drawScene,
            init: init
        };
    })();


    // Inicia a simulação
    var simulation = (function () {
        // O método é chamado 60 vezes por segundo
        function animate() {
            physics.updatePosition();
            graphics.drawScene(physics.state.position);
            window.requestAnimationFrame(animate);
        }

        function start() {
            graphics.init(function () {
                //Use as condições iniciais para a simulação
                physics.resetStateToInitialConditions();

                // Redesenhe a cena se a página for redimensionada
                window.addEventListener('resize', function (event) {
                    graphics.fitToContainer();
                    graphics.drawScene(physics.state.position);
                });

                // Inicia a sequência de animação
                animate();
            });
        }

        return {
            start: start
        };
    })();

    simulation.start();
    // Obtém informações do usuário para a massa e a constante de mola
    var userInput = (function () {
        //Atualiza massa e constante de mola com valores selecionados
        function updateSimulation(massInput, springConstantInput) {
            physics.resetStateToInitialConditions();
            physics.state.mass = parseFloat(massInput.value) || physics.initialConditions.mass;
            physics.state.springConstant = parseFloat(springConstantInput.value) || physics.initialConditions.springConstant;
        }

        function init() {
            // Mass 

            var massInput = document.getElementById("HarmonicOscillator-mass");

            // Define o valor da massa inicial
            massInput.value = physics.initialConditions.mass;

            //O usuário atualiza em massa na simulação
            massInput.addEventListener('input', function () {
                updateSimulation(massInput, springConstantInput);
            });

            // Spring constant

            var springConstantInput = document.getElementById("HarmonicOscillator-springConstant");

            // Define o valor inicial da constante da mola
            springConstantInput.value = physics.initialConditions.springConstant;

            //O usuário atualiza a constante de primavera na simulação
            springConstantInput.addEventListener('input', function () {
                updateSimulation(massInput, springConstantInput);
            });
        }

        return {
            init: init
        };
    })();

    userInput.init();
})();
