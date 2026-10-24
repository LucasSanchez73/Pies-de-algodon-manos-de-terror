// ==========================================
// ESTADOS DEL JUEGO Y VARIABLES DE MENÚ
// ==========================================
let currentScene = "MENU"; // "MENU", "LEVEL_INTRO", "GAME", "LEVEL_COMPLETE", "OPTIONS", "CREDITS", "GAMEOVER", "VICTORY"
let menuBgImg;
let menuButtons = [];

// ==========================================
// CONFIGURACIÓN Y VARIABLES DEL JUEGO
// ==========================================
let score = 0;
let catLives = 7;
let timeLeft = 30;
let level = 1;
let timerCounter = 0;

let soundEnabled = true;
let difficulty = "violento"; // "mimoso", "violento", "endemoniado"

// Control de aparición de corazón por nivel (máximo 1)
let heartSpawnedThisLevel = false;

// Teclas personalizables para los 5 carriles
let slotKeys = ['q', 'w', 'e', 'r', 't'];
let remappingIndex = null; 

// Elementos de la mesa
let slotsX = [];
let tableObjects = []; 
let feedbackEffects = []; 
let pawAnimations = [];   

let spawnTimer = 0;
let spawnInterval = 45; 

// Assets de Sonido / Audio y Secuenciadores
let osc, noiseGen, env;
let musicStep = 0;
let musicTimer = 0;
let meowTimer = 0;

// ==========================================
// PRELOAD
// ==========================================
function preload() {
    try {
        menuBgImg = loadImage('menu_bg.png', () => {}, () => { menuBgImg = null; });
    } catch(e) {
        menuBgImg = null;
    }
}

// ==========================================
// SETUP (Pantalla completa / Responsive)
// ==========================================
function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent("game-container");
    noSmooth();

    // Configurar sintetizadores de audio
    osc = new p5.Oscillator("sine");
    osc.start();
    osc.amp(0);

    noiseGen = new p5.Noise();
    noiseGen.start();
    noiseGen.amp(0);

    env = new p5.Envelope();
    env.setADSR(0.01, 0.08, 0.1, 0.05);
    env.setRange(0.4, 0);

    actualizarLayout();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    actualizarLayout();
}

function actualizarLayout() {
    let btnW = 260;
    let btnH = 45;
    let btnX = width / 2 - btnW / 2;
    let startY = height / 2 + 10;

    menuButtons = [
        { id: "START",   x: btnX, y: startY,       w: btnW, h: btnH, label: "Empezar el caos" },
        { id: "OPTIONS", x: btnX, y: startY + 60,  w: btnW, h: btnH, label: "Opciones" },
        { id: "CREDITS", x: btnX, y: startY + 120, w: btnW, h: btnH, label: "Créditos" }
    ];

    slotsX = [];
    let spacing = width / 6;
    for (let i = 1; i <= 5; i++) {
        slotsX.push(spacing * i);
    }
}

// ==========================================
// BUCLE PRINCIPAL (DRAW)
// ==========================================
function draw() {
    background(11, 15, 25);

    updateBackgroundMusic();

    if (currentScene === "MENU") {
        drawMenuScene();
    } else if (currentScene === "LEVEL_INTRO") {
        drawGameScene(); 
        drawLevelIntroModal();
    } else if (currentScene === "GAME") {
        drawGameScene();
        updateGameLogic();
    } else if (currentScene === "LEVEL_COMPLETE") {
        drawGameScene(); 
        drawLevelCompleteModal();
    } else if (currentScene === "OPTIONS") {
        drawOptionsScene();
    } else if (currentScene === "CREDITS") {
        drawCreditsScene();
    } else if (currentScene === "GAMEOVER") {
        drawGameOverScene();
    } else if (currentScene === "VICTORY") {
        drawVictoryScene();
    }
}

// ==========================================
// SCENE: MENÚ PRINCIPAL
// ==========================================
function drawMenuScene() {
    if (menuBgImg) {
        image(menuBgImg, 0, 0, width, height);
    } else {
        background(15, 18, 25);
        textAlign(CENTER, CENTER);
        textFont("Georgia");
        fill(255);
        textSize(32);
        text("Pies de Algodón, Manos de Terror", width / 2, height / 3);
    }

    for (let btn of menuButtons) {
        let isHover = mouseX >= btn.x && mouseX <= btn.x + btn.w &&
                      mouseY >= btn.y && mouseY <= btn.y + btn.h;

        push();
        translate(btn.x, btn.y);

        stroke(isHover ? "#ff3355" : "#55333d");
        strokeWeight(2);
        fill(isHover ? color(35, 10, 15, 240) : color(18, 12, 16, 220));
        rect(0, 0, btn.w, btn.h, 8);

        stroke(isHover ? "#ff6688" : "#331d24");
        strokeWeight(1);
        noFill();
        rect(4, 4, btn.w - 8, btn.h - 8, 6);

        noStroke();
        fill(isHover ? "#ffffff" : "#d0c0c5");
        textFont("Trebuchet MS");
        textSize(16);
        textStyle(BOLD);
        textAlign(CENTER, CENTER);
        text(btn.label, btn.w / 2, btn.h / 2);

        pop();
    }
}

// ==========================================
// RENDERIZADO DEL JUEGO (MESA Y OBJETOS)
// ==========================================
function drawGameScene() {
    background(14, 18, 26);
    noStroke();
    fill(255, 255, 255, 3);
    rect(0, 0, width, height);

    let tableY = height * 0.40; 
    let tableH = height * 0.65;
    
    fill(38, 24, 16);
    noStroke();
    rect(0, tableY, width, tableH);

    stroke(28, 17, 11);
    strokeWeight(3);
    for (let vy = tableY + 30; vy < height; vy += 50) {
        line(0, vy, width, vy + sin(vy) * 10);
    }

    noStroke();
    fill(55, 35, 24);
    rect(0, tableY, width, 24); 
    
    stroke(100, 65, 45);
    strokeWeight(3);
    line(0, tableY, width, tableY); 
    stroke(15, 8, 5);
    line(0, tableY + 24, width, tableY + 24); 

    fill(20, 11, 7);
    noStroke();
    rect(width * 0.12, tableY + 24, 60, height - (tableY + 24));
    rect(width * 0.82, tableY + 24, 60, height - (tableY + 24));

    for (let i = 0; i < 5; i++) {
        let x = slotsX[i];
        let y = tableY + 100;

        stroke(255, 50, 85, 90);
        strokeWeight(3);
        noFill();
        ellipse(x, y + 60, 90, 45);

        noStroke();
        fill(255, 150, 170, 220);
        textFont("Courier New");
        textSize(26);
        textStyle(BOLD);
        textAlign(CENTER, CENTER);
        text("[" + slotKeys[i].toUpperCase() + "]", x, y - 10);
    }

    for (let i = 0; i < tableObjects.length; i++) {
        let obj = tableObjects[i];
        let x = slotsX[obj.slot];
        let y = tableY + 110;

        push();
        translate(x, y);
        scale(2.2); 
        noStroke();

        if (obj.type === "Taza") {
            fill(0, 0, 0, 100);
            ellipse(0, 22, 32, 10);
            fill(225, 210, 190);
            rect(-15, -12, 30, 36, 6);
            fill(200, 185, 165);
            rect(-15, 10, 30, 14, 3);
            noFill();
            stroke(225, 210, 190);
            strokeWeight(4);
            arc(15, -1, 14, 20, -HALF_PI, HALF_PI);
        } else if (obj.type === "Florero") {
            fill(0, 0, 0, 100);
            noStroke();
            ellipse(0, 25, 36, 12);
            fill(190, 205, 220);
            beginShape();
            vertex(-14, 22);
            vertex(14, 22);
            vertex(10, -5);
            vertex(18, -25);
            vertex(-18, -25);
            vertex(-8, -10);
            endShape(CLOSE);
            fill(120, 20, 40);
            ellipse(0, -32, 14, 14);
            ellipse(-6, -28, 10, 10);
            ellipse(6, -28, 10, 10);
        } else if (obj.type === "Libro") {
            fill(0, 0, 0, 100);
            noStroke();
            ellipse(0, 18, 42, 14);
            fill(160, 40, 50);
            rect(-20, -10, 40, 26, 3);
            fill(245, 240, 230);
            rect(-17, -7, 34, 20);
            stroke(200, 190, 180);
            strokeWeight(1);
            line(0, -7, 0, 13);
        } else if (obj.type === "Corazon") {
            fill(0, 0, 0, 100);
            ellipse(0, 20, 24, 10);
            fill(255, 40, 90);
            beginShape();
            vertex(0, 15);
            bezierVertex(-15, 0, -20, -15, 0, -20);
            bezierVertex(20, -15, 15, 0, 0, 15);
            endShape(CLOSE);
        }
        pop();
    }

    for (let i = feedbackEffects.length - 1; i >= 0; i--) {
        let fx = feedbackEffects[i];
        push();
        translate(fx.x, fx.y);
        textSize(fx.size || 64);
        textAlign(CENTER, CENTER);
        textFont("Courier New");
        textStyle(BOLD);
        if (fx.type === "SUCCESS") {
            fill(0, 255, 120, fx.alpha);
            text("✔", 0, -10);
        } else if (fx.type === "HEART") {
            fill(255, 50, 120, fx.alpha);
            text("+1 ❤️", 0, -10);
        } else {
            fill(255, 50, 50, fx.alpha);
            text("✖", 0, -10);
        }
        pop();
        fx.alpha -= 10;
        fx.y -= 1.5;
        if (fx.alpha <= 0) {
            feedbackEffects.splice(i, 1);
        }
    }

    for (let i = pawAnimations.length - 1; i >= 0; i--) {
        let paw = pawAnimations[i];
        push();
        translate(paw.x, paw.y - paw.progress);
        
        fill(25, 22, 28);
        stroke(60, 50, 65);
        strokeWeight(3);
        ellipse(0, 0, 75, 60); 

        fill(35, 30, 38);
        ellipse(-20, 22, 22, 22);
        ellipse(0, 26, 24, 24);
        ellipse(20, 22, 22, 22);

        noStroke();
        fill(180, 80, 110);
        ellipse(0, 8, 30, 20);
        ellipse(-18, 25, 12, 10);
        ellipse(0, 29, 13, 10);
        ellipse(18, 25, 12, 10);

        stroke(255, 0, 60);
        strokeWeight(4);
        fill(255, 200, 220);
        beginShape();
        vertex(-24, 28);
        bezierVertex(-32, 38, -28, 48, -35, 52);
        endShape();
        beginShape();
        vertex(0, 34);
        bezierVertex(0, 44, -4, 52, 0, 58);
        endShape();
        beginShape();
        vertex(24, 28);
        bezierVertex(32, 38, 28, 48, 35, 52);
        endShape();

        pop();

        paw.progress += 6;
        paw.life--;
        if (paw.life <= 0) {
            pawAnimations.splice(i, 1);
        }
    }

    noStroke();
    fill("#00ffcc");
    textFont("Courier New");
    textSize(16);
    textAlign(LEFT, TOP);
    text("OBJETOS TIRADOS: " + score, 30, 25);
    text("NIVEL: " + level, 30, 50);
    
    fill("#ff3355");
    text("VIDAS: " + "❤️ ".repeat(catLives), 30, 75);

    fill("#ffcc00");
    text("TIEMPO: " + timeLeft + "s", width - 200, 25);

    drawBackButton(width - 150, 65, 120, 36, "MENÚ");
}

function updateGameLogic() {
    let baseInterval = 45;
    if (difficulty === "mimoso") baseInterval = 75;
    else if (difficulty === "violento") baseInterval = 45;
    else if (difficulty === "endemoniado") baseInterval = 20;

    if (difficulty !== "endemoniado") {
        spawnInterval = max(15, baseInterval - ((level - 1) * 5));
    } else {
        spawnInterval = baseInterval;
    }

    timerCounter++;
    if (timerCounter >= 60) {
        timerCounter = 0;
        if (timeLeft > 0) {
            timeLeft--;
            if (timeLeft <= 0) {
                if (difficulty === "endemoniado" && level >= 4) {
                    currentScene = "VICTORY";
                } else {
                    currentScene = "LEVEL_COMPLETE";
                }
            }
        }
    }

    // Generar objetos asegurando máximo 1 corazón en el nivel 3
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;
        let slotIndex = floor(random(5));
        let existe = tableObjects.some(obj => obj.slot === slotIndex);
        if (!existe) {
            let tipo = "Taza";
            let rand = random(100);

            if (level === 3 && !heartSpawnedThisLevel && rand < 30) {
                tipo = "Corazon"; 
                heartSpawnedThisLevel = true; 
            } else {
                let tiposBasicos = ["Taza", "Florero", "Libro"];
                tipo = random(tiposBasicos);
            }

            tableObjects.push({
                slot: slotIndex,
                type: tipo,
                life: 1.0 
            });
        }
    }

    // Descomposición de objetos en la mesa
    let decayRate = difficulty === "endemoniado" ? 0.018 : (difficulty === "violento" ? 0.012 : 0.008);
    let tableY = height * 0.40;
    for (let i = tableObjects.length - 1; i >= 0; i--) {
        let obj = tableObjects[i];
        obj.life -= decayRate;

        if (obj.life <= 0) {
            let slotIdx = obj.slot;
            let objType = obj.type;
            tableObjects.splice(i, 1);

            // Si el objeto cae y no se toca, resta vida solo si es básico (Taza, Florero, Libro)
            if (objType === "Taza" || objType === "Florero" || objType === "Libro") {
                catLives--;
                playErrorSound();
                
                feedbackEffects.push({
                    x: slotsX[slotIdx],
                    y: tableY + 110,
                    type: "ERROR",
                    alpha: 255
                });

                if (catLives <= 0) {
                    currentScene = "GAMEOVER";
                }
            }
        }
    }
}

// ==========================================
// MODALES CON CONTENIDO ESPECÍFICO POR NIVEL
// ==========================================
function drawLevelIntroModal() {
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);

    drawDarkPanel("NUEVO NIVEL", 620, 420);
    let panelY = height / 2 - 210;

    textAlign(CENTER, CENTER);
    fill("#ff3355");
    textSize(30);
    textStyle(BOLD);
    text("~ NIVEL " + level + " ~", width / 2, panelY + 65);
    
    fill(25, 15, 25);
    stroke(255, 50, 100);
    strokeWeight(2);
    rect(width / 2 - 260, panelY + 90, 520, 135, 8);

    noStroke();
    
    if (level === 3) {
        fill("#ff3399");
        textSize(16);
        textStyle(BOLD);
        text("✨ ¡MECÁNICA NUEVA: CORAZÓN! ✨", width / 2, panelY + 112);
        fill(255);
        textSize(13);
        text("En este Nivel 3 aparecerá exactamente\n1 CORAZÓN (❤️) en la mesa. ¡Aciértale a su tecla\npara recuperar +1 vida de salud!", width / 2, panelY + 158);
    } else {
        fill("#00ffcc");
        textSize(15);
        textStyle(BOLD);
        text("¡Alista tus garras!", width / 2, panelY + 125);
        fill(220);
        textSize(14);
        text("Mantén el ritmo y hace caer los objetos.", width / 2, panelY + 165);
    }
    
    fill("#00ffcc");
    textSize(13);
    textStyle(NORMAL);
    text("Teclas asignadas: " + slotKeys.join(' - ').toUpperCase(), width / 2, panelY + 260);

    if (drawButtonCustom(width / 2 - 110, panelY + 310, 220, 45, "¡COMENZAR NIVEL!")) {
        timeLeft = 30;
        tableObjects = [];
        heartSpawnedThisLevel = false; 
        currentScene = "GAME";
    }
}

function drawLevelCompleteModal() {
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);

    drawDarkPanel("¡NIVEL SUPERADO!", 500, 320);
    let panelY = height / 2 - 160;

    textAlign(CENTER, CENTER);
    fill("#00ffcc");
    textSize(24);
    text("¡Excelente caos felino!", width / 2, panelY + 90);
    
    fill(220);
    textSize(14);
    text("Objetos destruidos hasta ahora: " + score, width / 2, panelY + 135);
    text("¡Avanzando al siguiente nivel!", width / 2, panelY + 175);

    if (drawButtonCustom(width / 2 - 100, panelY + 230, 200, 40, "SIGUIENTE NIVEL")) {
        level++;
        timeLeft = 30;
        tableObjects = [];
        currentScene = "LEVEL_INTRO";
    }
}

// ==========================================
// SCENE: OPCIONES
// ==========================================
function drawOptionsScene() {
    background(15, 18, 26);
    drawDarkPanel("OPCIONES DEL CAOS", 560, 440);

    let panelW = 560;
    let panelH = 440;
    let panelX = width / 2 - panelW / 2;
    let panelY = height / 2 - panelH / 2;

    textAlign(CENTER, CENTER);
    textFont("Courier New");
    fill(220);
    textSize(14);

    text("Efectos de Sonido:", width / 2, panelY + 75);
    fill(soundEnabled ? "#00ffcc" : "#ff3355");
    text(soundEnabled ? "[ ACTIVADO ]" : "[ DESACTIVADO ]", width / 2, panelY + 100);

    fill(220);
    text("Dificultad actual:", width / 2, panelY + 145);
    fill("#ffcc00");
    text("~ " + difficulty.toUpperCase() + " ~", width / 2, panelY + 170);

    fill(220);
    text("Teclas de Carriles (Haz clic para cambiar):", width / 2, panelY + 220);

    let boxW = 45;
    let boxH = 35;
    let startX = width / 2 - (5 * boxW + 4 * 10) / 2;
    
    for (let i = 0; i < 5; i++) {
        let bx = startX + i * (boxW + 10);
        let by = panelY + 245;
        let isRemapping = (remappingIndex === i);

        stroke(isRemapping ? "#ff3355" : "#55333d");
        fill(isRemapping ? color(50, 20, 30) : color(25, 20, 30));
        rect(bx, by, boxW, boxH, 4);

        noStroke();
        fill(isRemapping ? "#ff3355" : "#00ffcc");
        textSize(16);
        textStyle(BOLD);
        text(isRemapping ? "?" : slotKeys[i].toUpperCase(), bx + boxW / 2, by + boxH / 2);
    }

    if (remappingIndex !== null) {
        fill("#ffcc00");
        textSize(12);
        text("Presiona una tecla para el Carril " + (remappingIndex + 1), width / 2, panelY + 295);
    } else {
        fill(150);
        textSize(11);
        text("Haz clic en una opción o tecla para modificarla", width / 2, panelY + 295);
    }

    drawBackButton(width / 2 - 60, panelY + 365, 120, 36, "<- VOLVER");
}

// ==========================================
// SCENE: CRÉDITOS
// ==========================================
function drawCreditsScene() {
    background(15, 18, 26);
    drawDarkPanel("CRÉDITOS", 620, 340);

    let panelH = 340;
    let panelY = height / 2 - panelH / 2;

    textAlign(CENTER, CENTER);
    textFont("Courier New");
    fill(220);
    textSize(13);

    text("Diseño y Programación:", width / 2, panelY + 90);
    fill("#ff3355");
    text("IA, Sebastian, Demián, Lucas, Agustín", width / 2, panelY + 115);

    fill(220);
    text("Inspiración:", width / 2, panelY + 160);
    fill(180);
    text("Tirar tazas y floreros de la mesa (pura maldad felina)", width / 2, panelY + 185);

    fill(220);
    text("Motor: p5.js + JavaScript", width / 2, panelY + 230);

    drawBackButton(width / 2 - 60, panelY + 270, 120, 36, "<- VOLVER");
}

// ==========================================
// SCENE: GAMEOVER
// ==========================================
function drawGameOverScene() {
    background(15, 8, 12);
    drawDarkPanel("¡FIN DEL JUEGO!", 540, 380);

    let panelH = 380;
    let panelY = height / 2 - panelH / 2;

    textAlign(CENTER, CENTER);
    textFont("Courier New");
    fill(220);
    textSize(14);
    text("El michi se cansó de hacer caer cosas...", width / 2, panelY + 75);

    fill(20, 15, 22);
    stroke(80, 40, 50);
    rect(width / 2 - 200, panelY + 105, 400, 120, 6);

    noStroke();
    fill("#ffcc00");
    textSize(15);
    text("--- RESUMEN DE LA PARTIDA ---", width / 2, panelY + 130);
    fill("#00ffcc");
    textSize(14);
    text("Puntuación Total (Objetos): " + score, width / 2, panelY + 160);
    text("Nivel Máximo Alcanzado: " + level, width / 2, panelY + 190);

    if (drawButtonCustom(width / 2 - 100, panelY + 295, 200, 40, "JUGAR DE NUEVO")) {
        reiniciarJuego();
        currentScene = "LEVEL_INTRO";
    }
}

// ==========================================
// SCENE: VICTORY
// ==========================================
function drawVictoryScene() {
    background(8, 18, 15);
    drawDarkPanel("¡CAOS ABSOLUTO LOGRADO!", 520, 300);

    let panelH = 300;
    let panelY = height / 2 - panelH / 2;

    textAlign(CENTER, CENTER);
    textFont("Courier New");
    fill(220);
    textSize(14);
    text("¡Sobreviviste al nivel Endemoniado!", width / 2, panelY + 90);
    fill("#00ffcc");
    text("Puntuación final: " + score, width / 2, panelY + 130);

    if (drawButtonCustom(width / 2 - 100, panelY + 190, 200, 40, "MENÚ PRINCIPAL")) {
        currentScene = "MENU";
    }
}

// ==========================================
// INTERACCION TECLADO (ACCIONES)
// ==========================================
function keyPressed() {
    if (currentScene === "OPTIONS" && remappingIndex !== null) {
        let k = key.toLowerCase();
        if (k.length === 1 && k !== " ") {
            slotKeys[remappingIndex] = k;
            remappingIndex = null;
        }
        return;
    }

    if (currentScene === "GAME") {
        let k = key.toLowerCase();
        let targetSlot = slotKeys.indexOf(k);
        let tableY = height * 0.40 + 110;

        if (targetSlot !== -1) {
            let index = tableObjects.findIndex(obj => obj.slot === targetSlot);

            if (index !== -1) {
                let hitObj = tableObjects[index];
                tableObjects.splice(index, 1);

                if (hitObj.type === "Corazon") {
                    if (catLives < 7) catLives++;
                    playHeartSound(); 

                    feedbackEffects.push({
                        x: slotsX[targetSlot],
                        y: tableY,
                        type: "HEART",
                        size: 48,
                        alpha: 255
                    });
                } else {
                    score++;
                    playGlassBreakSound(); 

                    feedbackEffects.push({
                        x: slotsX[targetSlot],
                        y: tableY,
                        type: "SUCCESS",
                        alpha: 255
                    });
                }

                pawAnimations.push({
                    x: slotsX[targetSlot],
                    y: tableY - 60,
                    progress: 0,
                    life: 18
                });

            } else {
                catLives--;
                playErrorSound();

                feedbackEffects.push({
                    x: slotsX[targetSlot],
                    y: tableY,
                    type: "ERROR",
                    alpha: 255
                });

                if (catLives <= 0) {
                    currentScene = "GAMEOVER";
                }
            }
        }
    }
}

// ==========================================
// INTERACCION MOUSE Y CLICS
// ==========================================
function mousePressed() {
    if (getAudioContext().state !== "running") {
        getAudioContext().resume();
    }

    if (currentScene === "MENU") {
        for (let btn of menuButtons) {
            if (mouseX >= btn.x && mouseX <= btn.x + btn.w &&
                mouseY >= btn.y && mouseY <= btn.y + btn.h) {
                if (btn.id === "START") {
                    reiniciarJuego();
                    currentScene = "LEVEL_INTRO";
                } else if (btn.id === "OPTIONS") {
                    currentScene = "OPTIONS";
                } else if (btn.id === "CREDITS") {
                    currentScene = "CREDITS";
                }
            }
        }
    } else if (currentScene === "GAME") {
        if (mouseX >= width - 150 && mouseX <= width - 30 && mouseY >= 65 && mouseY <= 101) {
            currentScene = "MENU";
        }
    } else if (currentScene === "OPTIONS") {
        let panelW = 560;
        let panelH = 440;
        let panelX = width / 2 - panelW / 2;
        let panelY = height / 2 - panelH / 2;
        
        if (mouseX >= panelX + 30 && mouseX <= panelX + panelW - 30 && mouseY >= panelY + 65 && mouseY <= panelY + 115) {
            soundEnabled = !soundEnabled;
            remappingIndex = null;
        }

        else if (mouseX >= panelX + 30 && mouseX <= panelX + panelW - 30 && mouseY >= panelY + 130 && mouseY <= panelY + 185) {
            if (difficulty === "mimoso") difficulty = "violento";
            else if (difficulty === "violento") difficulty = "endemoniado";
            else difficulty = "mimoso";
            remappingIndex = null;
        }

        let boxW = 45;
        let boxH = 35;
        let startX = width / 2 - (5 * boxW + 4 * 10) / 2;
        let by = panelY + 245;

        let clickedOnBox = false;
        for (let i = 0; i < 5; i++) {
            let bx = startX + i * (boxW + 10);
            if (mouseX >= bx && mouseX <= bx + boxW && mouseY >= by && mouseY <= by + boxH) {
                remappingIndex = i;
                clickedOnBox = true;
                break;
            }
        }

        if (!clickedOnBox) {
            if (mouseX < startX || mouseX > startX + 5 * boxW + 4 * 10 || mouseY < by || mouseY > by + boxH) {
                if (remappingIndex !== null && mouseY < panelY + 320) {
                    remappingIndex = null;
                }
            }
        }

        let bx = width / 2 - 60;
        let byBtn = panelY + 365;
        if (mouseX >= bx && mouseX <= bx + 120 && mouseY >= byBtn && mouseY <= byBtn + 36) {
            remappingIndex = null;
            currentScene = "MENU";
        }
    } else if (currentScene === "CREDITS") {
        let panelH = 340;
        let panelY = height / 2 - panelH / 2;
        let bx = width / 2 - 60;
        let by = panelY + 270;
        if (mouseX >= bx && mouseX <= bx + 120 && mouseY >= by && mouseY <= by + 36) {
            currentScene = "MENU";
        }
    }
}

// ==========================================
// FUNCIONES DE AUDIO Y EFECTOS
// ==========================================
function reiniciarJuego() {
    score = 0;
    catLives = 7;
    timeLeft = 30;
    level = 1;
    timerCounter = 0;
    tableObjects = [];
    feedbackEffects = [];
    pawAnimations = [];
    remappingIndex = null;
    heartSpawnedThisLevel = false;
}

function updateBackgroundMusic() {
    if (!soundEnabled) return;

    if (currentScene === "GAME") {
        meowTimer++;
        if (meowTimer > 450) { 
            meowTimer = 0;
            if (random() < 0.6) {
                playMeowSound();
            }
        }
    }

    musicTimer++;
    if (musicTimer > 28) { 
        musicTimer = 0;
        musicStep = (musicStep + 1) % 8;

        if (currentScene === "MENU") {
            let menuNotes = [110, 130.81, 146.83, 164.81, 110, 98, 82.41, 110];
            osc.freq(menuNotes[musicStep]);
            osc.amp(0.12, 0.05);
            osc.amp(0, 0.2);
        } else if (currentScene === "GAME") {
            let gameNotes = [220, 246.94, 261.63, 329.63, 220, 196, 220, 293.66];
            osc.freq(gameNotes[musicStep]);
            osc.amp(0.1, 0.05);
            osc.amp(0, 0.15);
        }
    }
}

function playGlassBreakSound() {
    if (!soundEnabled) return;
    noiseGen.amp(0.6, 0.01);
    noiseGen.amp(0, 0.15);
    osc.freq(random(1200, 1800));
    osc.amp(0.3, 0.01);
    osc.amp(0, 0.12);
}

function playHeartSound() {
    if (!soundEnabled) return;
    osc.freq(523.25); 
    osc.amp(0.3, 0.02);
    setTimeout(() => { osc.freq(659.25); }, 80); 
    setTimeout(() => { osc.freq(783.99); }, 160); 
    setTimeout(() => { osc.amp(0, 0.1); }, 240);
}

function playMeowSound() {
    if (!soundEnabled) return;
    osc.freq(400);
    osc.amp(0.2, 0.05);
    setTimeout(() => { osc.freq(700); }, 150);
    setTimeout(() => { osc.freq(350); }, 350);
    setTimeout(() => { osc.amp(0, 0.15); }, 500);
}

function playCatSound() {
    if (!soundEnabled) return;
    let freq = random(500, 950);
    osc.freq(freq);
    env.play(osc);
}

function playErrorSound() {
    if (!soundEnabled) return;
    osc.freq(140); 
    env.play(osc);
}

function drawDarkPanel(titleText, w, h) {
    let panelX = width / 2 - w / 2;
    let panelY = height / 2 - h / 2;

    stroke("#55333d");
    fill(15, 18, 26, 245);
    rect(panelX, panelY, w, h, 10);

    noStroke();
    fill("#ff3355");
    textAlign(CENTER, CENTER);
    textFont("Georgia");
    textSize(20);
    text(titleText, width / 2, panelY + 40);
}

function drawBackButton(x, y, w, h, label) {
    let isHover = mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
    stroke(isHover ? "#ff3355" : "#55333d");
    fill(isHover ? "#331018" : "#181014");
    rect(x, y, w, h, 6);

    noStroke();
    fill(isHover ? "#ffffff" : "#cccccc");
    textFont("Courier New");
    textSize(12);
    textAlign(CENTER, CENTER);
    text(label, x + w / 2, y + h / 2);
}

function drawButtonCustom(x, y, w, h, label) {
    let isHover = mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
    stroke(isHover ? "#ff3355" : "#55333d");
    fill(isHover ? "#331018" : "#181014");
    rect(x, y, w, h, 6);

    noStroke();
    fill(isHover ? "#ffffff" : "#cccccc");
    textFont("Courier New");
    textSize(12);
    textAlign(CENTER, CENTER);
    text(label, x + w / 2, y + h / 2);

    return isHover && mouseIsPressed;
}