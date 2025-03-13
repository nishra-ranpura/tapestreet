// Initialize the map centered in Queens
var map = L.map('map', {
    center: [40.728, -73.92],
    zoom: 12,
    scrollWheelZoom: false, // Disable zooming with scroll wheel
    keyboard: false, // Disable keyboard interactions (Tab, Space)
    boxZoom: false, // Disable zooming via shift + drag
    dragging: true, // Keep dragging enabled
    zoomControl: true, // Keep zoom controls
    tap: false // Disable touch interactions that might cause scrolling
}).setView([40.728, -73.92], 12);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Function to load and process CSV data
function loadCSV(filePath, isIntersection) {
    Papa.parse(filePath, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            console.log(`Loaded CSV: ${filePath}`, results.data);
            
            results.data.forEach(row => {
                if (!row.paths) return;

                if (isIntersection) {
                    let [lat, lon] = row.paths.split('|')[0].split(',').map(Number);
                    
                    let circle = L.circleMarker([lat, lon], {
                        radius: 5,
                        color: "transparent",
                        fillColor: "red",
                        fillOpacity: 0.7
                    }).addTo(map);

                    circle.on("click", function () {
                        openOverlay(row["new_name"], row["biographical_information"]);
                    });
                } else {
                    let points = row.paths.split('|').map(coord => {
                        let [lat, lon] = coord.split(',').map(Number);
                        return [lat, lon];
                    });

                    let polyline = L.polyline(points, { color: 'blue', weight: 4 }).addTo(map);
                    polyline.on("click", function () {
                        openOverlay(row["new_name"], row["biographical_information"]);
                    });
                }
            });
        }
    });
}

// Load both datasets
loadCSV("output-query-street-latlon.csv", false);
loadCSV("output-query-intersection-latlon.csv", true);

// Open overlay with weave animation
// Function to show modal with p5.js sketch
// Open modal with new street/intersection info
function openOverlay(newName, bioInfo) {
    document.getElementById("new-name").innerText = newName || "N/A";
    document.getElementById("bio-info").innerText = bioInfo || "N/A";
    
    // Only show the modal, don't touch the map
    document.getElementById("weaveOverlay").style.display = "block";

    // Start p5 sketch in the modal
    startWeaveSketch(newName + " " + bioInfo);

    setTimeout(() => {
        let overlayContent = document.querySelector(".overlay-content");
        overlayContent.scrollTo({ top: overlayContent.scrollHeight, behavior: "smooth" });
    }, 500); // Small delay to ensure content is fully rendered
}


// Close overlay
function closeOverlay() {
    document.getElementById("weaveOverlay").style.display = "none";

    // Stop and remove the p5.js sketch
    if (window.sketchInstance) {
        window.sketchInstance.remove();
        console.log("Sketch instance has stopped.");
function stopWeavingSketch() {
    if (sketchInstance) {
        sketchInstance.remove();
        sketchInstance = null;
    }
}
        window.sketchInstance = null; // Clear the reference
    }
}




