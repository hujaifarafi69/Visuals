// Circuit/js/ac.js
function initAC() {
    // All your drag & drop, toolbar setup, wiring, canvas resizing code here
    const workspace = document.getElementById('workspace');
    const wireCanvas = document.getElementById('wireCanvas');
    const graphCanvas = document.getElementById('graphCanvas');
    const wctx = wireCanvas.getContext('2d');
    const gctx = graphCanvas.getContext('2d');


// Circuit state
let components = [];
let wires = [];
let activePin = null;
let nextComponentId = 1;
let nextNodeId = 0;
const nodes = new Map(); // nodeId -> Set of connected pins

// Circuit parameters
const AC_AMPLITUDE = 5;
const AC_FREQUENCY = 1;
const RESISTOR_VALUE = 1000;
const DIODE_FORWARD_VOLTAGE = 0.7;

// Initialize
resizeCanvases();
setupToolbar();
setupWorkspace();

// ==================== CANVAS RESIZE ====================
function resizeCanvases() {
    wireCanvas.width = workspace.clientWidth;
    wireCanvas.height = workspace.clientHeight;
    graphCanvas.width = graphCanvas.parentElement.clientWidth;
    graphCanvas.height = graphCanvas.parentElement.clientHeight;
    drawWires();
    updateGraph();
}

window.addEventListener('resize', resizeCanvases);

// ==================== TOOLBAR ====================
function setupToolbar() {
    const toolbar = document.querySelector('.toolbar');
    
    // Setup drag for existing tools
    document.querySelectorAll('.tool').forEach(setupToolDrag);
    
    // Setup close buttons
    document.querySelectorAll('.tool-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tool = e.target.parentElement;
            if (toolbar.children.length > 1) {
                tool.remove();
            }
        });
    });
}

function setupToolDrag(tool) {
    tool.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('type', tool.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
    });
}

// ==================== WORKSPACE ====================
function setupWorkspace() {
    // Allow drops
    workspace.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    
    // Handle drops
    workspace.addEventListener('drop', (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        if (type) {
            createComponent(type, e.offsetX, e.offsetY);
        }
    });
    
    // Undo wiring with Ctrl+Z
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
            wires.pop();
            drawWires();
            updateNodes();
            updateGraph();
        }
    });
}

// ==================== COMPONENTS ====================
function createComponent(type, x, y) {
    const comp = document.createElement('div');
    comp.className = 'component';
    comp.id = `comp-${nextComponentId++}`;
    comp.dataset.type = type;
    
    // Set position
    comp.style.left = `${x - 50}px`; // Center on drop point
    comp.style.top = `${y - 30}px`;
    
    // Create content
    const content = document.createElement('div');
    content.className = 'component-content';
    
    switch (type) {
        case 'source':
            content.textContent = 'AC \n 5V 50Hz';
            comp.dataset.amplitude = AC_AMPLITUDE;
            comp.dataset.frequency = AC_FREQUENCY;
            break;
        case 'diode':
            content.textContent = 'Diode\n→';
            comp.dataset.forwardDrop = DIODE_FORWARD_VOLTAGE;
            comp.dataset.orientation = 'forward'; // Default orientation
            // Add double-click to flip diode
            content.addEventListener('dblclick', () => {
                flipDiode(comp);
            });
            break;
        case 'resistor':
            content.textContent = 'Resistor\n1kΩ';
            comp.dataset.resistance = RESISTOR_VALUE;
            break;
    }
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'component-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeComponent(comp);
    });
    
    // Assemble component
    comp.appendChild(content);
    addPins(comp);
    comp.appendChild(closeBtn);
    
    // Make draggable
    makeDraggable(comp);
    
    // Add to workspace
    workspace.appendChild(comp);
    components.push(comp);
    
    updateGraph();
}

// CONNECTION STATE UPDATE FOR DIODE//
function updateDiodeConnectionState(diode) {
    const pins = [...diode.querySelectorAll('.pin')];
    const connectedPins = pins.filter(pin => parseInt(pin.dataset.nodeId) !== -1);
    
    // Check which pin is connected to what
    diode.dataset.connectionState = 'floating';
    
    if (connectedPins.length === 2) {
        // Diode is connected on both ends
        diode.dataset.connectionState = 'series';
    } else if (connectedPins.length === 1) {
        // Only one pin connected
        diode.dataset.connectionState = 'single';
    }
    
    // For each connected pin, check what it's connected to
    connectedPins.forEach(pin => {
        const nodeId = parseInt(pin.dataset.nodeId);
        if (nodeId === -1) return;
        
        const connectedPinsInNode = nodes.get(nodeId) || new Set();
        const otherComponents = [];
        
        connectedPinsInNode.forEach(connectedPin => {
            if (connectedPin === pin) return;
            const comp = connectedPin.closest('.component');
            if (comp && comp !== diode) {
                otherComponents.push({
                    component: comp,
                    type: comp.dataset.type
                });
            }
        });
        
        // Store connection info
        pin.dataset.connectedTo = otherComponents.map(c => c.type).join(',');
    });
}
// Add this function to flip diode orientation
function flipDiode(diode) {
    const content = diode.querySelector('.component-content');
    const pins = diode.querySelectorAll('.pin');
    
    if (diode.dataset.orientation === 'forward') {
        content.textContent = 'Diode\n←';
        diode.dataset.orientation = 'reverse';
        
        // Swap pin markers when flipping
        pins[0].textContent = 'K';
        pins[0].dataset.diodeEnd = 'cathode';
        pins[1].textContent = 'A';
        pins[1].dataset.diodeEnd = 'anode';
    } else {
        content.textContent = 'Diode\n→';
        diode.dataset.orientation = 'forward';
        
        // Swap back
        pins[0].textContent = 'A';
        pins[0].dataset.diodeEnd = 'anode';
        pins[1].textContent = 'K';
        pins[1].dataset.diodeEnd = 'cathode';
    }
    
    // When flipping diode, we need to check how it's connected
    updateDiodeConnectionState(diode);
    updateGraph();
}

function addPins(comp) {
    const isDiode = comp.dataset.type === 'diode';
    
    ['left', 'right'].forEach(side => {
        const pin = document.createElement('div');
        pin.className = `pin ${side}`;
        pin.dataset.nodeId = '-1';
        
        // For diodes, mark pins as anode and cathode
        if (isDiode) {
            if (side === 'left') {
                pin.dataset.diodeEnd = 'anode';  // Left side is anode
                pin.textContent = 'A';  // Visual marker
            } else {
                pin.dataset.diodeEnd = 'cathode'; // Right side is cathode
                pin.textContent = 'K';  // Visual marker
            }
        }
        
        pin.addEventListener('click', (e) => {
            e.stopPropagation();
            handlePinClick(pin);
        });
        comp.appendChild(pin);
    });
}

function makeDraggable(comp) {
    let startX, startY, startLeft, startTop;
    
    comp.addEventListener('mousedown', (e) => {
        // Don't drag if clicking pin or close button
        if (e.target.classList.contains('pin') || 
            e.target.classList.contains('component-close')) {
            return;
        }
        
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(comp.style.left) || 0;
        startTop = parseInt(comp.style.top) || 0;
        
        comp.classList.add('dragging');
        
        function onMouseMove(e) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // Calculate new position with bounds
            const maxLeft = workspace.clientWidth - comp.offsetWidth;
            const maxTop = workspace.clientHeight - comp.offsetHeight;
            
            let newLeft = startLeft + dx;
            let newTop = startTop + dy;
            
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));
            
            comp.style.left = `${newLeft}px`;
            comp.style.top = `${newTop}px`;
            
            drawWires();
            updateNodes();
        }
        
        function onMouseUp() {
            comp.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            updateGraph();
        }
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function removeComponent(comp) {
    // Remove wires connected to this component
    const pins = [...comp.querySelectorAll('.pin')];
    wires = wires.filter(([pinA, pinB]) => {
        return !pins.includes(pinA) && !pins.includes(pinB);
    });
    
    // Remove component from array and DOM
    components = components.filter(c => c !== comp);
    comp.remove();
    
    // Update everything
    drawWires();
    updateNodes();
    updateGraph();
}

// ==================== WIRING ====================
function handlePinClick(pin) {
    // Reset all pin colors except connected ones
    document.querySelectorAll('.pin').forEach(p => {
        if (!p.classList.contains('connected')) {
            p.style.background = 'gold';
        }
        p.classList.remove('active');
    });
    
    if (!activePin) {
        // First pin clicked
        activePin = pin;
        pin.classList.add('active');
    } else {
        // Second pin clicked - create wire
        if (activePin !== pin) {
            // Check if wire already exists
            const wireExists = wires.some(([a, b]) => 
                (a === activePin && b === pin) || (a === pin && b === activePin)
            );
            
            if (!wireExists) {
                wires.push([activePin, pin]);
                drawWires();
                updateNodes();
                updateGraph();
            }
        }
        
        // Reset active pin
        activePin.classList.remove('active');
        activePin = null;
    }
}

function drawWires() {
    wctx.clearRect(0, 0, wireCanvas.width, wireCanvas.height);
    
    wires.forEach(([pinA, pinB]) => {
        const pointA = getPinConnectionPoint(pinA);
        const pointB = getPinConnectionPoint(pinB);
        
        // Determine wire color based on what's connected
        let wireColor = 'lime';
        
        // Check if either pin is part of a diode
        const compA = pinA.closest('.component');
        const compB = pinB.closest('.component');
        
        if (compA && compA.dataset.type === 'diode') {
            const isAnode = pinA.dataset.diodeEnd === 'anode';
            wireColor = isAnode ? '#ff6666' : '#6666ff'; // Red for anode, blue for cathode
        } else if (compB && compB.dataset.type === 'diode') {
            const isAnode = pinB.dataset.diodeEnd === 'anode';
            wireColor = isAnode ? '#ff6666' : '#6666ff';
        }
        
        // Draw wire
        wctx.beginPath();
        wctx.moveTo(pointA.x, pointA.y);
        wctx.lineTo(pointB.x, pointB.y);
        wctx.strokeStyle = wireColor;
        wctx.lineWidth = 3;
        wctx.stroke();
        
        // Draw connection points
        [pointA, pointB].forEach(point => {
            wctx.beginPath();
            wctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            wctx.fillStyle = wireColor;
            wctx.fill();
        });
    });
}

function getPinConnectionPoint(pin) {
    const rect = pin.getBoundingClientRect();
    const workspaceRect = workspace.getBoundingClientRect();
    
    let x, y;
    
    if (pin.classList.contains('left')) {
        x = rect.right - workspaceRect.left;
    } else {
        x = rect.left - workspaceRect.left;
    }
    
    y = rect.top + rect.height / 2 - workspaceRect.top;
    
    return { x, y };
}

// ==================== NODE MANAGEMENT ====================
function updateNodes() {
    // Clear previous nodes
    nodes.clear();
    
    // Build adjacency list
    const adjacency = new Map();
    wires.forEach(([pinA, pinB]) => {
        if (!adjacency.has(pinA)) adjacency.set(pinA, new Set());
        if (!adjacency.has(pinB)) adjacency.set(pinB, new Set());
        adjacency.get(pinA).add(pinB);
        adjacency.get(pinB).add(pinA);
    });
    
    // Reset all pins
    document.querySelectorAll('.pin').forEach(pin => {
        pin.dataset.nodeId = '-1';
        pin.classList.remove('connected');
        if (!pin.classList.contains('active')) {
            pin.style.background = 'gold';
        }
    });
    
    // Find connected components
    const visited = new Set();
    let currentNodeId = 0;
    
    document.querySelectorAll('.pin').forEach(pin => {
        if (visited.has(pin) || !adjacency.has(pin)) return;
        
        const queue = [pin];
        const componentPins = new Set();
        
        while (queue.length > 0) {
            const current = queue.shift();
            if (visited.has(current)) continue;
            
            visited.add(current);
            componentPins.add(current);
            current.dataset.nodeId = currentNodeId;
            current.classList.add('connected');
            current.style.background = 'limegreen';
            
            (adjacency.get(current) || []).forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    queue.push(neighbor);
                }
            });
        }
        
        if (componentPins.size > 0) {
            nodes.set(currentNodeId, componentPins);
            currentNodeId++;
        }
    });
    
    // ********** ADD THIS PART AT THE END **********
    // Update diode connection states
    components.filter(c => c.dataset.type === 'diode').forEach(updateDiodeConnectionState);
}

// ==================== CIRCUIT ANALYSIS ====================
function isCircuitComplete() {
    const source = components.find(c => c.dataset.type === 'source');
    if (!source) return false;
    
    const sourcePins = [...source.querySelectorAll('.pin')];
    const sourceConnectedPins = sourcePins.filter(pin => 
        wires.some(([a, b]) => a === pin || b === pin)
    );
    
    if (sourceConnectedPins.length < 2) return false;
    
    const otherComponents = components.filter(c => c.dataset.type !== 'source');
    if (otherComponents.length === 0) return false;
    
    // Check if at least one other component is connected
    for (const comp of otherComponents) {
        const pins = [...comp.querySelectorAll('.pin')];
        if (pins.some(pin => wires.some(([a, b]) => a === pin || b === pin))) {
            return true;
        }
    }
    
    return false;
}

function simulateOutputVoltage(time) {
    if (!isCircuitComplete()) return null;
    
    const sourceVoltage = AC_AMPLITUDE * Math.sin(2 * Math.PI * AC_FREQUENCY * time);
    
    // Check diode configuration
    const diodeConfig = analyzeDiodeConfiguration();
    
    if (!diodeConfig) {
        // No diode in circuit, just apply resistor effects
        const resistors = components.filter(c => 
            c.dataset.type === 'resistor' && 
            [...c.querySelectorAll('.pin')].some(p => parseInt(p.dataset.nodeId) !== -1)
        );
        return applyResistorDivider(sourceVoltage, resistors.length);
    }
    
    // Get resistor count
    const resistors = components.filter(c => 
        c.dataset.type === 'resistor' && 
        [...c.querySelectorAll('.pin')].some(p => parseInt(p.dataset.nodeId) !== -1)
    );
    
    // Diode behavior based on configuration
    let outputVoltage = 0;
    const { connectedToAnode, orientation } = diodeConfig;
    
    if (connectedToAnode) {
        // Source connected to anode
        if (orientation === 'forward') {
            // Forward diode with anode connected to positive
            if (sourceVoltage > DIODE_FORWARD_VOLTAGE) {
                outputVoltage = sourceVoltage - DIODE_FORWARD_VOLTAGE;
            }
            // Otherwise output is 0 (diode doesn't conduct)
        } else {
            // Reversed diode with anode connected to positive
            // This is actually cathode connected in reverse orientation
            if (sourceVoltage > DIODE_FORWARD_VOLTAGE) {
                outputVoltage = sourceVoltage - DIODE_FORWARD_VOLTAGE;
            }
        }
    } else {
        // Source connected to cathode
        if (orientation === 'forward') {
            // Forward diode with cathode connected to positive
            if (sourceVoltage < -DIODE_FORWARD_VOLTAGE) {
                outputVoltage = sourceVoltage + DIODE_FORWARD_VOLTAGE;
            }
        } else {
            // Reversed diode with cathode connected to positive
            // This is actually anode connected in reverse orientation
            if (sourceVoltage < -DIODE_FORWARD_VOLTAGE) {
                outputVoltage = sourceVoltage + DIODE_FORWARD_VOLTAGE;
            }
        }
    }
    
    // Apply resistor divider
    if (resistors.length > 0 && outputVoltage !== 0) {
        outputVoltage = applyResistorDivider(outputVoltage, resistors.length);
    }
    
    return outputVoltage;
}
function applyResistorDivider(voltage, resistorCount) {
    if (resistorCount === 0) return voltage;
    
    const totalResistance = resistorCount * RESISTOR_VALUE;
    const loadResistance = 1000; // Assume 1kΩ load
    const dividerRatio = loadResistance / (totalResistance + loadResistance);
    
    return voltage * dividerRatio;
}

function getComponentsInNode(nodeId) {
    if (nodeId === -1) return [];
    
    const nodePins = nodes.get(nodeId);
    if (!nodePins) return [];
    
    const componentsInNode = new Set();
    nodePins.forEach(pin => {
        const comp = pin.closest('.component');
        if (comp) {
            componentsInNode.add(comp);
        }
    });
    
    return Array.from(componentsInNode);
}

function applyResistorEffect(voltage, resistorCount) {
    if (resistorCount === 0) return voltage;
    
    const totalResistance = resistorCount * RESISTOR_VALUE;
    const loadResistance = 1000; // 1kΩ load
    const dividerRatio = loadResistance / (totalResistance + loadResistance);
    
    return voltage * dividerRatio;
}

function applyResistorDivider(voltage) {
    const resistors = components.filter(c => c.dataset.type === 'resistor');
    if (resistors.length === 0) return voltage;
    
    // Count connected resistors
    const connectedResistors = resistors.filter(resistor => {
        const pins = [...resistor.querySelectorAll('.pin')];
        return pins.some(pin => parseInt(pin.dataset.nodeId) !== -1);
    }).length;
    
    if (connectedResistors === 0) return voltage;
    
    const totalResistance = connectedResistors * RESISTOR_VALUE;
    const loadResistance = 1000; // Assume 1kΩ load
    const dividerRatio = loadResistance / (totalResistance + loadResistance);
    
    return voltage * dividerRatio;
}
function analyzeDiodeConfiguration() {
    const source = components.find(c => c.dataset.type === 'source');
    if (!source) return null;
    
    const sourcePins = [...source.querySelectorAll('.pin')];
    const sourceRightPin = sourcePins.find(p => p.classList.contains('right')); // Positive
    const sourceLeftPin = sourcePins.find(p => p.classList.contains('left'));   // Negative
    
    if (!sourceRightPin || !sourceLeftPin) return null;
    
    const rightNodeId = parseInt(sourceRightPin.dataset.nodeId);
    const leftNodeId = parseInt(sourceLeftPin.dataset.nodeId);
    
    if (rightNodeId === -1 || leftNodeId === -1) return null;
    
    // Find all diodes connected to the positive side
    const rightNodePins = nodes.get(rightNodeId) || new Set();
    const diodes = [];
    
    rightNodePins.forEach(pin => {
        const comp = pin.closest('.component');
        if (comp && comp.dataset.type === 'diode') {
            diodes.push({
                component: comp,
                connectedPin: pin,
                otherPin: [...comp.querySelectorAll('.pin')].find(p => p !== pin)
            });
        }
    });
    
    if (diodes.length === 0) return null;
    
    // Take the first diode (for now)
    const diode = diodes[0];
    const diodeComp = diode.component;
    const orientation = diodeComp.dataset.orientation || 'forward';
    const connectedPin = diode.connectedPin;
    const otherPin = diode.otherPin;
    
    // Determine if connected pin is anode or cathode
    let connectedToAnode = false;
    
    if (orientation === 'forward') {
        // Forward: left is anode, right is cathode
        connectedToAnode = connectedPin.classList.contains('left');
    } else {
        // Reverse: left is cathode, right is anode
        connectedToAnode = connectedPin.classList.contains('right');
    }
    
    // Check if other pin is connected to something
    const otherNodeId = parseInt(otherPin.dataset.nodeId);
    let hasCompletePath = false;
    
    if (otherNodeId !== -1) {
        // Check if this connects to the negative terminal
        if (otherNodeId === leftNodeId) {
            hasCompletePath = true;
        } else {
            // Check through connected components
            const otherNodePins = nodes.get(otherNodeId) || new Set();
            otherNodePins.forEach(pin => {
                const comp = pin.closest('.component');
                if (comp && comp.dataset.type === 'resistor') {
                    // Check resistor's other pin
                    const resistorOtherPin = [...comp.querySelectorAll('.pin')].find(p => p !== pin);
                    if (resistorOtherPin) {
                        const resistorOtherNodeId = parseInt(resistorOtherPin.dataset.nodeId);
                        if (resistorOtherNodeId === leftNodeId) {
                            hasCompletePath = true;
                        }
                    }
                }
            });
        }
    }
    
    return {
        diode: diodeComp,
        orientation: orientation,
        connectedToAnode: connectedToAnode,
        hasCompletePath: hasCompletePath,
        otherPinConnected: otherNodeId !== -1
    };
}
// Add this function to analyze the circuit
function analyzeCircuit() {
    const source = components.find(c => c.dataset.type === 'source');
    if (!source) return null;
    
    const sourcePins = [...source.querySelectorAll('.pin')];
    const positivePin = sourcePins.find(p => p.classList.contains('right'));
    const negativePin = sourcePins.find(p => p.classList.contains('left'));
    
    if (!positivePin || !negativePin) return null;
    
    const positiveNodeId = parseInt(positivePin.dataset.nodeId);
    const negativeNodeId = parseInt(negativePin.dataset.nodeId);
    
    // Find all components connected in series between positive and negative
    const visited = new Set();
    const seriesPath = [];
    
    function tracePath(currentNodeId, path) {
        if (visited.has(currentNodeId)) return;
        visited.add(currentNodeId);
        
        const nodePins = nodes.get(currentNodeId);
        if (!nodePins) return;
        
        // Check each component connected to this node
        for (const pin of nodePins) {
            const comp = pin.closest('.component');
            if (!comp || comp === source || path.includes(comp)) continue;
            
            // Get the other pin of this component
            const otherPin = [...comp.querySelectorAll('.pin')].find(p => p !== pin);
            if (!otherPin) continue;
            
            const otherNodeId = parseInt(otherPin.dataset.nodeId);
            if (otherNodeId === -1) continue;
            
            // If we reached the negative terminal, we found a complete path
            if (otherNodeId === negativeNodeId) {
                seriesPath.push(...path, comp);
                return true;
            }
            
            // Continue tracing
            if (tracePath(otherNodeId, [...path, comp])) {
                return true;
            }
        }
        
        return false;
    }
    
    tracePath(positiveNodeId, []);
    
    return {
        positiveNodeId,
        negativeNodeId,
        seriesPath: seriesPath,
        hasCompletePath: seriesPath.length > 0
    };
}

function applyResistorDivider(voltage) {
    // Count connected resistors
    const connectedResistors = components.filter(c => 
        c.dataset.type === 'resistor' && 
        [...c.querySelectorAll('.pin')].some(p => parseInt(p.dataset.nodeId) !== -1)
    ).length;
    
    if (connectedResistors === 0) return voltage;
    
    const totalSeriesResistance = connectedResistors * RESISTOR_VALUE;
    const loadResistance = 1000; // Assume 1kΩ load
    const dividerRatio = loadResistance / (totalSeriesResistance + loadResistance);
    
    return voltage * dividerRatio;
}

// ==================== GRAPH ====================
function updateGraph() {
    gctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw reference lines
    gctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    gctx.beginPath();
    gctx.moveTo(0, graphCanvas.height / 2);
    gctx.lineTo(graphCanvas.width, graphCanvas.height / 2);
    gctx.stroke();
    
    // Always draw AC source wave
    drawWave('#888', (x) => {
        const time = x * 0.05;
        return Math.sin(2 * Math.PI * AC_FREQUENCY * time);
    }, 1.5, 'AC Source');
    
    // Check circuit status
    const hasSource = components.some(c => c.dataset.type === 'source');
    const circuitComplete = isCircuitComplete();
    
    if (!hasSource) {
        showMessage('No AC Source in circuit');
        return;
    }
    
    if (!circuitComplete) {
        showMessage('Connect all components');
        return;
    }
    
    // Analyze circuit
    const diodeConfig = analyzeDiodeConfiguration();
    const resistors = components.filter(c => 
        c.dataset.type === 'resistor' && 
        [...c.querySelectorAll('.pin')].some(p => parseInt(p.dataset.nodeId) !== -1)
    );
    
    let label = 'Output';
    let color = '#0af';
    let waveInfo = '';
    
    if (diodeConfig) {
        const { connectedToAnode, orientation } = diodeConfig;
        
        if (connectedToAnode) {
            if (orientation === 'forward') {
                label = 'Half-wave (+) Rectified';
                color = '#0af'; // Blue
                waveInfo = 'Anode → Cathode | Positive half-wave';
            } else {
                label = 'Half-wave (+) Rectified';
                color = '#0af'; // Blue
                waveInfo = 'Anode ← Cathode | Positive half-wave (reversed)';
            }
        } else {
            if (orientation === 'forward') {
                label = 'Half-wave (-) Rectified';
                color = '#f0a'; // Pink
                waveInfo = 'Cathode → Anode | Negative half-wave';
            } else {
                label = 'Half-wave (-) Rectified';
                color = '#f0a'; // Pink
                waveInfo = 'Cathode ← Anode | Negative half-wave (reversed)';
            }
        }
        
        // Show forward voltage drop
        waveInfo += ` | Vf = ${DIODE_FORWARD_VOLTAGE}V`;
    }
    
    // Add resistor info
    if (resistors.length > 0) {
        if (waveInfo) waveInfo += ' | ';
        waveInfo += `${resistors.length} R`;
        
        const totalR = resistors.length * RESISTOR_VALUE;
        const loadR = 1000;
        const ratio = loadR / (totalR + loadR);
        const maxOutput = AC_AMPLITUDE * ratio;
        
        label += ` (${resistors.length}R - Max: ${maxOutput.toFixed(1)}V)`;
    }
    
    // Draw output wave
    const hasOutput = drawWave(color, (x) => {
        const time = x * 0.05;
        const voltage = simulateOutputVoltage(time);
        // Handle both positive and negative properly
        if (voltage === null) return null;
        
        // Scale for display (normalize to AC amplitude)
        const displayVoltage = voltage / AC_AMPLITUDE;
        
        // Ensure we show full wave shape
        return displayVoltage;
    }, 2, label);
    
    // Draw additional info
    if (waveInfo) {
        gctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        gctx.font = '11px Arial';
        gctx.textAlign = 'left';
        gctx.fillText(waveInfo, 10, 20);
    }
    
    // Draw zero line label
    gctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    gctx.font = '10px Arial';
    gctx.textAlign = 'left';
    gctx.fillText('0V', 10, graphCanvas.height / 2 + 12);
    
    // Draw voltage scale
    gctx.fillStyle = 'white';
    gctx.font = '12px Arial';
    gctx.textAlign = 'right';
    gctx.fillText(`${AC_AMPLITUDE}V`, graphCanvas.width - 10, 20);
    gctx.fillText(`-${AC_AMPLITUDE}V`, graphCanvas.width - 10, graphCanvas.height - 10);
}

// Add this function to highlight active components
function highlightActiveComponents() {
    // Clear previous highlights
    document.querySelectorAll('.component').forEach(comp => {
        comp.classList.remove('active-diode');
    });
    
    // Highlight components in the current path
    const path = traceCircuitPath();
    if (path) {
        path.forEach(segment => {
            if (segment.component.dataset.type === 'diode') {
                segment.component.classList.add('active-diode');
            }
        });
    }
}

// Call this whenever the circuit changes
function updateCircuit() {
    updateNodes();
    drawWires();
    highlightActiveComponents();
    updateGraph();
}

// Update all function calls to use updateCircuit instead
// Replace all calls to updateNodes() + drawWires() + updateGraph() with updateCircuit() 
// Add this function to trace the circuit from source to output
function traceCircuitPath() {
    const source = components.find(c => c.dataset.type === 'source');
    if (!source) return null;
    
    const sourcePins = [...source.querySelectorAll('.pin')];
    const sourceRightPin = sourcePins.find(p => p.classList.contains('right')); // Positive
    const sourceLeftPin = sourcePins.find(p => p.classList.contains('left'));   // Negative/GND
    
    if (!sourceRightPin || !sourceLeftPin) return null;
    
    const startNodeId = parseInt(sourceRightPin.dataset.nodeId);
    const endNodeId = parseInt(sourceLeftPin.dataset.nodeId);
    
    if (startNodeId === -1 || endNodeId === -1) return null;
    
    // Perform BFS to find path from source positive to negative
    const visited = new Set();
    const queue = [{ nodeId: startNodeId, path: [] }];
    
    while (queue.length > 0) {
        const { nodeId, path } = queue.shift();
        
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        
        // Check if we reached the negative terminal
        if (nodeId === endNodeId) {
            return path; // Return the components in the path
        }
        
        const nodePins = nodes.get(nodeId);
        if (!nodePins) continue;
        
        // Explore all connections from this node
        for (const pin of nodePins) {
            const comp = pin.closest('.component');
            if (!comp || comp === source) continue;
            
            // Skip if component already in path
            if (path.includes(comp)) continue;
            
            // Find the other pin of this component
            const otherPins = [...comp.querySelectorAll('.pin')].filter(p => p !== pin);
            
            for (const otherPin of otherPins) {
                const otherNodeId = parseInt(otherPin.dataset.nodeId);
                if (otherNodeId === -1) continue;
                
                queue.push({
                    nodeId: otherNodeId,
                    path: [...path, { component: comp, fromPin: pin, toPin: otherPin }]
                });
            }
        }
    }
    
    return null; // No complete path found
}

function drawGrid() {
    gctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    gctx.lineWidth = 1;
    
    // Horizontal lines
    for (let y = 0; y < graphCanvas.height; y += 20) {
        gctx.beginPath();
        gctx.moveTo(0, y);
        gctx.lineTo(graphCanvas.width, y);
        gctx.stroke();
    }
    
    // Vertical lines
    for (let x = 0; x < graphCanvas.width; x += 20) {
        gctx.beginPath();
        gctx.moveTo(x, 0);
        gctx.lineTo(x, graphCanvas.height);
        gctx.stroke();
    }
}

function drawWave(color, fn, lineWidth, label) {
    gctx.beginPath();
    let hasValidPoints = false;
    let lastX = 0;
    let lastY = 0;
    
    for (let x = 0; x < graphCanvas.width; x++) {
        const yValue = fn(x);
        
        if (yValue === null || yValue === undefined || isNaN(yValue)) {
            // Break the line if we have an invalid point
            if (hasValidPoints) {
                gctx.stroke();
                gctx.beginPath();
                hasValidPoints = false;
            }
            continue;
        }
        
        // Convert to graph coordinates
        // Center is at graphCanvas.height/2
        // Full scale is ±AC_AMPLITUDE, displayed as ±40 pixels
        const y = graphCanvas.height / 2 - yValue * 40;
        
        if (!hasValidPoints) {
            gctx.moveTo(x, y);
            hasValidPoints = true;
        } else {
            // Draw line from last point
            gctx.lineTo(x, y);
        }
        
        lastX = x;
        lastY = y;
    }
    
    if (hasValidPoints) {
        gctx.strokeStyle = color;
        gctx.lineWidth = lineWidth;
        gctx.stroke();
        
        // Draw label
        gctx.fillStyle = color;
        gctx.font = '12px Arial';
        gctx.textAlign = 'left';
        gctx.fillText(label, 10, graphCanvas.height - 10);
    }
    
    return hasValidPoints;
}

function showMessage(text) {
    gctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
    gctx.font = '14px Arial';
    gctx.textAlign = 'center';
    gctx.fillText(text, graphCanvas.width / 2, graphCanvas.height / 2);
}
}