// MACE Stellarium Utility (UI, Visualization, Export)
(function() {
    console.log("MACE Stellarium Utility Loaded");

    // Initialize Global Data Container if not already present
    window.maceStellariumData = window.maceStellariumData || {
        location: null,
        horizonPoints: [],
        gazetteer: [],
        crossingPoints: [] 
    };

    // --- 1. Modal & UI Management ---

    // Global function to trigger the workflow from the Main Calculator
    window.openStellariumModal = function() {
        console.log("Opening Stellarium Modal...");
        // Pre-fill crossing points if the box is checked
        populateCrossingPoints();
        
        // Show Bootstrap Modal
        $('#stellariumModal').modal('show');
        
        // Draw the visualization after a brief delay to ensure modal is rendered
        setTimeout(drawHorizonVisualisation, 300);
    };

    // Helper to add calculated points (Solstices, etc) to the Gazetteer
    function populateCrossingPoints() {
        const chk = document.getElementById('addCrossingPoints');
        if (!chk || !chk.checked) return;

        const crossings = window.maceStellariumData.crossingPoints;
        if(!crossings) return;

        crossings.forEach(cp => {
            // Avoid duplicates based on label
            const exists = window.maceStellariumData.gazetteer.some(g => g.label === cp.label);
            if (!exists) {
                window.maceStellariumData.gazetteer.push(cp);
            }
        });
        renderGazetteerTable();
    }

    // --- 2. Visualization (Canvas) ---

    function drawHorizonVisualisation() {
        const canvas = document.getElementById('stellariumHorizonCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const W = canvas.width = 2000; // Wide canvas for scrolling
        const H = canvas.height; // Height (e.g. 280)
        
        // Background
        ctx.fillStyle = '#1c2a48';
        ctx.fillRect(0, 0, W, H);
        
        // Zero Altitude Line (Horizon)
        const zeroY = H / 2;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, zeroY);
        ctx.lineTo(W, zeroY);
        ctx.stroke();

        // Azimuth Grid
        ctx.fillStyle = '#ffffff';
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        for (let az = 0; az <= 360; az += 10) {
            const x = (az / 360) * W;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
            ctx.fillText(az + "°", x, H - 5);
        }

        // 1. Draw Horizon Profile
        const points = window.maceStellariumData.horizonPoints;
        if (points && points.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = '#d9534f'; // Red
            ctx.lineWidth = 2;
            
            // Vertical Scale: +/- 5 degrees fits in half height
            // Adjust scale if needed based on max altitude in data
            const scaleY = (H / 2) / 10; // 10 degrees range up/down

            points.forEach((p, i) => {
                // p is {az, alt}
                const x = (p.az / 360) * W;
                const y = zeroY - (p.alt * scaleY);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            
            // Fill below horizon
            ctx.lineTo(W, H);
            ctx.lineTo(0, H);
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fill();
        }

        // 2. Draw Gazetteer Markers
        const gaz = window.maceStellariumData.gazetteer;
        if(gaz && gaz.length > 0) {
            gaz.forEach(item => {
                const az = parseFloat(item.az);
                const alt = parseFloat(item.alt);
                
                const x = (az / 360) * W;
                const scaleY = (H / 2) / 10;
                const y = zeroY - (alt * scaleY); // Position at actual altitude

                // Pin Line
                ctx.beginPath();
                ctx.strokeStyle = '#5cb85c'; // Green
                ctx.lineWidth = 1;
                ctx.moveTo(x, y);
                ctx.lineTo(x, y - 30);
                ctx.stroke();

                // Label
                ctx.fillStyle = '#5cb85c';
                ctx.fillText(item.label, x, y - 35);
            });
        }
    }

    // --- 3. Gazetteer Management ---

    function renderGazetteerTable() {
        const tbody = document.getElementById('gazetteerTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        window.maceStellariumData.gazetteer.forEach((item, index) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td><input type="text" class="form-control input-sm" value="${item.label}" onchange="window.updateGazItem(${index}, 'label', this.value)"></td>
                <td>${parseFloat(item.az).toFixed(4)}</td>
                <td>${parseFloat(item.alt).toFixed(4)}</td>
                <td><button class="btn btn-danger btn-xs" onclick="window.removeGazItem(${index})"><i class="fa fa-trash"></i></button></td>
            `;
        });
        drawHorizonVisualisation();
    }

    // Global helpers for inline HTML events
    window.updateGazItem = function(index, field, value) {
        window.maceStellariumData.gazetteer[index][field] = value;
        drawHorizonVisualisation();
    };
    window.removeGazItem = function(index) {
        window.maceStellariumData.gazetteer.splice(index, 1);
        renderGazetteerTable();
    };
    // Used by map popup
    window.addGazetteerPoint = function(label, az, alt) {
        window.maceStellariumData.gazetteer.push({
            label: label, az: az, alt: alt, vShift: 10, hShift: 0
        });
        renderGazetteerTable();
    };

    // --- 4. Export Logic ---

    function exportStellariumZip() {
        if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
            alert("Export Error: JSZip or FileSaver libraries not found.");
            return;
        }

        const zip = new JSZip();
        const data = window.maceStellariumData;
        
        // Prepare Metadata
        const nameInput = document.getElementById('stel-name');
        const authorInput = document.getElementById('stel-author');
        const descInput = document.getElementById('stel-desc');

        const name = (nameInput && nameInput.value) ? nameInput.value : (data.location ? data.location.name : "MACE Horizon");
        const author = (authorInput && authorInput.value) ? authorInput.value : "MACE User";
        const desc = (descInput && descInput.value) ? descInput.value : "Generated by MACE";
        
        // Inversion check
        let inverted = "";
        if(data.horizonPoints.length > 0) {
            const avgAlt = data.horizonPoints.reduce((sum, p) => sum + p.alt, 0) / data.horizonPoints.length;
            if(avgAlt < 0) inverted = "polygonal_horizon_inverted = true";
        }

        // 1. landscape.ini
        const ini = `[landscape]
name = ${name}
author = ${author}
description = ${desc}
type = polygonal
polygonal_horizon_list = horizon.txt
polygonal_angle_rotatez=0.00001
ground_color = .15,.45,.45
horizon_line_color = .25,.15,.15
minimal_brightness = 0.15
${inverted}

[location]
light_pollution = 7
atmospheric_extinction_coefficient = 0.29
atmospheric_temperature = 10
atmospheric_pressure = -1
planet = Earth
latitude = ${data.location ? data.location.lat : 0}
longitude = ${data.location ? data.location.lon : 0}
altitude = ${data.location ? data.location.elev : 0}
timezone = UTC
`;
        zip.file("landscape.ini", ini);

        // 2. horizon.txt
        let hTxt = "";
        data.horizonPoints.forEach(p => { hTxt += `${p.az} ${p.alt}\n`; });
        zip.file("horizon.txt", hTxt);

        // 3. gazetteer.en.utf8
        let gTxt = "";
        data.gazetteer.forEach(g => {
            gTxt += `${g.az} | ${g.alt} | ${g.vShift || 10} | ${g.hShift || 0} | ${g.label}\r\n`;
        });
        zip.file("gazetteer.en.utf8", gTxt);

        zip.generateAsync({type:"blob"}).then(function(content) {
            saveAs(content, `Stellarium_${name.replace(/\s+/g,'_')}.zip`);
        });
    }

    // Initialize Listeners
    $(document).ready(function() {
        $('#btnExportStellarium').click(exportStellariumZip);
        $('#addCrossingPoints').change(populateCrossingPoints);
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            if (e.target.hash === '#stel-vis') drawHorizonVisualisation();
        });
    });

})();