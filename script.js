(function () {
    // Calculate position and velocity of the box
    var physics = (function () {
        // Initial condition for the system
        var initialConditions = {
            position: 1.0, // Box is shown on the top initially
            velocity: 0.0, // Velocity is zero
            springConstant: 100.0, // The higher the value the stiffer the spring
            mass: 10.0 // The mass of the box
        };

        // Current state of the system
        var state = {
            /*
            Position of the box:
              0 is when the box is at the center.
              1.0 is the maximum position to the top.
              -1.0 is the maximum position to the bottom.
            */
            position: 0,
            velocity: 0,
            springConstant: 0, // The higher the value the stiffer the spring
            mass: 0 // The mass of the box
        };

        var deltaT = 0.016; // The length of the time increment, in seconds.

        function resetStateToInitialConditions() {
            state.position = initialConditions.position;
            state.velocity = initialConditions.velocity;
            state.springConstant = initialConditions.springConstant;
            state.mass = initialConditions.mass;
        }

        // Returns acceleration (change of velocity) for the given position
        function calculateAcceleration(y) {
            // We are using the equation of motion for the harmonic oscillator:
            // a = -(k/m) * y
            // Where a is acceleration, y is displacement, k is spring constant, and m is mass.
            return -(state.springConstant / state.mass) * y;
        }

        // Calculates the new velocity: current velocity plus the change.
        function newVelocity(acceleration) {
            return state.velocity + deltaT * acceleration;
        }

        // Calculates the new position: current position plus the change.
        function newPosition() {
            return state.position + deltaT * state.velocity;
        }

        // The main function that is called on every animation frame.
        // It calculates and updates the current position of the box.
        // function updatePosition() {
        //     var acceleration = calculateAcceleration(state.position);
        //     state.velocity = newVelocity(acceleration);
        //     state.position = newPosition();
        //     if (state.position > 1) { state.position = 1; }
        //     if (state.position < -1) { state.position = -1; }
        // }
        function updatePosition() {
            var acceleration = calculateAcceleration(state.position);
            state.velocity = newVelocity(acceleration);
            state.position = newPosition();

            // Adjust the limits for oscillation between 1 and 0
            if (state.position > 0.9) {
                state.position = 0.9;
                state.velocity = -state.velocity; // Reverse velocity to change direction
            }
            if (state.position < 0) {
                state.position = 0;
                state.velocity = -state.velocity; // Reverse velocity to change direction
            }
        }

        return {
            resetStateToInitialConditions: resetStateToInitialConditions,
            updatePosition: updatePosition,
            initialConditions: initialConditions,
            state: state,
        };
    })();

    // Draw the scene
    var graphics = (function () {
        var canvas = null, // Canvas DOM element.
            context = null, // Canvas context for drawing.
            canvasWidth = 520 * 0.65,
            canvasHeight = 550 * 0.65, // Adjusted canvas height
            boxSize = 50,
            springInfo = {
                width: 30, // Adjusted spring width
                numberOfSegments: 20 // Number of segments in the spring.
            },
            colors = {
                shade30: "#108D7B",
                shade40: "#108D7B",
                shade50: "#30D4BC"
            };

        // Return the middle Y position of the box
        function boxMiddleY(position) {
            var boxSpaceHeight = canvasHeight - boxSize;
            return boxSpaceHeight * (position + 1) / 2 + boxSize ;
        }

        // Draw spring from the box to the center. Position argument is the box position and varies from -1 to 1.
        // Value 0 corresponds to the central position, while -1 and 1 are the left and right respectively.
        function drawSpring(position) {
            var springEndY = boxMiddleY(position),
                springTopX = (canvasWidth - springInfo.width) / 2,
                springEndX = canvasWidth / 2,
                canvasMiddleY = canvasHeight / 2,
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

        // Draw a box at position. Position is a value from -1 to 1.
        // Value 0 corresponds to the central position, while -1 and 1 are the left and right respectively.
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

        // Draw horizontal line in the middle
        function drawMiddleLine() {
            var middleY = Math.floor(canvasHeight / 2);

            context.beginPath();
            context.moveTo(0, middleY);
            context.lineTo(canvasWidth, middleY);
            context.lineWidth = 2;
            context.strokeStyle = colors.shade40;
            context.setLineDash([2, 3]);
            context.stroke();
            context.setLineDash([1, 0]);
        }

        // Clears everything and draws the whole scene: the line, spring, and the box.
        function drawScene(position) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            drawMiddleLine();
            drawSpring(position);
            drawBox(position);
        }

        function hideCanvasNotSupportedMessage() {
            document.getElementById("HarmonicOscillator-notSupportedMessage").style.display = 'none';
        }

        // Resize canvas to fill the width of the container
        function fitToContainer() {
            canvas.style.width = '100%';
            canvas.style.height = canvasHeight + 'px';
            canvas.width = canvas.offsetWidth * 0.5;
            canvas.height = canvas.offsetHeight * 1.1;
        }

        // Create canvas for drawing and call success argument
        function init(success) {
            // Find the canvas HTML element
            canvas = document.querySelector(".HarmonicOscillator-canvas");

            // Check if the browser supports canvas drawing
            if (!(window.requestAnimationFrame && canvas && canvas.getContext)) { return; }

            // Get canvas context for drawing
            context = canvas.getContext("2d");
            if (!context) { return; } // Error, the browser does not support canvas

            // If we got to this point it means the browser can draw
            // Hide the old browser message
            hideCanvasNotSupportedMessage();

            // Update the size of the canvas
            fitToContainer();

            // Execute success callback function
            success();
        }

        return {
            fitToContainer: fitToContainer,
            drawScene: drawScene,
            init: init
        };
    })();

    // Draw scene
    // graphics.drawScene(1);

    // Start the simulation
    var simulation = (function () {
        // The method is called 60 times per second
        function animate() {
            physics.updatePosition();
            graphics.drawScene(physics.state.position);
            window.requestAnimationFrame(animate);
        }

        function start() {
            graphics.init(function () {
                // Use the initial conditions for the simulation
                physics.resetStateToInitialConditions();

                // Redraw the scene if the page is resized
                window.addEventListener('resize', function (event) {
                    graphics.fitToContainer();
                    graphics.drawScene(physics.state.position);
                });

                // Start the animation sequence
                animate();
            });
        }

        return {
            start: start
        };
    })();

    simulation.start();
    // Get input for the mass and the spring constant from the user
    var userInput = (function () {
        // Update mass and spring constant with selected values
        function updateSimulation(massInput, springConstantInput) {
            physics.resetStateToInitialConditions();
            physics.state.mass = parseFloat(massInput.value) || physics.initialConditions.mass;
            physics.state.springConstant = parseFloat(springConstantInput.value) || physics.initialConditions.springConstant;
        }

        function init() {
            // Mass
            // -----------

            var massInput = document.getElementById("HarmonicOscillator-mass");

            // Set initial mass value
            massInput.value = physics.initialConditions.mass;

            // User updates mass in the simulation
            massInput.addEventListener('input', function () {
                updateSimulation(massInput, springConstantInput);
            });

            // Spring constant
            // -----------

            var springConstantInput = document.getElementById("HarmonicOscillator-springConstant");

            // Set initial spring constant value
            springConstantInput.value = physics.initialConditions.springConstant;

            // User updates spring constant in the simulation
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
