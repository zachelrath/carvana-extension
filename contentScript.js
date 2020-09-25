
const removeIcon = () => 
    `<svg class="jss50 close-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="false" tabindex="-1" width="20" height="20">
        <g>
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
        </g>
    </svg>`;

const getTiles = () => document.querySelectorAll(`a[data-qa="vehicle-link"]`);

const storageKey = "carvana++.carsToIgnore";
let ignoredCars;

// Load up all cars that the user has previously ignored
chrome.storage.sync.get(storageKey, function (result) {
    if (result[storageKey]) {
        ignoredCars = result[storageKey];
    }
    else {
        ignoredCars = [];
    }
});

const ignoreCar = async (carId) => {
    return new Promise(resolve => {
        if (!ignoredCars.includes(carId)) {
            ignoredCars.push(carId);
        }
        chrome.storage.sync.set({ [storageKey]: ignoredCars }, function () {
            console.log('Added ' + carId + " to stored list of cars to ignore");
            resolve();
        });
    });
}

const getVehicleIdFromLink = link => {
    let vehicleId = link.getAttribute("href");
    if (!vehicleId.startsWith("/vehicle/")) return;
    else return vehicleId.substring("/vehicle/".length);
};
// Hides the parent element from the DOM
// (rather than removing it, which may cause scripts to bomb)
const hideTile = (tile) => tile.setAttribute("style", "display:none;");
const removeIconClass = "carvana-plus-plus-remove-icon";

const checker = setInterval(() => {
    const tiles = getTiles();
    if (tiles.length) {
        // Append a remove icon to all car tiles
        tiles.forEach(link => {
            // If this tile corresponds to a tile that the user has indicated that they don't want to see again,
            // then remove it from the results list
            const vehicleId = getVehicleIdFromLink(link);

            if (ignoredCars.includes(vehicleId)) {
                console.log("this car is in our list of ignored vehicles, so we are removing the tile: " + vehicleId);
                hideTile(link.parentElement);
                return;
            }

            // Otherwise, add a remove icon tile so that the user can choose to ignore this vehicle if desired
            const el = document.createElement("div");
            el.setAttribute("style", "position: absolute; right: 46px; top: 15px; z-index: 50;");
            el.setAttribute("class", removeIconClass);
            el.innerHTML = removeIcon();
            // Attaching listener here because there are other handlers bound higher up which will override us
            el.addEventListener("click", async function(event) {
                console.log("and it was on our remove icon!");
                const link = event.currentTarget.parentElement.parentElement.parentElement;
                const vehicleId = getVehicleIdFromLink(link);
                // Nothing else to be done here, stop propagation
                event.stopImmediatePropagation();
                event.preventDefault();
                // disable the link so that we won't get taken to it
                link.setAttribute("href", "javascript:");
                hideTile(link.parentElement);
                // Add the car to our list of cars to ignore
                await ignoreCar(vehicleId);
            }, true);

            // Insert the remove icon before the first child of our grandchild <section> tag
            link.firstElementChild.firstElementChild.firstElementChild.before(el);
        });
        clearInterval(checker);
    }
}, 200);

