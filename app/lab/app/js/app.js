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
  },
  2: {
    title: "Reconoce los materiales",
    instruction:
      "Observa las herramientas y los tres ratones que participarán en el procedimiento.",
  },
  3: {
    title: "Prepara la mesa de trabajo",
    instruction:
      "Ya conoces el equipo. Activa la mesa para iniciar la clonación.",
  },
  4: {
    title: "Obtén una célula somática",
    instruction:
      "La mesa está preparada. Lleva la célula del ratón gris a la caja de Petri 1.",
    drags: ["somatic-cell"],
    targets: ["petri1"],
  },
  5: {
    title: "Obtén un ovocito",
    instruction:
      "La célula somática aportará el ADN del ratón gris. Ahora lleva el ovocito del ratón café a la caja de Petri 2.",
    drags: ["oocyte"],
    targets: ["petri2"],
  },
  6: {
    title: "Observa el ovocito",
    instruction:
      "El ovocito proporcionará el citoplasma para iniciar el desarrollo. Coloca la caja de Petri 2 en el microscopio.",
    drags: ["petri2"],
    targets: ["microscope"],
  },
  7: {
    title: "Sujeta el ovocito",
    instruction:
      "Ya puedes observar el ovocito a gran aumento. Usa la pipeta de sostén para estabilizarlo.",
    drags: ["holding-pipette"],
    targets: ["micro-oocyte"],
  },
  8: {
    title: "Retira el núcleo del ovocito",
    instruction:
      "La pipeta mantiene estable el ovocito. Usa la aguja de inyección para aspirar su núcleo.",
    drags: ["injection-needle"],
    targets: ["micro-oocyte"],
  },
  9: {
    title: "Prepara la transferencia",
    instruction:
      "El ADN de la donante del ovocito fue retirado. Vuelve al laboratorio y lleva el ovocito enucleado a la caja de Petri 3.",
    drags: ["enucleated-oocyte"],
    targets: ["petri3"],
  },
  10: {
    title: "Reúne ambas células",
    instruction:
      "El ovocito enucleado está listo. Lleva la célula somática de la caja 1 a la caja de transferencia nuclear.",
    drags: ["somatic-cell"],
    targets: ["petri3"],
  },
  11: {
    title: "Regresa al microscopio",
    instruction:
      "Ambas células están en la placa de transferencia. Coloca la caja de Petri 3 en el microscopio.",
    drags: ["petri3"],
    targets: ["microscope"],
  },
  12: {
    title: "Extrae el núcleo somático",
    instruction:
      "De nuevo bajo el microscopio, estabiliza la célula somática con la pipeta de sostén.",
    drags: ["holding-pipette"],
    targets: ["micro-somatic"],
  },
  13: {
    title: "Transfiere el núcleo",
    instruction:
      "La aguja contiene el núcleo con el genoma del ratón gris. Insértalo dentro del ovocito enucleado.",
    drags: ["injection-needle"],
    targets: ["micro-oocyte"],
  },
  14: {
    title: "Activa el desarrollo",
    instruction:
      "El ovocito ya contiene el ADN nuclear del ratón gris. Aplica una gota del reactivo para iniciar la división celular.",
    drags: ["reagent"],
    targets: ["lens"],
  },
  15: {
    title: "Implanta el embrión",
    instruction:
      "El embrión alcanzó 16 células. Llévalo al vientre de la madre sustituta blanca.",
    drags: ["embryo"],
    targets: ["surrogate"],
  },
  16: {
    title: "Espera el nacimiento",
    instruction:
      "El embrión fue implantado y la gestación está ocurriendo de forma acelerada…",
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
      embryoDivisionComplete: false,
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
      return action === "injection-needle" && target === "micro-somatic";
    }
    return Boolean(
      config.drags?.includes(action) && config.targets?.includes(target),
    );
  }
}

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
      const x = Math.sin(phase) * (5.5 + (index % 3));
      const y = Math.cos(phase * 0.73) * (7 + (index % 2));
      particle.style.translate = `${x}px ${y}px`;
    });
    requestAnimationFrame(this.animate);
  }

  suction(cell) {
    const nucleus = cell.querySelector(".micro-nucleus");
    const suctionTrail = document.createElement("span");
    suctionTrail.className = "suction-trail";
    cell.append(suctionTrail);

    // Only start draining once the needle has finished sliding in (right entry, or top entry in the second micromanipulation).
    const onNeedleIn = (event) => {
      if (
        event.animationName !== "toolEnterRight" &&
        event.animationName !== "toolEnterTop"
      )
        return;
      suctionTrail.removeEventListener("animationend", onNeedleIn);
      const suctionTrailProgress = document.createElement("span");
      suctionTrailProgress.className = "suction-progress";
      cell.append(suctionTrailProgress);
      nucleus?.classList.add("extracted");

      // Nucleus is only marked extracted once the progress bar is full.
      const onFillEnd = (event2) => {
        if (event2.animationName !== "suctionFill") return;
        suctionTrailProgress.removeEventListener("animationend", onFillEnd);
        this.particles(cell, 118, "#9679b0");
        //add class to suction trail to make it retract and disappear
        suctionTrail.classList.add("suction-trail-retract");
        suctionTrailProgress.classList.add("suction-trail-retract");
        cell.classList.add("held-retract");
      };
      suctionTrailProgress.addEventListener("animationend", onFillEnd);
    };
    suctionTrail.addEventListener("animationend", onNeedleIn);
  }

  // Reverse of suction(): needle enters, the progress bar drains as the nucleus is delivered, then it retracts.
  injection(cell, onComplete) {
    const nucleus = cell.querySelector(".micro-nucleus");
    const suctionTrail = document.createElement("span");
    suctionTrail.className = "suction-trail";
    cell.append(suctionTrail);

    const onNeedleIn = (event) => {
      if (
        event.animationName !== "toolEnterRight" &&
        event.animationName !== "toolEnterTop"
      )
        return;
      suctionTrail.removeEventListener("animationend", onNeedleIn);
      const suctionTrailProgress = document.createElement("span");
      suctionTrailProgress.className = "suction-progress injecting";
      cell.append(suctionTrailProgress);
      nucleus?.classList.remove("extracted");

      // Nucleus only reappears once the progress bar has fully drained into the cell.
      const onFillEnd = (event2) => {
        if (event2.animationName !== "injectionFill") return;
        suctionTrailProgress.removeEventListener("animationend", onFillEnd);
        this.particles(cell, 10, "#9679b0");
        suctionTrail.classList.add("suction-trail-retract");
        suctionTrailProgress.classList.add("suction-trail-retract");

        // The step only completes once the needle has fully withdrawn.
        const onRetractEnd = (event3) => {
          if (event3.animationName !== "toolExitRight") return;
          suctionTrail.removeEventListener("animationend", onRetractEnd);
          onComplete?.();
        };
        suctionTrail.addEventListener("animationend", onRetractEnd);
      };
      suctionTrailProgress.addEventListener("animationend", onFillEnd);
    };
    suctionTrail.addEventListener("animationend", onNeedleIn);
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

  activateEmbryo(oocyte, onComplete) {
    const lens = document.querySelector("#lens");
    const drop = document.createElement("span");
    drop.className = "reagent-drop";
    drop.setAttribute("aria-hidden", "true");
    lens.append(drop);

    // Start the yellow wash near impact so it feels like liquid spreading, not an instant tint.
    this.timers.push(
      window.setTimeout(() => {
        lens.classList.add("reagent-wash");
        oocyte.classList.add("activated");
        this.particles(oocyte, 10, "#e8c45a");
      }, 980),
    );

    this.timers.push(
      window.setTimeout(() => {
        lens.classList.add("reagent-wash-fade");
      }, 4200),
    );

    this.timers.push(
      window.setTimeout(() => {
        lens.classList.remove("reagent-wash", "reagent-wash-fade");
        drop.remove();
        this.startCleavage(oocyte, onComplete);
      }, 5400),
    );
  }

  startCleavage(oocyte, onComplete) {
    oocyte.classList.remove("activated");
    oocyte.classList.add("cleaving");

    const field = document.createElement("span");
    field.className = "blastomere-field";
    field.setAttribute("aria-hidden", "true");
    oocyte.append(field);

    const stages = [2, 4, 8, 16];
    let stageIndex = 0;

    const showStage = () => {
      this.placeBlastomeres(field, stages[stageIndex]);
      stageIndex += 1;
      if (stageIndex < stages.length) {
        this.timers.push(window.setTimeout(showStage, 1500));
      } else {
        this.timers.push(window.setTimeout(() => onComplete?.(), 1400));
      }
    };

    showStage();
  }

  // Irregular packing: golden-angle spiral with jitter so blastomeres look organic and may overlap.
  placeBlastomeres(field, count) {
    field.dataset.count = String(count);
    field.replaceChildren();

    const baseSize = count <= 2 ? 44 : count <= 4 ? 36 : count <= 8 ? 27 : 20;
    const maxRadius = count <= 2 ? 22 : count <= 4 ? 28 : count <= 8 ? 34 : 38;

    for (let index = 0; index < count; index += 1) {
      const angle = index * 2.399963229728653 + (Math.random() - 0.5) * 0.55;
      const radius =
        count === 1
          ? 0
          : Math.min(
              maxRadius,
              6 +
                Math.sqrt(index + 0.35) * (maxRadius / Math.sqrt(count)) +
                (Math.random() - 0.5) * 9,
            );
      const x = 50 + Math.cos(angle) * radius + (Math.random() - 0.5) * 7;
      const y = 50 + Math.sin(angle) * radius + (Math.random() - 0.5) * 7;
      const size = baseSize + (Math.random() - 0.5) * (baseSize * 0.28);

      const blastomere = document.createElement("i");
      blastomere.style.setProperty("--i", String(index));
      blastomere.style.left = `${Math.max(10, Math.min(90, x))}%`;
      blastomere.style.top = `${Math.max(10, Math.min(90, y))}%`;
      blastomere.style.width = `${Math.max(18, size)}%`;
      blastomere.style.zIndex = String(1 + Math.floor(Math.random() * 6));
      field.append(blastomere);
    }
  }

  reset() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
    document
      .querySelectorAll(
        ".suction-trail, .suction-progress, .reagent-drop, .micro-particles i, .blastomere-field",
      )
      .forEach((element) => element.remove());
    document
      .querySelector("#lens")
      ?.classList.remove("reagent-wash", "reagent-wash-fade");
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
    });

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
    this.typeInstructionText(config.instruction);
    this.status.textContent = step >= 4 && step <= 15 ? "" : "";

    document
      .querySelector("#clone-button")
      .classList.toggle("visible", step === 3);
    this.stageDim.classList.toggle("visible", step === 3);
    this.closeMicroButton.disabled = !(
      step === 9 ||
      (step === 14 && this.game.flags.embryoDivisionComplete)
    );
    if (step >= 4)
      this.revealCellToken(document.querySelector(".somatic-token"));
    if (step >= 5)
      this.revealCellToken(document.querySelector(".oocyte-token"));
    this.updateInteractiveStates();
  }

  // Simulates keystrokes appearing left-to-right, ending with a blinking text cursor.
  typeInstructionText(text) {
    clearInterval(this._typeInterval);
    this.instructionText.classList.add("is-typing");
    this.instructionText.textContent = "";
    let i = 0;
    this._typeInterval = setInterval(() => {
      i += 1;
      this.instructionText.textContent = text.slice(0, i);
      if (i >= text.length) {
        clearInterval(this._typeInterval);
        this.instructionText.classList.remove("is-typing");
      }
    }, 18);
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
      this.typeInstructionText(
        "La célula está estable. Ahora extrae su núcleo con la aguja de inyección.",
      );
    }

    if (this.game.step === 14 && this.game.flags.embryoActivated) {
      allowedDrags.clear();
      targets.clear();
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
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    let target = hit?.closest("[data-drop-zone]");
    const { action, source } = this.drag;

    // Step 14: the whole lens (grid + cell) accepts the reagent drop.
    if (
      action === "reagent" &&
      this.game.step === 14 &&
      hit?.closest("#lens")
    ) {
      target = document.querySelector("#lens");
    }

    this.cancelDrag();
    if (target && this.game.isValidDrop(action, target.dataset.dropZone)) {
      this.handleDrop(action, target.dataset.dropZone, source);
    } else {
      this.invalidFeedback(
        source,
        target
          ? "Esa no es la zona correcta."
          : "Suelta el elemento sobre la zona resaltada.",
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
        this.completeStep();
      },
      "5:oocyte:petri2": () => {
        document.querySelector("[data-drop-zone='petri2']").append(source);
        this.game.flags.oocyteCollected = true;
        this.completeStep();
      },
      "6:petri2:microscope": () => {
        this.openMicroscope("oocyte");
        this.completeStep();
      },
      "7:holding-pipette:micro-oocyte": () => {
        document.querySelector(".micro-oocyte").classList.add("held");
        this.game.flags.oocyteHeld = true;
        this.completeStep();
      },
      "8:injection-needle:micro-oocyte": () => {
        this.animations.suction(document.querySelector(".micro-oocyte"));
        this.game.flags.oocyteEnucleated = true;
        document.querySelector("[data-draggable='oocyte']").hidden = true;
        this.updateInteractiveStates();
        this.schedule(
          () => this.completeStep(),
          6950,
        );
      },
      "9:enucleated-oocyte:petri3": () => {
        document.querySelector("[data-drop-zone='petri3']").append(source);
        this.completeStep();
      },
      "10:somatic-cell:petri3": () => {
        document.querySelector("[data-drop-zone='petri3']").append(source);
        this.completeStep();
      },
      "11:petri3:microscope": () => {
        this.openMicroscope("transfer");
        this.completeStep();
      },
      "12:holding-pipette:micro-somatic": () => {
        document.querySelector(".somatic-token").style.display = "none";
        document.querySelector(".enucleated-sample").style.display = "none";
        document.querySelector(".micro-somatic").classList.add("held");
        this.game.flags.somaticCellHeld = true;
        this.updateInteractiveStates();
      },
      "12:injection-needle:micro-somatic": () => {
        this.animations.suction(document.querySelector(".micro-somatic"));
        this.game.flags.somaticNucleusExtracted = true;
        this.updateInteractiveStates();
        document
          .querySelector("[data-draggable='injection-needle']")
          .classList.add("loaded");
        this.schedule(
          () => this.completeStep(),
          6950,
        );
      },
      "13:injection-needle:micro-oocyte": () => {
        this.game.flags.nucleusTransferred = true;
        this.updateInteractiveStates();
        //fadeout micro-somatic cell after suction animation completes
        document.querySelector(".micro-somatic").style.opacity = "0";
        document.querySelector(".micro-somatic").style.transition =
          "opacity 0.2s ease, transform 1s ease";
        // trasnlate micro-oocyte to the left
        document.querySelector(".micro-oocyte").style.transform =
          "translateX(-140px)";
        document.querySelector(".micro-oocyte").style.transition =
          "transform 1s ease";
        this.animations.injection(
          document.querySelector(".micro-oocyte"),
          () => this.completeStep(),
        );
      },
      "14:reagent:lens": () => {
        this.game.flags.embryoActivated = true;
        this.updateInteractiveStates();
        this.typeInstructionText(
          "Reactivo aplicado. Observa cómo el medio se tiñe y comienza la división.",
        );
        this.animations.activateEmbryo(
          document.querySelector(".micro-oocyte"),
          () => {
            this.game.flags.embryoDivisionComplete = true;
            this.closeMicroButton.disabled = false;
            this.typeInstructionText(
              "La división celular llegó a 16 células. Pulsa Regresar al laboratorio para continuar.",
            );
          },
        );
      },
      "15:embryo:surrogate": () => {
        source.classList.remove("visible");
        this.game.flags.embryoImplanted = true;
        document.querySelector(".white-mouse").classList.add("is-pregnant");
        this.game.advance();
        this.schedule(() => {
          this.game.flags.birthReady = true;
          document.querySelector(".white-mouse").classList.add("birth-ready");
          this.typeInstructionText(
            "La gestación se completó. Pulsa el vientre iluminado para revelar la cría.",
          );
          document.querySelector(".belly-target").tabIndex = 0;
          document.querySelector(".belly-target").focus();
        }, 2200);
      },
    };

    if (handlers[key]) handlers[key]();
    else
      this.invalidFeedback(source, "Esa acción no corresponde al paso actual.");
  }

  completeStep() {
    this.game.advance();
  }

  openMicroscope(mode) {
    const oocyte = document.querySelector(".micro-oocyte");
    const somatic = document.querySelector(".micro-somatic");
    this.microOverlay.classList.remove("hidden");
    this.closeMicroButton.disabled = true;
    oocyte.style.display = "block";
    oocyte.style.opacity = "1";
    oocyte.classList.remove("activated", "cleaving");
    oocyte.querySelector(".blastomere-field")?.remove();
    somatic.style.display = mode === "transfer" ? "block" : "none";
    document
      .querySelector("#lens")
      .classList.remove("reagent-wash", "reagent-wash-fade");
    // Second micromanipulation has both cells on screen, so tools enter vertically instead.
    document
      .querySelector("#lens")
      .classList.toggle("dual-cell", mode === "transfer");
    if (mode === "transfer") {
      oocyte.style.left = "52%";
      oocyte.querySelector(".micro-nucleus").classList.add("extracted");
      // Clear the first micromanipulation's leftover pipette/needle state before reusing the cells.
      [oocyte, somatic].forEach((cell) => {
        cell.classList.remove("held", "held-retract");
        cell
          .querySelectorAll(".suction-trail, .suction-progress")
          .forEach((element) => element.remove());
      });
      oocyte.classList.add("held");
    } else {
      oocyte.style.left = "31%";
    }
  }

  closeMicroscope() {
    this.microOverlay.classList.add("hidden");
    if (this.game.step === 9)
      document.querySelector(".enucleated-sample").classList.add("visible");
    if (this.game.step === 14 && this.game.flags.embryoDivisionComplete) {
      document.querySelector(".embryo-sample").classList.add("visible");
      this.game.advance();
    }
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
    this.typeInstructionText(
      "Su pelaje confirma que es genéticamente idéntica a la donante del núcleo, no a la donante del ovocito ni a la madre sustituta.",
    );
    this.status.textContent =
      "Experimento completado. Puedes reiniciarlo para repetir el procedimiento.";
  }

  toast(message, type = "") {
    clearTimeout(this.toastTimer);
    this.toastElement.replaceChildren();
    const text = document.createElement("span");
    text.textContent = message;
    this.toastElement.append(text);
    this.toastElement.className = `toast show ${type}`;
    this.toastTimer = window.setTimeout(
      () => this.toastElement.classList.remove("show"),
      7800,
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
    this.toastTimer = null;
    this.sequenceTimers.forEach((timer) => clearTimeout(timer));
    this.sequenceTimers = [];
    this.animations.reset();
    document.body.classList.remove("is-dragging");
    document
      .querySelectorAll(".shake, .dragging-source")
      .forEach((element) =>
        element.classList.remove("shake", "dragging-source"),
      );

    const grayMouse = document.querySelector(".gray-mouse");
    const brownMouse = document.querySelector(".brown-mouse");
    const labStage = document.querySelector("#lab-stage");
    const cloneButton = document.querySelector("#clone-button");
    const somaticToken = document.querySelector(
      "[data-draggable='somatic-cell']",
    );
    const oocyteToken = document.querySelector("[data-draggable='oocyte']");
    const enucleatedSample = document.querySelector(".enucleated-sample");
    const embryoSample = document.querySelector(".embryo-sample");

    grayMouse.append(somaticToken);
    brownMouse.append(oocyteToken);
    labStage.insertBefore(enucleatedSample, cloneButton);
    labStage.insertBefore(embryoSample, cloneButton);

    // Restore complete token state, including inline styles set during step 12.
    somaticToken.hidden = false;
    somaticToken.className =
      "cell-token somatic-token draggable cell-hidden";
    somaticToken.style.removeProperty("display");
    somaticToken.style.removeProperty("opacity");
    somaticToken.style.removeProperty("transform");
    somaticToken.style.removeProperty("transition");

    oocyteToken.hidden = false;
    oocyteToken.className = "cell-token oocyte-token draggable cell-hidden";
    oocyteToken.style.removeProperty("display");
    oocyteToken.style.removeProperty("opacity");
    oocyteToken.style.removeProperty("transform");
    oocyteToken.style.removeProperty("transition");

    enucleatedSample.className = "sample-token enucleated-sample draggable";
    enucleatedSample.style.removeProperty("display");
    enucleatedSample.style.removeProperty("opacity");
    enucleatedSample.style.removeProperty("transform");
    enucleatedSample.style.removeProperty("transition");

    embryoSample.className = "sample-token embryo-sample draggable";
    embryoSample.style.removeProperty("display");
    embryoSample.style.removeProperty("opacity");
    embryoSample.style.removeProperty("transform");
    embryoSample.style.removeProperty("transition");

    const oocyte = document.querySelector(".micro-oocyte");
    const somatic = document.querySelector(".micro-somatic");
    [oocyte, somatic].forEach((cell) => {
      cell.classList.remove("held", "held-retract", "activated", "cleaving");
      cell.style.removeProperty("opacity");
      cell.style.removeProperty("transform");
      cell.style.removeProperty("transition");
      cell.querySelector(".blastomere-field")?.remove();
      const nucleus = cell.querySelector(".micro-nucleus");
      nucleus?.classList.remove("extracted");
      nucleus?.style.removeProperty("opacity");
      nucleus?.style.removeProperty("transform");
    });
    oocyte.style.left = "31%";
    somatic.style.display = "none";
    document
      .querySelector("#lens")
      .classList.remove("dual-cell", "reagent-wash", "reagent-wash-fade");
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
    this.toastElement.replaceChildren();
    this.game.reset();
    this.renderStep();
    document.querySelector("#start-button").focus();
  }
}

const game = new GameState(() => ui.renderStep());
const animations = new AnimationEngine(document);
const ui = new UIController(game, animations);
ui.renderStep();
