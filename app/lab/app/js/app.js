"use strict";

const TOTAL_STEPS = 16;
// Intro and materials screens are onboarding, not part of the visible step count.
const VISIBLE_STEP_OFFSET = 2;
const TOTAL_VISIBLE_STEPS = TOTAL_STEPS - VISIBLE_STEP_OFFSET;

// Central step metadata keeps educational copy and interaction permissions together.
const STEP_CONFIG = {
  1: {
    title: "Bienvenida al laboratorio",
    instruction:
      "Descubre cómo el núcleo de una célula puede dirigir la formación de un nuevo organismo.",
    hint: "Pulsa “Entrar al laboratorio” para comenzar.",
  },
  2: {
    title: "Reconoce los materiales",
    instruction:
      "Observa las herramientas y los tres ratones que participarán en el procedimiento.",
    hint: "Revisa la función de cada material y pulsa “Todo listo”.",
  },
  3: {
    title: "Prepara la mesa de trabajo",
    instruction:
      "Ya conoces el equipo. Activa la mesa para iniciar la clonación.",
    hint: "Pulsa el botón “Empecemos la clonación”.",
  },
  4: {
    title: "Obtén una célula somática",
    instruction: "Lleva la célula del ratón gris a la caja de Petri 1.",
    hint: "Arrastra la célula brillante junto al ratón gris hasta la placa 01.",
    drags: ["somatic-cell"],
    targets: ["petri1"],
  },
  5: {
    title: "Obtén un ovocito",
    instruction: "Lleva el ovocito del ratón café a la caja de Petri 2.",
    hint: "Arrastra la célula dorada junto al ratón café hasta la placa 02.",
    drags: ["oocyte"],
    targets: ["petri2"],
  },
  6: {
    title: "Observa el ovocito",
    instruction: "Coloca la caja de Petri 2 en el microscopio.",
    hint: "Arrastra la placa marcada 02 hasta el microscopio.",
    drags: ["petri2"],
    targets: ["microscope"],
  },
  7: {
    title: "Sujeta el ovocito",
    instruction: "Usa la pipeta de sostén para estabilizar el ovocito.",
    hint: "Lleva la pipeta de sostén desde el panel hasta el ovocito.",
    drags: ["holding-pipette"],
    targets: ["macro-oocyte"],
  },
  8: {
    title: "Retira el núcleo del ovocito",
    instruction: "Usa la aguja de inyección para aspirar el núcleo.",
    hint: "Lleva la aguja de inyección hasta el centro morado del ovocito.",
    drags: ["injection-needle"],
    targets: ["macro-oocyte"],
  },
  9: {
    title: "Prepara la transferencia",
    instruction:
      "Vuelve al laboratorio y lleva el ovocito sin núcleo a la caja de Petri 3.",
    hint: "Cierra la vista microscópica y arrastra el ovocito enucleado a la placa 03.",
    drags: ["enucleated-oocyte"],
    targets: ["petri3"],
  },
  10: {
    title: "Reúne ambas células",
    instruction:
      "Lleva la célula somática de la caja 1 a la caja de transferencia nuclear.",
    hint: "Arrastra la célula azul desde la placa 01 hasta la placa 03.",
    drags: ["somatic-cell"],
    targets: ["petri3"],
  },
  11: {
    title: "Regresa al microscopio",
    instruction: "Coloca la caja de Petri 3 en el microscopio.",
    hint: "Arrastra la placa 03, que ahora contiene ambas células, al microscopio.",
    drags: ["petri3"],
    targets: ["microscope"],
  },
  12: {
    title: "Extrae el núcleo somático",
    instruction:
      "Primero estabiliza la célula somática con la pipeta de sostén.",
    hint: "Lleva la pipeta a la célula azul; después usa la aguja para extraer su núcleo.",
    drags: ["holding-pipette"],
    targets: ["macro-somatic"],
  },
  13: {
    title: "Transfiere el núcleo",
    instruction: "Inserta el núcleo somático dentro del ovocito enucleado.",
    hint: "La aguja ya contiene el núcleo. Llévala hasta el ovocito dorado.",
    drags: ["injection-needle"],
    targets: ["macro-oocyte"],
  },
  14: {
    title: "Activa el desarrollo",
    instruction:
      "Aplica una gota del reactivo para iniciar la primera división celular.",
    hint: "Arrastra el frasco de reactivo hasta el ovocito reconstruido.",
    drags: ["reagent"],
    targets: ["macro-oocyte"],
  },
  15: {
    title: "Implanta el embrión",
    instruction: "Lleva el embrión al vientre de la madre sustituta blanca.",
    hint: "Arrastra el embrión desde el microscopio hasta el área resaltada del ratón blanco.",
    drags: ["embryo"],
    targets: ["surrogate"],
  },
  16: {
    title: "Espera el nacimiento",
    instruction: "La gestación está ocurriendo de forma acelerada…",
    hint: "Cuando el vientre se ilumine, púlsalo para conocer a la cría.",
  },
};

class GameState {
  constructor(onChange) {
    this.onChange = onChange;
    this.reset();
  }

  reset() {
    this.step = 1;
    this.flags = {
      somaticCellCollected: false,
      oocyteCollected: false,
      oocyteHeld: false,
      oocyteEnucleated: false,
      somaticCellHeld: false,
      somaticNucleusExtracted: false,
      nucleusTransferred: false,
      embryoActivated: false,
      embryoImplanted: false,
      birthReady: false,
      completed: false,
    };
  }

  goTo(step) {
    this.step = Math.max(1, Math.min(TOTAL_STEPS, step));
    this.onChange(this.step);
  }

  advance() {
    this.goTo(this.step + 1);
  }

  get config() {
    return STEP_CONFIG[this.step];
  }

  isValidDrop(action, target) {
    const config = this.config;
    if (this.step === 12 && this.flags.somaticCellHeld) {
      return action === "injection-needle" && target === "macro-somatic";
    }
    return Boolean(
      config.drags?.includes(action) && config.targets?.includes(target),
    );
  }
}

// Visual effects remain independent from progression and never decide game state.
class AnimationEngine {
  constructor(root) {
    this.root = root;
    this.running = true;
    this.timers = [];
    this.startTime = performance.now();
    this.animate = this.animate.bind(this);
    document.addEventListener("visibilitychange", () => {
      this.running = !document.hidden;
      if (this.running) requestAnimationFrame(this.animate);
    });
    requestAnimationFrame(this.animate);
  }

  animate(time) {
    if (!this.running) return;
    const particles = this.root.querySelectorAll(".organelle");
    particles.forEach((particle, index) => {
      const phase = (time - this.startTime) / (1150 + index * 90) + index;
      const x = Math.sin(phase) * (2.5 + (index % 3));
      const y = Math.cos(phase * 0.73) * (2 + (index % 2));
      particle.style.translate = `${x}px ${y}px`;
    });
    requestAnimationFrame(this.animate);
  }

  suction(cell) {
    const nucleus = cell.querySelector(".macro-nucleus");
    const suctionTrail = document.createElement("span");
    suctionTrail.className = "suction-trail";
    cell.append(suctionTrail);
    suctionTrail.addEventListener("animationend", () => suctionTrail.remove());
    nucleus?.classList.add("extracted");
    this.particles(cell, 8, "#9679b0");
  }

  particles(origin, amount = 12, color = "#61d6d8") {
    const layer = document.querySelector(".micro-particles");
    if (!layer) return;
    const originRect = origin.getBoundingClientRect();
    const layerRect = layer.getBoundingClientRect();
    for (let index = 0; index < amount; index += 1) {
      const particle = document.createElement("i");
      particle.style.left = `${originRect.left - layerRect.left + originRect.width / 2}px`;
      particle.style.top = `${originRect.top - layerRect.top + originRect.height / 2}px`;
      particle.style.background = color;
      particle.style.setProperty("--x", `${(Math.random() - 0.5) * 150}px`);
      particle.style.setProperty("--y", `${(Math.random() - 0.5) * 150}px`);
      layer.append(particle);
      particle.addEventListener("animationend", () => particle.remove());
    }
  }

  activateEmbryo(oocyte) {
    oocyte.classList.add("activated");
    this.particles(oocyte, 18, "#f2c960");
    this.timers.push(
      window.setTimeout(() => {
        oocyte.style.opacity = "0";
        document.querySelector(".division-cell")?.classList.add("visible");
      }, 650),
    );
  }

  reset() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
    document
      .querySelectorAll(".suction-trail, .reagent-drop, .micro-particles i")
      .forEach((element) => element.remove());
  }
}

// The controller translates pointer, touch and keyboard input into validated actions.
class UIController {
  constructor(game, animations) {
    this.game = game;
    this.animations = animations;
    this.selectedAction = null;
    this.toastTimer = null;
    this.sequenceTimers = [];
    this.drag = null;
    this.cacheElements();
    this.bindEvents();
  }

  cacheElements() {
    this.stepLabel = document.querySelector("#step-label");
    this.progressPercent = document.querySelector("#progress-percent");
    this.progressFill = document.querySelector("#progress-fill");
    this.progressTrack = document.querySelector(".progress-track");
    this.instructionNumber = document.querySelector("#instruction-number");
    this.instructionTitle = document.querySelector("#instruction-title");
    this.instructionText = document.querySelector("#instruction-text");
    this.status = document.querySelector("#status-message");
    this.toastElement = document.querySelector("#toast");
    this.intro = document.querySelector("#intro-screen");
    this.materials = document.querySelector("#materials-screen");
    this.microOverlay = document.querySelector("#microscope-overlay");
    this.closeMicroButton = document.querySelector("#close-micro");
    this.microNote = document.querySelector("#micro-note-text");
    this.resetDialog = document.querySelector("#reset-dialog");
    this.stageDim = document.querySelector("#stage-dim");
  }

  bindEvents() {
    document.querySelector("#start-button").addEventListener("click", () => {
      this.intro.classList.add("hidden");
      this.materials.classList.remove("hidden");
      this.game.goTo(2);
      document.querySelector("#materials-button").focus();
    });

    document
      .querySelector("#materials-button")
      .addEventListener("click", () => {
        this.materials.classList.add("hidden");
        this.game.goTo(3);
        document.querySelector("#clone-button").focus();
      });

    document.querySelector("#clone-button").addEventListener("click", () => {
      this.game.advance();
      this.toast("Mesa preparada. Sigue el elemento iluminado.", "success");
    });

    document
      .querySelector("#hint-button")
      .addEventListener("click", () => this.showHint());
    document
      .querySelector("#reset-button")
      .addEventListener("click", () => this.resetDialog.showModal());
    this.resetDialog.addEventListener("close", () => {
      if (this.resetDialog.returnValue === "confirm") this.resetExperience();
    });

    this.closeMicroButton.addEventListener("click", () => {
      if (!this.closeMicroButton.disabled) this.closeMicroscope();
    });

    document.addEventListener("pointerdown", (event) =>
      this.onPointerDown(event),
    );
    document.addEventListener("pointermove", (event) =>
      this.onPointerMove(event),
    );
    document.addEventListener("pointerup", (event) => this.onPointerUp(event));
    document.addEventListener("pointercancel", () => this.cancelDrag());
    document.addEventListener("keydown", (event) => this.onKeyDown(event));
    document
      .querySelector("[data-action='birth']")
      .addEventListener("click", () => this.handleBirth());
  }

  renderStep() {
    const step = this.game.step;
    const config = this.game.config;
    const displayStep = Math.max(1, step - VISIBLE_STEP_OFFSET);
    const percent = Math.round((displayStep / TOTAL_VISIBLE_STEPS) * 100);
    this.stepLabel.textContent = `Paso ${displayStep} de ${TOTAL_VISIBLE_STEPS}`;
    this.progressPercent.textContent = `${percent}%`;
    this.progressFill.style.width = `${percent}%`;
    this.progressTrack.setAttribute("aria-valuenow", String(displayStep));
    this.instructionNumber.textContent = String(displayStep).padStart(2, "0");
    this.instructionTitle.textContent = config.title;
    this.instructionText.textContent = config.instruction;
    this.status.textContent = step >= 4 && step <= 15 ? "" : "";

    document
      .querySelector("#clone-button")
      .classList.toggle("visible", step === 3);
    this.stageDim.classList.toggle("visible", step === 3);
    this.closeMicroButton.disabled = step !== 9;
    if (step >= 4)
      this.revealCellToken(document.querySelector(".somatic-token"));
    if (step >= 5)
      this.revealCellToken(document.querySelector(".oocyte-token"));
    this.updateInteractiveStates();
  }

  // Cell tokens are hidden until their step, then "emerge" from inside the donor mouse.
  revealCellToken(element) {
    if (!element || !element.classList.contains("cell-hidden")) return;
    element.classList.remove("cell-hidden");
    element.classList.add("cell-emerge");
    const onEmergeEnd = (event) => {
      if (event.animationName !== "cellEmerge") return;
      element.classList.remove("cell-emerge");
      element.removeEventListener("animationend", onEmergeEnd);
    };
    element.addEventListener("animationend", onEmergeEnd);
  }

  updateInteractiveStates() {
    const config = this.game.config;
    const allowedDrags = new Set(config.drags || []);
    const targets = new Set(config.targets || []);

    if (this.game.step === 12 && this.game.flags.somaticCellHeld) {
      allowedDrags.clear();
      allowedDrags.add("injection-needle");
      this.instructionText.textContent =
        "La célula está estable. Ahora extrae su núcleo con la aguja de inyección.";
      this.microNote.textContent =
        "Aspira solo el núcleo: allí se encuentra la información genética del ratón gris.";
    }

    document.querySelectorAll("[data-draggable]").forEach((element) => {
      const enabled =
        allowedDrags.has(element.dataset.draggable) &&
        this.isElementAvailable(element);
      const enabledAsTarget = targets.has(element.dataset.dropZone);
      element.classList.toggle("is-active", enabled);
      // Dual-role Petri dishes must remain interactive when acting as drop targets.
      element.classList.toggle("is-disabled", !enabled && !enabledAsTarget);
      element.setAttribute(
        "aria-disabled",
        String(!enabled && !enabledAsTarget),
      );
      element.tabIndex = enabled || enabledAsTarget ? 0 : -1;
    });

    document.querySelectorAll("[data-drop-zone]").forEach((element) => {
      const active = targets.has(element.dataset.dropZone);
      element.classList.toggle("is-target", active);
      if (!element.matches("button"))
        element.tabIndex =
          active || element.classList.contains("is-active") ? 0 : -1;
    });
  }

  isElementAvailable(element) {
    const action = element.dataset.draggable;
    if (action === "somatic-cell") return !element.hidden;
    if (action === "enucleated-oocyte")
      return element.classList.contains("visible");
    if (action === "embryo") return element.classList.contains("visible");
    if (action === "reagent") return !this.game.flags.embryoActivated;
    if (action === "injection-needle" && this.game.step === 8)
      return !this.game.flags.oocyteEnucleated;
    if (action === "injection-needle" && this.game.step === 12)
      return !this.game.flags.somaticNucleusExtracted;
    if (action === "injection-needle" && this.game.step === 13)
      return !this.game.flags.nucleusTransferred;
    return true;
  }

  onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const source = event.target.closest("[data-draggable]");
    if (!source) return;
    const action = source.dataset.draggable;
    if (!this.isActionEnabled(action, source)) {
      this.invalidFeedback(source, "Ese elemento todavía no se utiliza.");
      return;
    }
    event.preventDefault();
    const ghost = source.cloneNode(true);
    const rect = source.getBoundingClientRect();
    ghost.removeAttribute("id");
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.classList.add("drag-ghost");
    document.body.append(ghost);
    source.classList.add("dragging-source");
    this.drag = { source, action, ghost, pointerId: event.pointerId };
    document.body.classList.add("is-dragging");
    this.moveGhost(event.clientX, event.clientY);
    source.setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    event.preventDefault();
    this.moveGhost(event.clientX, event.clientY);
  }

  onPointerUp(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest("[data-drop-zone]");
    const { action, source } = this.drag;
    this.cancelDrag();
    if (target && this.game.isValidDrop(action, target.dataset.dropZone)) {
      this.handleDrop(action, target.dataset.dropZone, source);
    } else {
      this.invalidFeedback(
        source,
        target
          ? "Esa no es la zona correcta."
          : "Suelta el elemento sobre la zona iluminada.",
      );
    }
  }

  cancelDrag() {
    if (!this.drag) return;
    this.drag.source.classList.remove("dragging-source");
    this.drag.ghost.remove();
    this.drag = null;
    document.body.classList.remove("is-dragging");
  }

  moveGhost(x, y) {
    if (!this.drag) return;
    this.drag.ghost.style.left = `${x}px`;
    this.drag.ghost.style.top = `${y}px`;
  }

  onKeyDown(event) {
    if (!event.target.matches("[data-draggable], [data-drop-zone]")) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const action = event.target.dataset.draggable;
    const target = event.target.dataset.dropZone;
    if (target && this.selectedAction) {
      if (this.game.isValidDrop(this.selectedAction.action, target)) {
        const selection = this.selectedAction;
        this.selectedAction = null;
        this.handleDrop(selection.action, target, selection.source);
      } else {
        this.invalidFeedback(event.target, "Esa no es la zona correcta.");
      }
      return;
    }
    if (action) {
      if (!this.isActionEnabled(action, event.target))
        return this.invalidFeedback(
          event.target,
          "Ese elemento todavía no se utiliza.",
        );
      this.selectedAction = { action, source: event.target };
      this.toast("Elemento seleccionado. Activa ahora la zona iluminada.");
      return;
    }
  }

  isActionEnabled(action, element) {
    let allowed = this.game.config.drags || [];
    if (this.game.step === 12 && this.game.flags.somaticCellHeld)
      allowed = ["injection-needle"];
    return allowed.includes(action) && this.isElementAvailable(element);
  }

  handleDrop(action, target, source) {
    // Every valid state/action/target combination has one explicit transition.
    const key = `${this.game.step}:${action}:${target}`;
    const handlers = {
      "4:somatic-cell:petri1": () => {
        document.querySelector("[data-drop-zone='petri1']").append(source);
        this.game.flags.somaticCellCollected = true;
        this.completeStep(
          "La célula somática aporta el núcleo con el ADN del ratón gris.",
        );
      },
      "5:oocyte:petri2": () => {
        document.querySelector("[data-drop-zone='petri2']").append(source);
        this.game.flags.oocyteCollected = true;
        this.completeStep(
          "El ovocito proporcionará el citoplasma necesario para iniciar el desarrollo.",
        );
      },
      "6:petri2:microscope": () => {
        this.openMicroscope("oocyte");
        this.completeStep(
          "Ahora podemos observar y manipular el ovocito a gran aumento.",
        );
      },
      "7:holding-pipette:macro-oocyte": () => {
        document.querySelector(".macro-oocyte").classList.add("held");
        this.game.flags.oocyteHeld = true;
        this.completeStep("La pipeta mantiene estable el ovocito sin dañarlo.");
      },
      "8:injection-needle:macro-oocyte": () => {
        this.animations.suction(document.querySelector(".macro-oocyte"));
        this.game.flags.oocyteEnucleated = true;
        document.querySelector("[data-draggable='oocyte']").hidden = true;
        this.updateInteractiveStates();
        this.schedule(
          () =>
            this.completeStep(
              "Al retirar el núcleo eliminamos el ADN de la donante del ovocito.",
            ),
          650,
        );
      },
      "9:enucleated-oocyte:petri3": () => {
        document.querySelector("[data-drop-zone='petri3']").append(source);
        source.classList.remove("visible");
        this.completeStep(
          "El ovocito sin núcleo está listo para recibir nueva información genética.",
        );
      },
      "10:somatic-cell:petri3": () => {
        document.querySelector("[data-drop-zone='petri3']").append(source);
        this.completeStep(
          "Las dos células ya comparten la misma placa de transferencia.",
        );
      },
      "11:petri3:microscope": () => {
        this.openMicroscope("transfer");
        this.completeStep(
          "Volvemos al microscopio para transferir el núcleo con precisión.",
        );
      },
      "12:holding-pipette:macro-somatic": () => {
        document.querySelector(".macro-somatic").classList.add("held");
        this.game.flags.somaticCellHeld = true;
        this.toast(
          "Célula estabilizada. Ahora usa la aguja de inyección.",
          "success",
        );
        this.updateInteractiveStates();
      },
      "12:injection-needle:macro-somatic": () => {
        this.animations.suction(document.querySelector(".macro-somatic"));
        this.game.flags.somaticNucleusExtracted = true;
        this.updateInteractiveStates();
        document
          .querySelector("[data-draggable='injection-needle']")
          .classList.add("loaded");
        this.schedule(
          () =>
            this.completeStep(
              "El núcleo extraído contiene el genoma del ratón gris.",
            ),
          650,
        );
      },
      "13:injection-needle:macro-oocyte": () => {
        const nucleus = document.querySelector(".macro-oocyte .macro-nucleus");
        nucleus.classList.remove("extracted");
        nucleus.style.opacity = "1";
        nucleus.style.transform = "scale(1)";
        this.game.flags.nucleusTransferred = true;
        this.animations.particles(document.querySelector(".macro-oocyte"), 10);
        this.completeStep(
          "El ovocito ahora contiene el ADN nuclear de la donante gris.",
        );
      },
      "14:reagent:macro-oocyte": () => {
        this.game.flags.embryoActivated = true;
        this.updateInteractiveStates();
        const drop = document.createElement("span");
        drop.className = "reagent-drop";
        document.querySelector("#lens").append(drop);
        this.animations.activateEmbryo(document.querySelector(".macro-oocyte"));
        this.toast(
          "¡Activación lograda! Comienza la primera división.",
          "success",
        );
        this.schedule(() => {
          this.closeMicroscope();
          document.querySelector(".embryo-sample").classList.add("visible");
          this.game.advance();
        }, 1900);
      },
      "15:embryo:surrogate": () => {
        source.classList.remove("visible");
        this.game.flags.embryoImplanted = true;
        document.querySelector(".white-mouse").classList.add("is-pregnant");
        this.game.advance();
        this.toast(
          "Embrión implantado. La gestación simulada ha comenzado.",
          "success",
        );
        this.schedule(() => {
          this.game.flags.birthReady = true;
          document.querySelector(".white-mouse").classList.add("birth-ready");
          this.instructionText.textContent =
            "La gestación se completó. Pulsa el vientre iluminado para revelar la cría.";
          document.querySelector(".belly-target").tabIndex = 0;
          document.querySelector(".belly-target").focus();
        }, 2200);
      },
    };

    if (handlers[key]) handlers[key]();
    else
      this.invalidFeedback(source, "Esa acción no corresponde al paso actual.");
  }

  completeStep(message) {
    this.toast(message, "success");
    this.game.advance();
  }

  openMicroscope(mode) {
    const oocyte = document.querySelector(".macro-oocyte");
    const somatic = document.querySelector(".macro-somatic");
    const division = document.querySelector(".division-cell");
    this.microOverlay.classList.remove("hidden");
    this.closeMicroButton.disabled = true;
    oocyte.style.display = "block";
    oocyte.style.opacity = "1";
    somatic.style.display = mode === "transfer" ? "block" : "none";
    division.classList.remove("visible");
    if (mode === "transfer") {
      oocyte.style.left = "52%";
      oocyte.querySelector(".macro-nucleus").classList.add("extracted");
      oocyte.classList.add("held");
      this.microNote.textContent =
        "La célula azul es somática; el ovocito dorado ya no tiene núcleo.";
    } else {
      oocyte.style.left = "31%";
      this.microNote.textContent =
        "La pipeta evita que la célula se mueva durante el procedimiento.";
    }
  }

  closeMicroscope() {
    this.microOverlay.classList.add("hidden");
    if (this.game.step === 9)
      document.querySelector(".enucleated-sample").classList.add("visible");
    this.updateInteractiveStates();
  }

  handleBirth() {
    if (
      this.game.step !== 16 ||
      !this.game.flags.birthReady ||
      this.game.flags.completed
    )
      return;
    this.game.flags.completed = true;
    document.querySelector(".baby-mouse").classList.add("revealed");
    document.querySelector(".belly-target").tabIndex = -1;
    this.instructionTitle.textContent = "¡Ha nacido una cría gris!";
    this.instructionText.textContent =
      "Su pelaje confirma que es genéticamente idéntica a la donante del núcleo, no a la donante del ovocito ni a la madre sustituta.";
    this.status.textContent =
      "Experimento completado. Puedes reiniciarlo para repetir el procedimiento.";
    this.toast(
      "¡Clonación completada! La información genética nuclear provino del ratón gris.",
      "success",
    );
  }

  showHint() {
    this.toast(this.game.config.hint);
    const active = document.querySelector(".is-active");
    if (active) {
      active.classList.remove("shake");
      requestAnimationFrame(() => active.classList.add("shake"));
    }
  }

  toast(message, type = "") {
    clearTimeout(this.toastTimer);
    this.toastElement.textContent = message;
    this.toastElement.className = `toast show ${type}`;
    this.toastTimer = window.setTimeout(
      () => this.toastElement.classList.remove("show"),
      3800,
    );
  }

  schedule(callback, delay) {
    const timer = window.setTimeout(() => {
      this.sequenceTimers = this.sequenceTimers.filter(
        (item) => item !== timer,
      );
      callback();
    }, delay);
    this.sequenceTimers.push(timer);
    return timer;
  }

  invalidFeedback(element, message) {
    element?.classList.remove("shake");
    requestAnimationFrame(() => element?.classList.add("shake"));
    this.toast(message, "error");
  }

  resetExperience() {
    this.cancelDrag();
    this.selectedAction = null;
    clearTimeout(this.toastTimer);
    this.sequenceTimers.forEach((timer) => clearTimeout(timer));
    this.sequenceTimers = [];
    this.animations.reset();

    const grayMouse = document.querySelector(".gray-mouse");
    const brownMouse = document.querySelector(".brown-mouse");
    const labStage = document.querySelector("#lab-stage");
    const somaticToken = document.querySelector(
      "[data-draggable='somatic-cell']",
    );
    const oocyteToken = document.querySelector("[data-draggable='oocyte']");
    const enucleatedSample = document.querySelector(".enucleated-sample");
    const embryoSample = document.querySelector(".embryo-sample");

    grayMouse.append(somaticToken);
    brownMouse.append(oocyteToken);
    labStage.append(enucleatedSample, embryoSample);
    somaticToken.hidden = false;
    oocyteToken.hidden = false;
    somaticToken.classList.remove("cell-emerge");
    somaticToken.classList.add("cell-hidden");
    oocyteToken.classList.remove("cell-emerge");
    oocyteToken.classList.add("cell-hidden");
    enucleatedSample.className = "sample-token enucleated-sample draggable";
    embryoSample.className = "sample-token embryo-sample draggable";

    const oocyte = document.querySelector(".macro-oocyte");
    const somatic = document.querySelector(".macro-somatic");
    [oocyte, somatic].forEach((cell) => {
      cell.classList.remove("held", "activated");
      cell.style.removeProperty("opacity");
      const nucleus = cell.querySelector(".macro-nucleus");
      nucleus?.classList.remove("extracted");
      nucleus?.style.removeProperty("opacity");
      nucleus?.style.removeProperty("transform");
    });
    oocyte.style.left = "31%";
    somatic.style.display = "none";
    document.querySelector(".division-cell").classList.remove("visible");
    document
      .querySelector(".white-mouse")
      .classList.remove("is-pregnant", "birth-ready");
    document.querySelector(".baby-mouse").classList.remove("revealed");
    document.querySelector(".belly-target").tabIndex = -1;
    document
      .querySelector("[data-draggable='injection-needle']")
      .classList.remove("loaded");

    this.microOverlay.classList.add("hidden");
    this.materials.classList.add("hidden");
    this.intro.classList.remove("hidden");
    this.toastElement.className = "toast";
    this.game.reset();
    this.renderStep();
    document.querySelector("#start-button").focus();
  }
}

const game = new GameState(() => ui.renderStep());
const animations = new AnimationEngine(document);
const ui = new UIController(game, animations);
ui.renderStep();
