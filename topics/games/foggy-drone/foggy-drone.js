/** 
 * Simulated "Drone" with Fog-Peeking Hole Detection and Lasing Capabilities For Foggy Golfers.
 *
 * [Verified working for Foggy Golf Beta v1.0.0]
 *
 * Copy & Paste this into your DevTools Console Window (😅 "What, me worry?")
 *
 * A new button will be added to the club options section: 👁️
 * - 1st click: Level 3 Scan - lases a wide area hint
 * - 2nd click: Level 2 Scan - lases a narrow area hint
 * - 3rd click: Level 1 Scan - lases exact hole location
 *
 * Does not reveal tree, water, bunker obstacles. 
 *
 * Happy Golfing!
**/
const DEBUG = false;
function dbg() { if (DEBUG) console.log(...arguments) };

await(async () => {
  // Known working for FOGGY.Golf v1.0.0
  const EXPECTED_VERSION = "1.0.0";

  let courseRows = 8;
  let courseCols = 8;
  let holeCoordinates = null;
  let scanClear = null;
  let droneDeployCount = 0;
  let resolution = 2;

  if (!versionCheck()) {
    console.log("FoggyDrone: Sorry, FoggyDrone is not compatible wth this version of FOGGY.Golf.");
    return;
  }
  // Initialize the "drone" and inject the button into the UI.
  await foggyDroneInit();
  injectDroneButton();

  function versionCheck() {
    /**
     * Checks the current version of FOGGY.Golf and compares it to the expected version.
     */
    let foundVersion = "could not find version";
    const heading = document.querySelector("h1");

    if (heading && heading.innerText === "FOGGY.Golf") {
      const hParent = heading.parentElement;
      const firstParagraph = hParent.querySelector("p");
      if (firstParagraph && firstParagraph.innerText) {
        const versionMatch = firstParagraph.innerText.match(/([a-zA-Z]+)?\s*(\d+\.\d+\.\d+).*/);
        foundVersion = versionMatch && versionMatch[0] ? versionMatch[0] : foundVersion;
      }
    }
    dbg({ foundVersion });
    return foundVersion === EXPECTED_VERSION
  }


  async function foggyDroneInit() {
    /**
     * Search sources for today's course pattern and sets the hole coordinates.
     */

    const componentUrlAttribute = "component-url";
    const astroIslands = Array.from(document.querySelectorAll("astro-island"));
    const main = astroIslands.filter((i) => i.attributes[componentUrlAttribute].value.startsWith("./_astro/main"))[0];
    const componentUrl = main?.getAttribute(componentUrlAttribute) ?? "";

    const componentUrlPath = /(.+\/)[^/]*/.exec(componentUrl)[1] ?? null;
    if (!componentUrlPath) {
      throw new Error("FoggyDrone: No main Astro islands found.");
    };

    const USEastDateNow = new Intl.DateTimeFormat(
      'en-CA', // Use 'en-CA' for ISO format YYYY-MM-DD
      {
        timeZone: 'America/New_York',
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).format();

    const todaysCoursePattern = new RegExp(`"${USEastDateNow}"\s*:\s*([^}]+})`);
    const courseArrayPattern = /map\s*:\s*['"]([a-z]+)['"]/;
    const importPattern = /import\s*.*?"(.\/[^"]+)/ig;
    let todaysCoursePatternMatch = null;

    // Safety trigger limit to prevent greedy or infinite looping. Limits the number of target source files to inspect.
    const SAFETY_TRIGGER_LIMIT = 5;
    const componentUrls = componentUrl ? [componentUrl] : [];

    dbg(">>> componentUrls:", JSON.stringify(componentUrls, null, 2));

    // Search through sources for today's course pattern; stop when found or if we hit the defined safety limit.
    for (
      let safetyTrigger = 0;
      safetyTrigger < SAFETY_TRIGGER_LIMIT && componentUrls.length > 0 && todaysCoursePatternMatch === null;
      safetyTrigger++
    ) {
      let sourceOutput = "";
      try {
        const sourceFetchResponse = await fetch(componentUrls.pop())
        const sourceReader = sourceFetchResponse.body.getReader();
        let encodedData;
        do {
          encodedData = await sourceReader.read();
          sourceOutput += encodedData?.value ? new TextDecoder().decode(encodedData.value) : "";
        } while (!encodedData?.done);
      } catch {
        continue;
      };

      let importMatch;
      do {
        importMatch = importPattern.exec(sourceOutput);
        if (importMatch && importMatch[1] && importMatch[1].includes("main")) {
          componentUrls.push(`${componentUrlPath}${importMatch[1]}`)
        }
      } while (importMatch);

      todaysCoursePatternMatch = todaysCoursePattern.exec(sourceOutput);
    }

    if (todaysCoursePatternMatch == null) {
      console.log("FoggyDrone: Could not find course; Fog too thick");
      return;
    };

    const courseArrayJson = courseArrayPattern.exec(todaysCoursePatternMatch[1]) ?? [];
    dbg(">>>", todaysCoursePatternMatch);
    dbg(">>>", courseArrayJson);

    let course = courseArrayJson[1] ?? [];
    dbg(">>> course", course);

    if (!course) {
      throw new Error("FoggyDrone: Could not find course; Fog thicker than molasses!");
    }

    for (let row = 0; row < courseRows; row++) {
      if (holeCoordinates) {
        break;
      };

      for (let col = 0; col < courseCols; col++) {
        if (course[row * courseCols + col] === 'h') {
          holeCoordinates = { x: col, y: row };
          break;
        }
      }
    }
    dbg(">>> holeCoordinates", holeCoordinates);
    if (!holeCoordinates) {
      throw new Error("FoggyDrone: Could not find hole; Fog too thick.");
    }
  }


  function foggyDroneScan() {
    /** 
     * Applies the hint highlighting to the hole location at three levels based on the current resolution: 
     * Wide-Area, Narrow-Area, Exact
     **/

    if (scanClear) {
      scanClear()
    };

    droneDeployCount++;
    // Scan resoultion values: 2 = wide-area, 1 = narrow-area, 0 = exact location
    resolution = [2, 1, 0][(droneDeployCount - 1) % 3];

    function getHintCoordinates(x, y, resolution) {
      const cells = [];

      for (let col = -resolution; col <= resolution; col++) {
        for (let row = -resolution; row <= resolution; row++) {
          if (x + col >= 0 && x + col < courseCols && y + row >= 0 && y + row < courseRows) {
            cells.push([x + col, y + row]);
          }
        }
      }
      return cells;
    }

    // For wide and narrow resolution, fuzz the hole coordinates so that the hole
    //  is not always located in the center of the highlighted hint area.
    let xFuzzing = resolution !== 0 ? Math.floor(Math.random() * 2) : 0;
    let yFuzzing = resolution !== 0 ? Math.floor(Math.random() * 2) : 0;
    let hintCoordinates = getHintCoordinates(holeCoordinates.x + xFuzzing, holeCoordinates.y + yFuzzing, resolution);

    const courseCanvasContainer = document.querySelector('div.aspect-square');
    if (!courseCanvasContainer) {
      throw new Error("FoggyDrone: Are you sure we are at the golf course?");
    }

    let overlayId = "d-r-o-n-e_overlay";
    let overlayCanvas = document.querySelector(`#${overlayId}`);
    if (!overlayCanvas) {
      // Create and inject the overlay canvas for rendering the hint grid.
      courseCanvasContainer.style.position = 'relative';
      const courseCanvas = courseCanvasContainer.querySelector('canvas');
      courseCanvas.style.position = 'absolute';
      courseCanvas.style.top = '0';
      courseCanvas.style.left = '0';
      overlayCanvas = document.createElement('canvas');
      overlayCanvas.id = overlayId;
      overlayCanvas.width = courseCanvas.width;
      overlayCanvas.height = courseCanvas.height;
      const courseCanvasStyles = window.getComputedStyle(courseCanvas);
      Object.values(courseCanvasStyles).forEach(property => {
        overlayCanvas.style[property] = courseCanvasStyles.getPropertyValue(property);
      });
      overlayCanvas.style.position = 'absolute';
      overlayCanvas.style.pointerEvents = 'none';
      courseCanvas.parentElement.appendChild(overlayCanvas);
    }

    const ctx = overlayCanvas.getContext('2d');
    const cellWidth = overlayCanvas.width / courseCols;
    const cellHeight = overlayCanvas.height / courseRows;

    let colorAlpha = 0;
    let fadingIn = true;
    let animationEnabled = true;

    function animate() {
      if (!animationEnabled) {
        return;
      };

      ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      hintCoordinates.forEach(([x, y]) => {
        ctx.fillStyle = `rgba(128, 0, 0, ${colorAlpha})`;
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
      });

      if (fadingIn) {
        colorAlpha += 0.01;
        if (colorAlpha >= 0.33) {
          fadingIn = false
        }
      } else {
        colorAlpha -= 0.01;
        if (colorAlpha <= 0) {
          fadingIn = true
        }
      }

      requestAnimationFrame(animate);
    }

    animate();

    if (!scanClear) {
      scanClear = () => {
        animationEnabled = !animationEnabled;
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      };
    }
  }

  function injectDroneButton() {
    /**
     * Adds a new button in the club options section for deploying the drone.
     * Each click cycles through the three scan resolutions.
     */

    if (document.querySelector("#d-r-o-n-e")) {
      // Drone button already exists.
      return;
    }

    try {
      const droneBtn = document.createElement("button");
      droneBtn.id = "d-r-o-n-e";
      droneBtn.classList.add("club-button");
      droneBtn.innerText = "👁️";

      const droneBtnText = document.createElement("p");
      droneBtnText.innerText = resolution + 1;
      ["w-[1em]", "h-[1em]", "absolute", "right-0.5", "bottom-[5px]", "text-base"].forEach((v) => droneBtnText.classList.add(v));
      droneBtn.appendChild(droneBtnText);

      droneBtn.addEventListener("click", async () => {
        if (droneBtn.disable) {
          return;
        };

        droneBtn.disable = true;
        try {
          foggyDroneScan();
          droneBtnText.innerText = resolution;
          droneBtn.disable = resolution === 0;
        } catch (err) {
          console.log(err);
          console.log("FoggyDrone: Could not deploy drone.");
        }
      });

      const clubBtnContainer = document.querySelector(".club-button").parentElement;
      clubBtnContainer.appendChild(droneBtn);
      console.log("FoggyDrone: Drone ready.");
    } catch (err) {
      console.log(err);
      console.log("FoggyDrone: Could not provide Drone 👁️ button.");
    }
  }
})().catch((err) => {
  console.error(err);
  console.log("FoggyDrone: Could not deploy drone.");
});
