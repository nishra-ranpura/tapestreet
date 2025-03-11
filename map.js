document.addEventListener("DOMContentLoaded", function() {
    var map = L.map('map').setView([40.728, -73.92], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    function loadCSV(filePath, isIntersection) {
        Papa.parse(filePath, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                results.data.forEach(row => {
                    if (!row.paths) return;

                    if (isIntersection) {
                        let [lat, lon] = row.paths.split('|')[0].split(',').map(Number);

                        let marker = L.circleMarker([lat, lon], {
                            radius: 5,
                            color: "transparent",
                            fillColor: "red",
                            fillOpacity: 0.7
                        }).addTo(map);

                        marker.on("click", function() {
                            openOverlay(row["new_name"], row["biographical_information"]);
                        });

                    } else {
                        let points = row.paths.split('|').map(coord => coord.split(',').map(Number));
                        
                        let polyline = L.polyline(points, { color: 'blue', weight: 4 }).addTo(map);
                        
                        polyline.on("click", function() {
                            openOverlay(row["new_name"], row["biographical_information"]);
                        });
                    }
                });
            }
        });
    }

    loadCSV("output-query-street-latlon.csv", false);
    loadCSV("output-query-intersection-latlon.csv", true);

    function openOverlay(name, bio) {
        document.getElementById("street-name").innerText = name;
        document.getElementById("bio-info").innerText = bio;
        document.getElementById("overlay").style.display = "flex";

        // Start the weaving animation automatically (no button needed)
        startWeavingSketch(name + " " + bio);
    }

    // Close overlay and stop the sketch
    document.getElementById("close-overlay").addEventListener("click", function () {
        document.getElementById("overlay").style.display = "none";
        stopWeavingSketch();
    });
});
