obliquity = 23.4
periheliondaynumber = 197.26
tropicalyear = 0
eccentricityvalue = 0.0182
agea = 2000

// Added
objectnew = 1
azi = 231.70
errorazi = 0.2
formcalcappalt = 0
givenalt = 0
formcalcalt = -0.56
formerrorcalcalt = 0.24
decl = -23.43
errordecl = 0.23
dagen = 181
errordagen = 18
datum = 19 - 12 - 2000
datum2 = 24 - 12 - 1999
riseangle = 32
angel = 0
celsius = -17.777
meter = 0
kmeters = 0
mbar = 0
mbarmm = 0

solstice = "1"
equinox = "1"
crossquarter = "1"
major = "1"
minor = "1"

kknew = "1"

kkoud = ""
eclipoud = ""
methodoud = ""
eclipoud = ""
methodold = ""
objectoud = ""
heightoud = ""
sooud = ""
diskoud = ""

HH = 10
Km = 1
AA = 0
givenalt = 0
errorappalt = 0.2
erroralt = 0.25
H = 0

methodnew = 2

function compute() {
   window.status = "Calculations ongoing"
   var datumzon = new Date("Jun 21, 2004 00:00:00")
   var datumzon2 = new Date("Jun 21, 2004 00:00:00")

   //parse form field values and check them on boundary values. 
   angela = parseFloat(angel)
   //determine object
   objecta = parseFloat(objectnew)
   if (isNaN(objecta)) {
      objecta = objectoud
   }
   if (objecta == "") {
      objecta = 0
   }
   objectoud = objecta

   if (document.getElementById('height1').checked) {
      height = document.getElementById('height1').value;
   }

   if (document.getElementById('height2').checked) {
      height = document.getElementById('height2').value;
   }

   heighta = parseFloat(height)
   if (isNaN(heighta)) {
      heighta = heightoud
   }
   if (heighta == "") {
      heighta = 1
   }
   if (heighta == 1) {
      heighta = 1
   }
   if (heighta == 2) {
      heighta = 2
   }
   heightoud = heighta
   kka = parseFloat(kknew)
   if (isNaN(kka)) {
      kka = kkoud
   }
   // Thom, 1973, page 32  (for mid night) and page 31 (for set/rise) and page 32 (for day)
   if (kka == "") {
      kka = 2
   }

   if (kka == 1) {
      ka = 12
   }
   if (kka == 2) {
      ka = 8.5
   }
   if (kka == 3) {
      ka = 6.9
   }
   kkoud = kka

   if (document.getElementById('disknew1').checked) {
      disknew = document.getElementById('disknew1').value;
   }

   if (document.getElementById('disknew2').checked) {
      disknew = document.getElementById('disknew2').value;
   }

   if (document.getElementById('disknew3').checked) {
      disknew = document.getElementById('disknew3').value;
   }

   diskaa = parseFloat(disknew)
   if (isNaN(diskaa)) {
      diskaa = diskoud
   }
   if (diskaa == "") {
      diskaa = 3
   }

   if (diskaa == 1) {
      diska = 1
   }
   if (diskaa == 2) {
      diska = 0
   }
   if (diskaa == 3) {
      diska = -1
   }
   diskoud = diskaa
   age = parseFloat(document.getElementById("age").value)
   agea = age
   if (agea == 0) {
      age = 1
   }
   if (agea < 1) {
      agea = agea + 1
   }
   if (agea < 1) {
      datumzon.setFullYear(agea - 1);
      datumzon2.setFullYear(agea - 1)
   }
   else {
      datumzon.setFullYear(agea);
      datumzon2.setFullYear(agea)
   };

   month = 0
   day = 0
   ut = 0
   // For Julian calendar dates with either negative (BCE) or positive (CE)
   // calculate the julian emphemeris day
   // http://scienceworld.wolfram.com/astronomy/JulianDate.html
   jd = 367 * agea - Math.floor(7 * (agea + 5001 + Math.floor((month - 9) /
      7)) / 4) + Math.floor(275 * month / 9) + day + 1729776.5 + ut / 24
   //epoch 2000.0
   T = (jd - 2451545) / 36525
   //epoch 1900.5    
   tt = (agea - 1900) / 100
   //1000 Julian years form J2000.0
   Tbret = (agea - 2000) / 1000
   //using Bretagnon page 6
   obliquity = (23.4392911 - 0.130025833 * Tbret - 0.00000430556 * Math.pow(
         Tbret, 2) + 0.000555347 * Math.pow(Tbret, 3) - 0.00000142722 * Math
      .pow(Tbret, 4) - 0.000000693528 * Math.pow(Tbret, 5) -
      0.0000000108472 * Math.pow(Tbret, 6) + 0.000000000197778 * Math.pow(
         Tbret, 7)) / 180 * Math.PI
   //using Expl. Suppl, page 98
   eccentricityvalue = 0.01675104 - 0.0000418 * tt - 0.000000126 * tt * tt
   periheliondaynumber = (197.26 + (agea - 2000) * 0.017808333)
   // http://www.treasure-troves.com/astro/TropicalYear.html
   tropicalyear = 365.2421896698 - 0.00000615359 * T - 0.000000000729 * T * T +
      0.000000000264 * T * T * T
   eclipa = obliquity
   azia = parseFloat(azi) * Math.PI / 180
   lata = parseFloat(document.getElementById("latbox").value)
   if (lata < 0 || isNaN(lata)) {
      alert("ERROR: LATITUDE should be positive")
   }
   lata = lata / 180 * Math.PI
   methoda = methodnew
   if (isNaN(methoda)) {
      methoda = methodoud
   }

   if (methoda == "") {
      methoda = 3
   }
   methodoud = methoda
   if (methoda == 1 || methoda == 2 || methoda == 3) {
      hha = HH
      if (hha < 0 || isNaN(hha)) {
         alert("ERROR: LOCAL HEIGHT should be positive")
      }
      pa = parseFloat(document.getElementById("P").value)
      if (pa < 0 || isNaN(pa)) {
         alert("ERROR: AIR PRESSURE should be positive")
      }
      ta = 273.15 + parseFloat(document.getElementById("T").value)
      if (ta <= 0 || isNaN(ta)) {
         alert("ERROR: TEMPERATURE should be higher than -273°C")
      }
      if (heighta == 2) {
         ta = ta - 6.5 * hha / 1000
         // use average temp (sea and local temp) for airpressure determination
         pa = pa * Math.exp(-9.80665 * 0.0289644 / (ta + 3.25 * hha / 1000) /
            8.31441 * hha)
      };
   }
   ha = H
   if (ha < 0 || isNaN(ha)) {
      alert("ERROR: DISTANT HEIGHT altitude should be positive")
   }
   errorazia = parseFloat(errorazi)
   if (errorazia < 0 || isNaN(errorazia)) {
      alert("ERROR AZIMUTH should be positive")
   }
   erroralta = erroralt
   if (erroralta < 0 || isNaN(erroralta)) {
      alert("ERROR: ERROR ALTITUDE should be positive")
   }
   errorappalta = errorappalt
   if (errorappalta < 0 || isNaN(errorappalta)) {
      alert("ERROR: ERROR APPARENT ALTITUDE should be positive")
   }
   errorlata = parseFloat(document.getElementById("errorlat").value)
   if (errorlata < 0 || isNaN(errorlata)) {
      alert("ERROR: ERROR LATITUDE should be positive")
   }
   if (methoda == 1) {
      kma = Km
      if (kma <= 0 || isNaN(kma)) {
         alert("ERROR: DISTANCE should be positive")
      }
      // converted to SI-units from Thom, A., 1973, page 31
      //        calcappalt=0.057288*(ha-hha)/kma-0.00447387*kma+0.0087308*ka*kma*pa/ta/ta
      calcappalt = 0.057288 * (ha - hha) / kma - 0.00447387 * kma +
         0.008296359 * ka * kma * pa / ta / ta
      // determine the lowest altitude due to zero level sea
      checkappalt = -0.03203 * Math.sqrt(hha) * Math.sqrt(1 - 1.848042142 * ka *
         pa / ta / ta)
      if (checkappalt > calcappalt) {

         alert(
            "WARNING: The vast plain horizon at sea level is above the DISTANT OBJECT HEIGHT");
         calcappalt = checkappalt;
      }
   }
   if (methoda == 2) {
      // converted to SI-units from Thom, A., 1973, page 32
      if (ha > hha) {
         alert("ERROR: DISTANT HEIGHT should be smaller than LOCAL HEIGHT")
      }
      calcappalt = -0.03203 * Math.sqrt(hha - ha) * Math.sqrt(1 - 1.848042142 *
         ka * pa / ta / ta)
   }
   if (methoda == 3) {
      givenappalt = AA
      if (givenappalt < -2 || isNaN(givenappalt) || givenappalt > 30) {
         alert(
            "ERROR: APPARENT ALTITUDE should be higher than -2° and smaller than 30°")
      }
      calcappalt = givenappalt
   }
   if (methoda == 4) {
      calcalt = parseFloat(givenalt)
   }
   else {
      formcalcappalt = Math.round(calcappalt * 100) / 100
      // from Duffett-Smith, P., 1988 page 
      calcalt = calcappalt - pa * (0.1594 + 0.0196 * calcappalt + 0.00002 *
         calcappalt * calcappalt) / ta / (1 + 0.505 * calcappalt + 0.0845 *
         calcappalt * calcappalt)

      erroralta = errorappalta * (1 - pa / ta / (1 + 0.505 * calcappalt +
         0.0845 * calcappalt * calcappalt) / (1 + 0.505 * calcappalt +
         0.0845 * calcappalt * calcappalt) * ((1 + 0.505 * calcappalt +
         0.0845 * calcappalt * calcappalt) * (0.0196 + 0.00004 *
         calcappalt) - (0.1594 + 0.0196 * calcappalt + 0.00002 *
         calcappalt * calcappalt) * (0.505 + 0.169 * calcappalt)));
   }
   formerrorcalcalt = Math.round(erroralta * 100) / 100
   formcalcalt = Math.round(calcalt * 100) / 100
   calcalt = calcalt * Math.PI / 180
   //average parallax
   if (objecta == 1) {
      par = 0.952 / 180 * Math.PI * (Math.cos(calcalt) - Math.sin(calcalt * 2) *
         0.008258773)
   }
   if (objecta == 0) {
      //from Russell Simpson (refraction artcile)
      par = 0.00224 / 180 * Math.PI * Math.cos(calcalt)
   }
   if (objecta == -1) {
      par = 0
   }
   decla = Math.asin((Math.sin(lata) * Math.sin(calcalt + par) + Math.cos(
      lata) * Math.cos(calcalt + par) * Math.cos(azia)))
   decl = Math.round(180 / Math.PI * decla * 100) / 100
   alta = calcalt;
   // determing the error in declanation: http://www.iol.ie/~geniet/eng/accuracy.htm
   errordazi = errorazia / Math.cos(decla) * (Math.sin(lata) * Math.sin(alta) -
      Math.cos(lata) * Math.cos(alta) * Math.sin(azia));
   errordalt = erroralta / Math.cos(decla) * (Math.sin(lata) * Math.cos(alta) -
      Math.cos(lata) * Math.sin(alta) * Math.cos(azia));
   errordlat = errorlata / Math.cos(decla) * (Math.cos(lata) * Math.sin(alta) -
      Math.sin(lata) * Math.cos(alta) * Math.cos(azia));
   errordecl = Math.sqrt(errordazi * errordazi + errordalt * errordalt +
      errordlat * errordlat)
   errordecl = Math.round(errordecl * 100) / 100;
   riseangle = Math.round(180 / Math.PI * Math.acos(Math.sin(lata) / Math.cos(
      decla)))
   // Ruggles, 1999, page 54
   dagen = perihelionday(decla / Math.PI * 180, 0)
   dagen2 = perihelionday(decla / Math.PI * 180, 1)
   //	 alert(dagen2)
   datumzon.setDate(datumzon.getDate() + dagen + 0.5);
   datumzon2.setDate(datumzon2.getDate() + dagen2 - 0.5);
   if (objecta == 0) {
      dagen = Math.floor(dagen + 0.5);
      errordagen = Math.floor(0.5 + Math.abs(-errordecl / 180 * Math.PI / Math
         .sqrt(1 - Math.sin(decla) / Math.sin(eclipa) * Math.sin(decla) /
            Math.sin(eclipa)) * Math.cos(decla) / Math.sin(eclipa) /
         .9856 / Math.PI * 180))
      datum = datumzon.getDate() + " - " + (datumzon.getMonth() + 1) + " - " +
         datumzon.getFullYear();
      datum2 = datumzon2.getDate() + " - " + (datumzon2.getMonth() + 1) +
         " - " + datumzon2.getFullYear();
   }
   else {
      dagen = "NaN";
      errordagen = "NaN";
      datum = "NaN";

   }
   celsius = 5 / 9 * (angela - 32)
   meter = .3048 * angela
   kmeters = 1.609344 * angela
   mbar = angela * 33.7685
   mbarmm = angela * 1.328389

   //Berekeningen van set/rise van zon en maan
   hoek = eclipa
   hoek2 = eclipa
   hoek3 = eclipa
   hoek4 = eclipa
   hoek5 = eclipa
   hoek6 = eclipa

   // compensation for diameter of sun/moon
   calcalt = calcalt + diska * 16 / 60 / 180 * Math.PI
   calcalta = calcalt + diska * 16 / 60 / 180 * Math.PI
   calcaltb = calcalta + diska * 16 / 60 / 180 * Math.PI

   northazi = 0
   southazi = 180

   // solstice

   var sonewObj = solstice;
   for (var i = 0; i < sonewObj.length; i++) {
      if (sonewObj[i]) {
         soa = i + 1
      };
   }
   //alert(soa)
   //	soa=parseFloat(form.sonew.value)
   //	if (isNaN(soa)) {soa=sooud}

   if (soa == "") {
      soa = 1
   }

   sooud = soa
   //alert(form.sooud.value)
   // form.test.value = obliquity/Math.PI*180

   azimuth = 180 / Math.PI * Math.acos((Math.sin(hoek) - Math.sin(lata) * Math
      .sin(calcalt)) / Math.cos(lata) / Math.cos(calcalt))
   solsticeazisumrise = Math.round(azimuth * 100) / 100
   //alert(hoek/Math.PI*180)
   //alert(calcalt/Math.PI*180)
   //azimuth
   solsticeazisumset = Math.round((360 - azimuth) * 100) / 100
   azimuth = 180 / Math.PI * Math.acos((Math.sin(-hoek) - Math.sin(lata) * Math
      .sin(calcalt)) / Math.cos(lata) / Math.cos(calcalt))
   solsticeaziwinrise = Math.round(azimuth * 100) / 100
   solsticeaziwinset = Math.round((360 - azimuth) * 100) / 100
   window.status = "Calculations finished"

   $("#solsticeazisumrise").val(solsticeazisumrise);
   $("#solsticeazisumset").val(solsticeazisumset);
   $("#solsticeaziwinrise").val(solsticeaziwinrise);
   $("#solsticeaziwinset").val(solsticeaziwinset);

   var doc = document;
   doc.qrySel = doc.querySelector;
   doc.qrySelAll = doc.querySelectorAll; // shorthand
   var degFmt = Cookies.get('latlon-degree-format') || 'd';
   // show current preference
   doc.qrySel('#deg-format-' + degFmt).checked = true;

   // ---- listeners for orthodrome destination point from start point / bearing / distance

   // listener for updated values

   var lat1 = Dms.parseDMS($('#latbox').val());
   var lon1 = Dms.parseDMS($('#lngbox').val());
   var dist = $('#dist').val() * 1000; // convert km to metres

   var brng = Dms.parseDMS(solsticeazisumrise);
   var p1 = LatLon(lat1, lon1);
   var p2 = p1.destinationPoint(dist, brng);
   var brngFinal = p1.finalBearingTo(p2);

   var dd = p2.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var dd2 = dd.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var dd3 = dd2.substring(0, 7);
   var dd4 = dd2.substring(10, 18);
   var dd5 = dd2.substring(7, 10);
   var dd6 = dd2.substring(18, 21);

   solstice1lat = dd3 * dd5;
   solstice1long = dd4 * dd6;

   var p1dd = p1.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var p1dd2 = p1dd.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var p1dd3 = p1dd2.substring(0, 7);
   var p1dd4 = p1dd2.substring(10, 18);
   var p1dd5 = p1dd2.substring(7, 10);
   var p1dd6 = p1dd2.substring(18, 21);

   ddlat = p1dd3 * p1dd5;
   ddlong = p1dd4 * p1dd6;

   $('#ddlat').html(ddlat);
   $('#ddlong').html(ddlong);

   $('#result-point').html(p2.toString(degFmt));
   $('#result-brng').html(Dms.toBrng(brngFinal, degFmt));

   $('#brng').html(Dms.toBrng(brng, degFmt));

   $('#solstice1lat').html(solstice1lat);
   $('#solstice1long').html(solstice1long);

   var brng1 = Dms.parseDMS(solsticeazisumset);
   var p1a = LatLon(lat1, lon1);
   var p2a = p1a.destinationPoint(dist, brng1);
   var brngFinala = p1a.finalBearingTo(p2a);

   var dda = p2a.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var dda2 = dda.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var dda3 = dda2.substring(0, 7);
   var dda4 = dda2.substring(10, 18);
   var dda5 = dda2.substring(7, 10);
   var dda6 = dda2.substring(18, 21);

   solstice2lat = dda3 * dda5;
   solstice2long = dda4 * dda6;

   $('#ddlata').html(ddlat);
   $('#ddlonga').html(ddlong);

   $('#result-point1').html(p2a.toString(degFmt));
   $('#result-brng1').html(Dms.toBrng(brngFinala, degFmt));

   $('#brng1').html(Dms.toBrng(brng1, degFmt));

   $('#solstice2lat').html(solstice2lat);
   $('#solstice2long').html(solstice2long);

   var brng2 = Dms.parseDMS(solsticeaziwinrise);
   var p1b = LatLon(lat1, lon1);
   var p2b = p1b.destinationPoint(dist, brng2);
   var brngFinalb = p1b.finalBearingTo(p2b);

   var ddb = p2b.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddb2 = ddb.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddb3 = ddb2.substring(0, 7);
   var ddb4 = ddb2.substring(10, 18);
   var ddb5 = ddb2.substring(7, 10);
   var ddb6 = ddb2.substring(18, 21);

   solstice3lat = ddb3 * ddb5;
   solstice3long = ddb4 * ddb6;

   $('#ddlatb').html(ddlat);
   $('#ddlongb').html(ddlong);

   $('#result-point2').html(p2b.toString(degFmt));
   $('#result-brng2').html(Dms.toBrng(brngFinalb, degFmt));

   $('#brng2').html(Dms.toBrng(brng2, degFmt));

   $('#solstice3lat').html(solstice3lat);
   $('#solstice3long').html(solstice3long);

   var brng3 = Dms.parseDMS(solsticeaziwinset);
   var p1c = LatLon(lat1, lon1);
   var p2c = p1c.destinationPoint(dist, brng3);
   var brngFinalc = p1c.finalBearingTo(p2c);

   var ddc = p2c.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddc2 = ddc.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddc3 = ddc2.substring(0, 7);
   var ddc4 = ddc2.substring(10, 18);
   var ddc5 = ddc2.substring(7, 10);
   var ddc6 = ddc2.substring(18, 21);

   solstice4lat = ddc3 * ddc5;
   solstice4long = ddc4 * ddc6;

   $('#ddlatc').html(ddlat);
   $('#ddlongc').html(ddlong);

   $('#result-point3').html(p2c.toString(degFmt));
   $('#result-brng3').html(Dms.toBrng(brngFinalc, degFmt));

   $('#brng3').html(Dms.toBrng(brng3, degFmt));

   $('#solstice4lat').html(solstice4lat);
   $('#solstice4long').html(solstice4long);

   // crossquarters

   var sonewObjc = crossquarter;
   for (var g = 0; g < sonewObjc.length; g++) {
      if (sonewObjc[g]) {
         soac = g + 1
      };
   }

   if (soac == 1) {
      hoek3 = 0.69 * hoek3
   }

   sooud = soac

   azimuthc = 180 / Math.PI * Math.acos((Math.sin(hoek3) - Math.sin(lata) * Math
      .sin(calcalt)) / Math.cos(lata) / Math.cos(calcalt))
   crossquarterazisumrise = Math.round(azimuthc * 100) / 100
   //alert(hoek/Math.PI*180)
   //alert(calcalt/Math.PI*180)
   //azimuth
   crossquarterazisumset = Math.round((360 - azimuthc) * 100) / 100
   azimuthc = 180 / Math.PI * Math.acos((Math.sin(-hoek3) - Math.sin(lata) *
      Math.sin(calcalt)) / Math.cos(lata) / Math.cos(calcalt))
   crossquarteraziwinrise = Math.round(azimuthc * 100) / 100
   crossquarteraziwinset = Math.round((360 - azimuthc) * 100) / 100
   window.status = "Calculations finished"

   $("#crossquarterazisumrise").val(crossquarterazisumrise);
   $("#crossquarterazisumset").val(crossquarterazisumset);
   $("#crossquarteraziwinrise").val(crossquarteraziwinrise);
   $("#crossquarteraziwinset").val(crossquarteraziwinset);

   var brng8 = Dms.parseDMS(crossquarterazisumrise);
   var p1h = LatLon(lat1, lon1);
   var p2h = p1h.destinationPoint(dist, brng8);
   var brngFinalh = p1h.finalBearingTo(p2h);

   var ddh = p2h.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddh2 = ddh.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddh3 = ddh2.substring(0, 7);
   var ddh4 = ddh2.substring(10, 18);
   var ddh5 = ddh2.substring(7, 10);
   var ddh6 = ddh2.substring(18, 21);

   crossquarter1lat = ddh3 * ddh5;
   crossquarter1long = ddh4 * ddh6;

   $('#ddlatf').html(ddlat);
   $('#ddlongf').html(ddlong);

   $('#result-point8').html(p2h.toString(degFmt));
   $('#result-brng8').html(Dms.toBrng(brngFinalh, degFmt));

   $('#brng8').html(Dms.toBrng(brng8, degFmt));

   $('#crossquarter1lat').html(crossquarter1lat);
   $('#crossquarter1long').html(crossquarter1long);

   var brng9 = Dms.parseDMS(crossquarterazisumset);
   var p1i = LatLon(lat1, lon1);
   var p2i = p1i.destinationPoint(dist, brng9);
   var brngFinali = p1i.finalBearingTo(p2i);

   var ddi = p2i.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddi2 = ddi.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddi3 = ddi2.substring(0, 7);
   var ddi4 = ddi2.substring(10, 18);
   var ddi5 = ddi2.substring(7, 10);
   var ddi6 = ddi2.substring(18, 21);

   crossquarter2lat = ddi3 * ddi5;
   crossquarter2long = ddi4 * ddi6;

   $('#ddlatg').html(ddlat);
   $('#ddlongg').html(ddlong);

   $('#result-point9').html(p2i.toString(degFmt));
   $('#result-brng9').html(Dms.toBrng(brngFinali, degFmt));

   $('#brng9').html(Dms.toBrng(brng9, degFmt));

   $('#crossquarter2lat').html(crossquarter2lat);
   $('#crossquarter2long').html(crossquarter2long);

   var brng10 = Dms.parseDMS(crossquarteraziwinrise);
   var p1j = LatLon(lat1, lon1);
   var p2j = p1j.destinationPoint(dist, brng10);
   var brngFinalj = p1j.finalBearingTo(p2j);

   var ddj = p2j.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddj2 = ddj.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddj3 = ddj2.substring(0, 7);
   var ddj4 = ddj2.substring(10, 18);
   var ddj5 = ddj2.substring(7, 10);
   var ddj6 = ddj2.substring(18, 21);

   crossquarter3lat = ddj3 * ddj5;
   crossquarter3long = ddj4 * ddj6;

   $('#ddlath').html(ddlat);
   $('#ddlongh').html(ddlong);

   $('#result-point10').html(p2j.toString(degFmt));
   $('#result-brng10').html(Dms.toBrng(brngFinalj, degFmt));

   $('#brng10').html(Dms.toBrng(brng10, degFmt));

   $('#crossquarter3lat').html(crossquarter3lat);
   $('#crossquarter3long').html(crossquarter3long);

   var brng11 = Dms.parseDMS(crossquarteraziwinset);
   var p1k = LatLon(lat1, lon1);
   var p2k = p1k.destinationPoint(dist, brng11);
   var brngFinalk = p1k.finalBearingTo(p2k);

   var ddk = p2k.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddk2 = ddk.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddk3 = ddk2.substring(0, 7);
   var ddk4 = ddk2.substring(10, 18);
   var ddk5 = ddk2.substring(7, 10);
   var ddk6 = ddk2.substring(18, 21);

   crossquarter4lat = ddk3 * ddk5;
   crossquarter4long = ddk4 * ddk6;

   $('#ddlati').html(ddlat);
   $('#ddlongi').html(ddlong);

   $('#result-point11').html(p2k.toString(degFmt));
   $('#result-brng11').html(Dms.toBrng(brngFinalk, degFmt));

   $('#brng11').html(Dms.toBrng(brng11, degFmt));

   $('#crossquarter4lat').html(crossquarter4lat);
   $('#crossquarter4long').html(crossquarter4long);

   var brng20 = Dms.parseDMS(northazi);
   var p1t = LatLon(lat1, lon1);
   var p2t = p1t.destinationPoint(dist, brng20);
   var brngFinalt = p1t.finalBearingTo(p2t);

   var ddt = p2t.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddt2 = ddt.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddt3 = ddt2.substring(0, 7);
   var ddt4 = ddt2.substring(10, 18);
   var ddt5 = ddt2.substring(7, 10);
   var ddt6 = ddt2.substring(18, 21);

   northlat = ddt3 * ddt5;
   northlong = ddt4 * ddt6;

   $('#ddlatr').html(ddlat);
   $('#ddlongr').html(ddlong);

   $('#result-point20').html(p2t.toString(degFmt));
   $('#result-brng20').html(Dms.toBrng(brngFinalt, degFmt));

   $('#brng20').html(Dms.toBrng(brng20, degFmt));

   $('#northlat').html(northlat);
   $('#northlong').html(northlong);

   var brng21 = Dms.parseDMS(southazi);
   var p1u = LatLon(lat1, lon1);
   var p2u = p1u.destinationPoint(dist, brng21);
   var brngFinalu = p1u.finalBearingTo(p2u);

   var ddu = p2u.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddu2 = ddu.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddu3 = ddu2.substring(0, 7);
   var ddu4 = ddu2.substring(10, 18);
   var ddu5 = ddu2.substring(7, 10);
   var ddu6 = ddu2.substring(18, 21);

   southlat = ddu3 * ddu5;
   southlong = ddu4 * ddu6;

   $('#ddlats').html(ddlat);
   $('#ddlongs').html(ddlong);

   $('#result-point21').html(p2u.toString(degFmt));
   $('#result-brng21').html(Dms.toBrng(brngFinalu, degFmt));

   $('#brng21').html(Dms.toBrng(brng21, degFmt));

   $('#southlat').html(southlat);
   $('#southlong').html(southlong);

   // equinox

   var sonewObjb = equinox;
   for (var f = 0; f < sonewObjb.length; f++) {
      if (sonewObjb[f]) {
         soab = f + 1
      };
   }

   if (soab == 1) {
      hoek2 = 0
   }

   sooud = soab

   azimuthb = 180 / Math.PI * Math.acos((Math.sin(hoek2) - Math.sin(lata) * Math
      .sin(calcalt)) / Math.cos(lata) / Math.cos(calcalt))
   equinoxazisumrise = Math.round(azimuthb * 100) / 100

   equinoxazisumset = Math.round((360 - azimuthb) * 100) / 100
   azimuthb = 180 / Math.PI * Math.acos((Math.sin(-hoek2) - Math.sin(lata) *
      Math.sin(calcalt)) / Math.cos(lata) / Math.cos(calcalt))
   equinoxaziwinrise = Math.round(azimuthb * 100) / 100
   equinoxaziwinset = Math.round((360 - azimuthb) * 100) / 100
   window.status = "Calculations finished"

   $("#equinoxazisumrise").val(equinoxazisumrise);
   $("#equinoxazisumset").val(equinoxazisumset);
   $("#equinoxaziwinrise").val(equinoxaziwinrise);
   $("#equinoxaziwinset").val(equinoxaziwinset);

   var brng4 = Dms.parseDMS(equinoxazisumrise);
   var p1d = LatLon(lat1, lon1);
   var p2d = p1d.destinationPoint(dist, brng4);
   var brngFinald = p1d.finalBearingTo(p2d);

   var ddd = p2d.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddd2 = ddd.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddd3 = ddd2.substring(0, 7);
   var ddd4 = ddd2.substring(10, 18);
   var ddd5 = ddd2.substring(7, 10);
   var ddd6 = ddd2.substring(18, 21);

   equinox1lat = ddd3 * ddd5;
   equinox1long = ddd4 * ddd6;

   $('#ddlatd').html(ddlat);
   $('#ddlongd').html(ddlong);

   $('#result-point4').html(p2d.toString(degFmt));
   $('#result-brng4').html(Dms.toBrng(brngFinald, degFmt));

   $('#brng4').html(Dms.toBrng(brng4, degFmt));

   $('#equinox1lat').html(equinox1lat);
   $('#equinox1long').html(equinox1long);

   var brng5 = Dms.parseDMS(equinoxazisumset);
   var p1e = LatLon(lat1, lon1);
   var p2e = p1e.destinationPoint(dist, brng5);
   var brngFinale = p1e.finalBearingTo(p2e);

   var dde = p2e.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var dde2 = dde.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var dde3 = dde2.substring(0, 7);
   var dde4 = dde2.substring(10, 18);
   var dde5 = dde2.substring(7, 10);
   var dde6 = dde2.substring(18, 21);

   equinox2lat = dde3 * dde5;
   equinox2long = dde4 * dde6;

   $('#ddlate').html(ddlat);
   $('#ddlonge').html(ddlong);

   $('#result-point5').html(p2e.toString(degFmt));
   $('#result-brng5').html(Dms.toBrng(brngFinale, degFmt));

   $('#brng5').html(Dms.toBrng(brng5, degFmt));

   $('#equinox2lat').html(equinox2lat);
   $('#equinox2long').html(equinox2long);

   // Major Lunar

   var sonewObjd = major;
   for (var x = 0; x < sonewObjd.length; x++) {
      if (sonewObjd[x]) {
         soad = x + 1
      };
   }

   if (soad == 1) {
      // parallax values comes from http://stjarnhimlen.se/comp/ppcomp.html#13
      // 0.145 (max) is perturbation coming from North, page 567
      // 5.1454 is coming from http://stjarnhimlen.se/comp/ppcomp.html#4
      hoek4 = hoek4 + (5.145396 + 0.145) / 180 * Math.PI
      calcalta = calcalt + 1.004 / 180 * Math.PI * (Math.cos(calcalt) - Math
         .sin(calcalt * 2) * 0.008258773)
   }

   sooud = soad

   azimuthd = 180 / Math.PI * Math.acos((Math.sin(hoek4) - Math.sin(lata) * Math
      .sin(calcalta)) / Math.cos(lata) / Math.cos(calcalta))
   majorazisumrise = Math.round(azimuthd * 100) / 100
   //alert(hoek/Math.PI*180)
   //alert(calcalt/Math.PI*180)
   //azimuth
   majorazisumset = Math.round((360 - azimuthd) * 100) / 100
   azimuthd = 180 / Math.PI * Math.acos((Math.sin(-hoek4) - Math.sin(lata) *
      Math.sin(calcalta)) / Math.cos(lata) / Math.cos(calcalta))
   majoraziwinrise = Math.round(azimuthd * 100) / 100
   majoraziwinset = Math.round((360 - azimuthd) * 100) / 100
   window.status = "Calculations finished"

   $("#majorazisumrise").val(majorazisumrise);
   $("#majorazisumset").val(majorazisumset);
   $("#majoraziwinrise").val(majoraziwinrise);
   $("#majoraziwinset").val(majoraziwinset);

   var brng12 = Dms.parseDMS(majorazisumrise);
   var p1l = LatLon(lat1, lon1);
   var p2l = p1l.destinationPoint(dist, brng12);
   var brngFinall = p1l.finalBearingTo(p2l);

   var ddl = p2l.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddl2 = ddl.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddl3 = ddl2.substring(0, 7);
   var ddl4 = ddl2.substring(10, 18);
   var ddl5 = ddl2.substring(7, 10);
   var ddl6 = ddl2.substring(18, 21);

   major1lat = ddl3 * ddl5;
   major1long = ddl4 * ddl6;

   $('#ddlatj').html(ddlat);
   $('#ddlongj').html(ddlong);

   $('#result-point12').html(p2l.toString(degFmt));
   $('#result-brng12').html(Dms.toBrng(brngFinall, degFmt));

   $('#brng12').html(Dms.toBrng(brng12, degFmt));

   $('#major1lat').html(major1lat);
   $('#major1long').html(major1long);

   var brng13 = Dms.parseDMS(majorazisumset);
   var p1m = LatLon(lat1, lon1);
   var p2m = p1m.destinationPoint(dist, brng13);
   var brngFinalm = p1m.finalBearingTo(p2m);

   var ddm = p2m.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddm2 = ddm.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddm3 = ddm2.substring(0, 7);
   var ddm4 = ddm2.substring(10, 18);
   var ddm5 = ddm2.substring(7, 10);
   var ddm6 = ddm2.substring(18, 21);

   major2lat = ddm3 * ddm5;
   major2long = ddm4 * ddm6;

   $('#ddlatk').html(ddlat);
   $('#ddlongk').html(ddlong);

   $('#result-point13').html(p2m.toString(degFmt));
   $('#result-brng13').html(Dms.toBrng(brngFinalm, degFmt));

   $('#brng13').html(Dms.toBrng(brng13, degFmt));

   $('#major2lat').html(major2lat);
   $('#major2long').html(major2long);

   var brng14 = Dms.parseDMS(majoraziwinrise);
   var p1n = LatLon(lat1, lon1);
   var p2n = p1n.destinationPoint(dist, brng14);
   var brngFinaln = p1n.finalBearingTo(p2n);

   var ddn = p2n.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddn2 = ddn.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddn3 = ddn2.substring(0, 7);
   var ddn4 = ddn2.substring(10, 18);
   var ddn5 = ddn2.substring(7, 10);
   var ddn6 = ddn2.substring(18, 21);

   major3lat = ddn3 * ddn5;
   major3long = ddn4 * ddn6;

   $('#ddlatl').html(ddlat);
   $('#ddlongl').html(ddlong);

   $('#result-point14').html(p2n.toString(degFmt));
   $('#result-brng14').html(Dms.toBrng(brngFinaln, degFmt));

   $('#brng14').html(Dms.toBrng(brng14, degFmt));

   $('#major3lat').html(major3lat);
   $('#major3long').html(major3long);

   var brng15 = Dms.parseDMS(majoraziwinset);
   var p1o = LatLon(lat1, lon1);
   var p2o = p1o.destinationPoint(dist, brng15);
   var brngFinalo = p1o.finalBearingTo(p2o);

   var ddo = p2o.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddo2 = ddo.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddo3 = ddo2.substring(0, 7);
   var ddo4 = ddo2.substring(10, 18);
   var ddo5 = ddo2.substring(7, 10);
   var ddo6 = ddo2.substring(18, 21);

   major4lat = ddo3 * ddo5;
   major4long = ddo4 * ddo6;

   $('#ddlatm').html(ddlat);
   $('#ddlongm').html(ddlong);

   $('#result-point15').html(p2o.toString(degFmt));
   $('#result-brng15').html(Dms.toBrng(brngFinalo, degFmt));

   $('#brng15').html(Dms.toBrng(brng15, degFmt));

   $('#major4lat').html(major4lat);
   $('#major4long').html(major4long);

   // minor lunar

   var sonewObje = minor;
   for (var m = 0; m < sonewObje.length; m++) {
      if (sonewObje[m]) {
         soae = m + 1
      };
   }

   if (soae == 1) {
      // parallax values coming from http://stjarnhimlen.se/comp/ppcomp.html#13
      // 0.145 (min) is perturbation coming from North, page 567
      // 5.1454 is coming from http://stjarnhimlen.se/comp/ppcomp.html#4
      hoek5 = hoek5 - (5.145396 + 0.145) / 180 * Math.PI
      calcaltb = calcalt + .900 / 180 * Math.PI * (Math.cos(calcalta) - Math
         .sin(calcalta * 2) * 0.008258773)
   }
   //alert(soa)
   sooud = soae

   azimuthe = 180 / Math.PI * Math.acos((Math.sin(hoek5) - Math.sin(lata) * Math
      .sin(calcaltb)) / Math.cos(lata) / Math.cos(calcaltb))
   minorazisumrise = Math.round(azimuthe * 100) / 100
   //alert(hoek/Math.PI*180)
   //alert(calcalt/Math.PI*180)
   //azimuth
   minorazisumset = Math.round((360 - azimuthe) * 100) / 100
   azimuthe = 180 / Math.PI * Math.acos((Math.sin(-hoek5) - Math.sin(lata) *
      Math.sin(calcaltb)) / Math.cos(lata) / Math.cos(calcaltb))
   minoraziwinrise = Math.round(azimuthe * 100) / 100
   minoraziwinset = Math.round((360 - azimuthe) * 100) / 100
   window.status = "Calculations finished"

   $("#minorazisumrise").val(minorazisumrise);
   $("#minorazisumset").val(minorazisumset);
   $("#minoraziwinrise").val(minoraziwinrise);
   $("#minoraziwinset").val(minoraziwinset);

   var brng16 = Dms.parseDMS(minorazisumrise);
   var p1p = LatLon(lat1, lon1);
   var p2p = p1p.destinationPoint(dist, brng16);
   var brngFinalp = p1p.finalBearingTo(p2p);

   var ddp = p2p.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddp2 = ddp.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddp3 = ddp2.substring(0, 7);
   var ddp4 = ddp2.substring(10, 18);
   var ddp5 = ddp2.substring(7, 10);
   var ddp6 = ddp2.substring(18, 21);

   minor1lat = ddp3 * ddp5;
   minor1long = ddp4 * ddp6;

   $('#ddlatn').html(ddlat);
   $('#ddlongn').html(ddlong);

   $('#result-point16').html(p2p.toString(degFmt));
   $('#result-brng16').html(Dms.toBrng(brngFinalp, degFmt));

   $('#brng16').html(Dms.toBrng(brng16, degFmt));

   $('#minor1lat').html(minor1lat);
   $('#minor1long').html(minor1long);

   var brng17 = Dms.parseDMS(minorazisumset);
   var p1q = LatLon(lat1, lon1);
   var p2q = p1q.destinationPoint(dist, brng17);
   var brngFinalq = p1q.finalBearingTo(p2q);

   var ddq = p2q.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddq2 = ddq.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddq3 = ddq2.substring(0, 7);
   var ddq4 = ddq2.substring(10, 18);
   var ddq5 = ddq2.substring(7, 10);
   var ddq6 = ddq2.substring(18, 21);

   minor2lat = ddq3 * ddq5;
   minor2long = ddq4 * ddq6;

   $('#ddlato').html(ddlat);
   $('#ddlongo').html(ddlong);

   $('#result-point17').html(p2q.toString(degFmt));
   $('#result-brng17').html(Dms.toBrng(brngFinalq, degFmt));

   $('#brng17').html(Dms.toBrng(brng17, degFmt));

   $('#minor2lat').html(minor2lat);
   $('#minor2long').html(minor2long);

   var brng18 = Dms.parseDMS(minoraziwinrise);
   var p1r = LatLon(lat1, lon1);
   var p2r = p1r.destinationPoint(dist, brng18);
   var brngFinalr = p1r.finalBearingTo(p2r);

   var ddr = p2r.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var ddr2 = ddr.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var ddr3 = ddr2.substring(0, 7);
   var ddr4 = ddr2.substring(10, 18);
   var ddr5 = ddr2.substring(7, 10);
   var ddr6 = ddr2.substring(18, 21);

   minor3lat = ddr3 * ddr5;
   minor3long = ddr4 * ddr6;

   $('#ddlatp').html(ddlat);
   $('#ddlongp').html(ddlong);

   $('#result-point18').html(p2r.toString(degFmt));
   $('#result-brng18').html(Dms.toBrng(brngFinalr, degFmt));

   $('#brng18').html(Dms.toBrng(brng18, degFmt));

   $('#minor3lat').html(minor3lat);
   $('#minor3long').html(minor3long);

   var brng19 = Dms.parseDMS(minoraziwinset);
   var p1s = LatLon(lat1, lon1);
   var p2s = p1s.destinationPoint(dist, brng19);
   var brngFinals = p1s.finalBearingTo(p2s);

   var dds = p2s.toString(degFmt);
   var replaceChars = {
      " ": "",
      " ": "",
      "N": "+1",
      "S": "-1",
      "E": "+1",
      "W": "-1",
      "°": " ",
      ",": ""
   };
   var dds2 = dds.replace(/ | |N|S|E|W|°|,/g, function(match) {
      return replaceChars[match];
   })
   var dds3 = dds2.substring(0, 7);
   var dds4 = dds2.substring(10, 18);
   var dds5 = dds2.substring(7, 10);
   var dds6 = dds2.substring(18, 21);

   minor4lat = dds3 * dds5;
   minor4long = dds4 * dds6;

   $('#ddlatq').html(ddlat);
   $('#ddlongq').html(ddlong);

   $('#result-point19').html(p2s.toString(degFmt));
   $('#result-brng19').html(Dms.toBrng(brngFinals, degFmt));

   $('#brng19').html(Dms.toBrng(brng19, degFmt));

   $('#minor4lat').html(minor4lat);
   $('#minor4long').html(minor4long);

}

function perihelionday(angle, tweede) {
   maxerror = 0.000001
   richting = 1
   stap = 1
   // Ruggles, 1999, page 24 init value
   dayoud = Math.acos(Math.sin(angle / 180 * Math.PI) / Math.sin(obliquity)) /
      Math.PI * 180 / 0.9856
   if (tweede == 1) {
      dayoud = -dayoud
   }
   //if (stap==0) {
   //stap=1
   declioud = declination(dayoud)
   difoud = declioud - angle
   if (difoud < 0) {
      signoud = -1
   }
   else {
      signoud = 1
   }
   while (Math.abs(difoud) > maxerror) {
      daynew = dayoud + richting * stap
      declinew = declination(daynew)
      difnew = declinew - angle
      if (difnew < 0) {
         signnew = -1
      }
      else {
         signnew = 1
      }
      if (signnew == signoud) {
         if (Math.abs(difnew) > Math.abs(difoud)) {
            richting = -richting
         }
         richting = richting
      }
      else {
         richting = -richting
         stap = stap / 2
      }
      difoud = difnew
      signoud = signnew
      dayoud = daynew
      //alert(difnew+" "+signnew+" "+daynew+" "+richting+" "+declinew)
      //}
   }
   return dayoud

}

function declination(day) {
   angle = Math.asin(Math.sin(obliquity) * Math.cos((360 / tropicalyear * day +
         eccentricityvalue * 2 * 180 / Math.PI * Math.sin(360 /
            tropicalyear * (day - periheliondaynumber) / 180 * Math.PI)) /
      180 * Math.PI)) / Math.PI * 180
   return angle
}

/*----------------------------------------------------------------*/