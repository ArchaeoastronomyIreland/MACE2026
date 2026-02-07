



$("#clearAll").click(function(event) {
  event.preventDefault();

  $(".check").each(function(i, el) {
    el.checked = false; // Set new status (unchecked) first.
    $(el).change(); // Trigger the event.
  })
});

$(".check").change(function() {
  var layerClicked = $(this).attr("id");
  switch (layerClicked) {
    
case "cartoLight": toggleLayer(this.checked, cartoLight); break;
case "Esri_WorldImagery": toggleLayer(this.checked, Esri_WorldImagery); break;
case "googleSat": toggleLayer(this.checked, googleSat); break;
case "bingLayer": toggleLayer(this.checked, bingLayer); break;
case "Esri_WorldShadedRelief": toggleLayer(this.checked, Esri_WorldShadedRelief); break;
case "topoUrl": toggleLayer(this.checked, topoUrl); break;
case "stamenLayer": toggleLayer(this.checked, stamenLayer); break;
case "bathymetryGroupLayer": toggleLayer(this.checked, bathymetryGroupLayer); break;
case "graticule": toggleLayer(this.checked, graticule); break;



case "peaks": toggleLayer(this.checked, peaks); break;
case "peakstoggle": toggleLayer(this.checked, peakstoggle); break;
case "peaksLayer": toggleLayer(this.checked, peaksLayer); break;



case "hills": toggleLayer(this.checked, hills); break;
case "hillstoggle": toggleLayer(this.checked, hillstoggle); break;
case "hillsLayer": toggleLayer(this.checked, hillsLayer); break;



case "trigpoints": toggleLayer(this.checked, trigpoints); break;
case "trigpointstoggle": toggleLayer(this.checked, trigpointstoggle); break;
case "trigpointsLayer": toggleLayer(this.checked, trigpointsLayer); break;






case "baronyLayer": toggleLayer(this.checked, baronyLayer); break;
case "terrain": toggleLayer(this.checked, terrain); break;
case "passagetombs": toggleLayer(this.checked, passagetombs); break;
case "passagetombsniLayer": toggleLayer(this.checked, passagetombsniLayer); break;
case "passagetombsni": toggleLayer(this.checked, passagetombsni); break;
case "passagetombsLayer": toggleLayer(this.checked, passagetombsLayer); break;
case "chambered": toggleLayer(this.checked, chambered); break;
case "chamberedLayer": toggleLayer(this.checked, chamberedLayer); break;
case "IrelandPassageTombs": toggleLayer(this.checked, IrelandPassageTombs); break;
case "IrelandCairns": toggleLayer(this.checked, IrelandCairns); break;


case "passagetombswales": toggleLayer(this.checked, passagetombswales); break;
case "passagetombswalestoggle": toggleLayer(this.checked, passagetombswalestoggle); break;
case "passagetombswalesLayer": toggleLayer(this.checked, passagetombswalesLayer); break;



case "passagetombsscotland": toggleLayer(this.checked, passagetombsscotland); break;
case "passagetombsscotlandtoggle": toggleLayer(this.checked, passagetombsscotlandtoggle); break;
case "passagetombsscotlandLayer": toggleLayer(this.checked, passagetombsscotlandLayer); break;




case "chamberedtombsscotland": toggleLayer(this.checked, chamberedtombsscotland); break;
case "chamberedtombsscotlandtoggle": toggleLayer(this.checked, chamberedtombsscotlandtoggle); break;
case "chamberedtombsscotlandLayer": toggleLayer(this.checked, chamberedtombsscotlandLayer); break;


case "chamberedman": toggleLayer(this.checked, chamberedman); break;
case "chamberedmantoggle": toggleLayer(this.checked, chamberedmantoggle); break;
case "chamberedmanLayer": toggleLayer(this.checked, chamberedmanLayer); break;


case "chamberedcairnsscotland": toggleLayer(this.checked, chamberedcairnsscotland); break;
case "chamberedcairnsscotlandtoggle": toggleLayer(this.checked, chamberedcairnsscotlandtoggle); break;
case "chamberedcairnsscotlandLayer": toggleLayer(this.checked, chamberedcairnsscotlandLayer); break;





case "burialcairns": toggleLayer(this.checked, burialcairns); break;
case "burialcairnstoggle": toggleLayer(this.checked, burialcairnstoggle); break;
case "burialcairnsLayer": toggleLayer(this.checked, burialcairnsLayer); break;




case "burialmounds": toggleLayer(this.checked, burialmounds); break;
case "burialmoundstoggle": toggleLayer(this.checked, burialmoundstoggle); break;
case "burialmoundsLayer": toggleLayer(this.checked, burialmoundsLayer); break;





case "moundbarrows": toggleLayer(this.checked, moundbarrows); break;
case "moundbarrowstoggle": toggleLayer(this.checked, moundbarrowstoggle); break;
case "moundbarrowsLayer": toggleLayer(this.checked, moundbarrowsLayer); break;


case "portaltombs": toggleLayer(this.checked, portaltombs); break;
case "portaltombstoggle": toggleLayer(this.checked, portaltombstoggle); break;
case "portaltombsLayer": toggleLayer(this.checked, portaltombsLayer); break;



case "niportaltombs": toggleLayer(this.checked, niportaltombs); break;
case "niportaltombstoggle": toggleLayer(this.checked, niportaltombstoggle); break;
case "niportaltombsLayer": toggleLayer(this.checked, niportaltombsLayer); break;




case "courttombs": toggleLayer(this.checked, courttombs); break;
case "courttombstoggle": toggleLayer(this.checked, courttombstoggle); break;
case "courttombsLayer": toggleLayer(this.checked, courttombsLayer); break;



case "wedgetombs": toggleLayer(this.checked, wedgetombs); break;
case "wedgetombstoggle": toggleLayer(this.checked, wedgetombstoggle); break;
case "wedgetombsLayer": toggleLayer(this.checked, wedgetombsLayer); break;



case "hillforts": toggleLayer(this.checked, hillforts); break;
case "hillfortstoggle": toggleLayer(this.checked, hillfortstoggle); break;
case "hillfortsLayer": toggleLayer(this.checked, hillfortsLayer); break;




case "ringbarrows": toggleLayer(this.checked, ringbarrows); break;
case "ringbarrowstoggle": toggleLayer(this.checked, ringbarrowstoggle); break;
case "ringbarrowsLayer": toggleLayer(this.checked, ringbarrowsLayer); break;



case "steppedbarrows": toggleLayer(this.checked, steppedbarrows); break;
case "steppedbarrowstoggle": toggleLayer(this.checked, steppedbarrowstoggle); break;
case "steppedbarrowsLayer": toggleLayer(this.checked, steppedbarrowsLayer); break;




case "ceremonial": toggleLayer(this.checked, ceremonial); break;
case "ceremonialtoggle": toggleLayer(this.checked, ceremonialtoggle); break;
case "ceremonialLayer": toggleLayer(this.checked, ceremonialLayer); break;


case "rockart": toggleLayer(this.checked, rockart); break;
case "rockarttoggle": toggleLayer(this.checked, rockarttoggle); break;
case "rockartLayer": toggleLayer(this.checked, rockartLayer); break;



case "massrockstoggle": toggleLayer(this.checked, massrockstoggle); break;



case "mythicalhills": toggleLayer(this.checked, mythicalhills); break;
case "mythicalhillstoggle": toggleLayer(this.checked, mythicalhillstoggle); break;
case "mythicalhillsLayer": toggleLayer(this.checked, mythicalhillsLayer); break;



case "mythicalforts": toggleLayer(this.checked, mythicalforts); break;
case "mythicalfortstoggle": toggleLayer(this.checked, mythicalfortstoggle); break;
case "mythicalfortsLayer": toggleLayer(this.checked, mythicalfortsLayer); break;



case "royals": toggleLayer(this.checked, royals); break;
case "royalstoggle": toggleLayer(this.checked, royalstoggle); break;
case "royalsLayer": toggleLayer(this.checked, royalsLayer); break;


case "inaugurations": toggleLayer(this.checked, inaugurations); break;
case "inaugurationstoggle": toggleLayer(this.checked, inaugurationstoggle); break;
case "inaugurationsLayer": toggleLayer(this.checked, inaugurationsLayer); break;




case "uisneachcomboringsLayer": toggleLayer(this.checked, uisneachcomboringsLayer); break;
case "tararings": toggleLayer(this.checked, tararings); break;
case "carnfreerings": toggleLayer(this.checked, carnfreerings); break;
case "navanrings": toggleLayer(this.checked, navanrings); break;
case "AbbyquarterJAHLines": toggleLayer(this.checked, AbbyquarterJAHLines); break;
case "AbbyquarterJBHLines": toggleLayer(this.checked, AbbyquarterJBHLines); break;
case "allenrings": toggleLayer(this.checked, allenrings); break;
case "testringstara": toggleLayer(this.checked, testringstara); break;
case "allenvch": toggleLayer(this.checked, allenvch); break;
case "AllenVCO": toggleLayer(this.checked, AllenVCO); break;
case "HillofAllenLines": toggleLayer(this.checked, HillofAllenLines); break;
case "HillofAllenJBHLines": toggleLayer(this.checked, HillofAllenJBHLines); break;
case "ardloyvch": toggleLayer(this.checked, ardloyvch); break;
case "ArdloyVCO": toggleLayer(this.checked, ArdloyVCO); break;
case "ArdloyLines": toggleLayer(this.checked, ArdloyLines); break;
case "ArdloyJBHLines": toggleLayer(this.checked, ArdloyJBHLines); break;
case "ardnaglassvch": toggleLayer(this.checked, ardnaglassvch); break;
case "ArdnaglassVCO": toggleLayer(this.checked, ArdnaglassVCO); break;
case "ArdnaglassLines": toggleLayer(this.checked, ArdnaglassLines); break;
case "ArdnaglassJBHLines": toggleLayer(this.checked, ArdnaglassJBHLines); break;
case "Ballinascorneyvch": toggleLayer(this.checked, Ballinascorneyvch); break;
case "BallinascorneyVCO": toggleLayer(this.checked, BallinascorneyVCO); break;
case "BallinascorneyJAHLines": toggleLayer(this.checked, BallinascorneyJAHLines); break;
case "BallinascorneyJBHLines": toggleLayer(this.checked, BallinascorneyJBHLines); break;
case "BallinascorneyDU024030JBHLines": toggleLayer(this.checked, BallinascorneyDU024030JBHLines); break;
case "BallinascorneyDU024030JAHLines": toggleLayer(this.checked, BallinascorneyDU024030JAHLines); break;
case "ballycartyvch": toggleLayer(this.checked, ballycartyvch); break;
case "BallycartyVCO": toggleLayer(this.checked, BallycartyVCO); break;
case "BallycartyLines": toggleLayer(this.checked, BallycartyLines); break;
case "BallycartyJBHLines": toggleLayer(this.checked, BallycartyJBHLines); break;
case "BallykiltyJBHLines": toggleLayer(this.checked, BallykiltyJBHLines); break;
case "BallykiltyJAHLines": toggleLayer(this.checked, BallykiltyJAHLines); break;
case "BallymacadJAHLines": toggleLayer(this.checked, BallymacadJAHLines); break;
case "BallymacadJBHLines": toggleLayer(this.checked, BallymacadJBHLines); break;
case "ballymannavch": toggleLayer(this.checked, ballymannavch); break;
case "BallymannaVCO": toggleLayer(this.checked, BallymannaVCO); break;
case "BallymannaLines": toggleLayer(this.checked, BallymannaLines); break;
case "BallymannaJBHLines": toggleLayer(this.checked, BallymannaJBHLines); break;
case "baltinglassvch": toggleLayer(this.checked, baltinglassvch); break;
case "BaltinglassVCO": toggleLayer(this.checked, BaltinglassVCO); break;
case "BaltinglassLines": toggleLayer(this.checked, BaltinglassLines); break;
case "banaghervch": toggleLayer(this.checked, banaghervch); break;
case "BanagherVCO": toggleLayer(this.checked, BanagherVCO); break;
case "BanagherLines": toggleLayer(this.checked, BanagherLines); break;
case "BanagherJBHLines": toggleLayer(this.checked, BanagherJBHLines); break;
case "barnabrackvch": toggleLayer(this.checked, barnabrackvch); break;
case "BarnabrackVCO": toggleLayer(this.checked, BarnabrackVCO); break;
case "BarnabrackLines": toggleLayer(this.checked, BarnabrackLines); break;
case "BarnabrackJBHLines": toggleLayer(this.checked, BarnabrackJBHLines); break;
case "barroevch": toggleLayer(this.checked, barroevch); break;
case "BarroeVCO": toggleLayer(this.checked, BarroeVCO); break;
case "BarroeLines": toggleLayer(this.checked, BarroeLines); break;
case "BarroeJBHLines": toggleLayer(this.checked, BarroeJBHLines); break;
case "baunfreevch": toggleLayer(this.checked, baunfreevch); break;
case "BaunfreeVCO": toggleLayer(this.checked, BaunfreeVCO); break;
case "BaunfreeLines": toggleLayer(this.checked, BaunfreeLines); break;
case "BaunfreeJBHLines": toggleLayer(this.checked, BaunfreeJBHLines); break;
case "BeakstownJBHLines": toggleLayer(this.checked, BeakstownJBHLines); break;
case "BeakstownJAHLines": toggleLayer(this.checked, BeakstownJAHLines); break;
case "BellvilleJBHLines": toggleLayer(this.checked, BellvilleJBHLines); break;
case "BellvilleJAHLines": toggleLayer(this.checked, BellvilleJAHLines); break;
case "BickershousesLines": toggleLayer(this.checked, BickershousesLines); break;
case "BigwoodJBHLines": toggleLayer(this.checked, BigwoodJBHLines); break;
case "BigwoodJAHLines": toggleLayer(this.checked, BigwoodJAHLines); break;
case "blakestownvch": toggleLayer(this.checked, blakestownvch); break;
case "BlakestownVCO": toggleLayer(this.checked, BlakestownVCO); break;
case "BlakestownLines": toggleLayer(this.checked, BlakestownLines); break;
case "BlakestownJBHLines": toggleLayer(this.checked, BlakestownJBHLines); break;
case "BoleyVCO": toggleLayer(this.checked, BoleyVCO); break;
case "Boleyvch": toggleLayer(this.checked, Boleyvch); break;
case "BoleyJAHLines": toggleLayer(this.checked, BoleyJAHLines); break;
case "BoleyJBHLines": toggleLayer(this.checked, BoleyJBHLines); break;
case "Bremorevch": toggleLayer(this.checked, Bremorevch); break;
case "BremoreVCO": toggleLayer(this.checked, BremoreVCO); break;
case "BremoreJAHLines": toggleLayer(this.checked, BremoreJAHLines); break;
case "BremoreJBHLines": toggleLayer(this.checked, BremoreJBHLines); break;
case "brileithvch": toggleLayer(this.checked, brileithvch); break;
case "BrileithVCO": toggleLayer(this.checked, BrileithVCO); break;
case "BrileithLines": toggleLayer(this.checked, BrileithLines); break;
case "BrileithJBHLines": toggleLayer(this.checked, BrileithJBHLines); break;
case "BrewelJBHLines": toggleLayer(this.checked, BrewelJBHLines); break;
case "BrewelJAHLines": toggleLayer(this.checked, BrewelJAHLines); break;
case "KnowthLines": toggleLayer(this.checked, KnowthLines); break;
case "KnowthJBHLines": toggleLayer(this.checked, KnowthJBHLines); break;
case "KnowthVCO": toggleLayer(this.checked, KnowthVCO); break;
case "Knowthvch": toggleLayer(this.checked, Knowthvch); break;
case "KnowthDistantObjectLines": toggleLayer(this.checked, KnowthDistantObjectLines); break;
case "NewgrangeLines": toggleLayer(this.checked, NewgrangeLines); break;
case "NewgrangejbhLines": toggleLayer(this.checked, NewgrangejbhLines); break;
case "newgrangevch": toggleLayer(this.checked, newgrangevch); break;
case "NewgrangeVCO": toggleLayer(this.checked, NewgrangeVCO); break;
case "DowthJBHLines": toggleLayer(this.checked, DowthJBHLines); break;
case "DowthVCO": toggleLayer(this.checked, DowthVCO); break;
case "Dowthvch": toggleLayer(this.checked, Dowthvch); break;
case "DowthLines": toggleLayer(this.checked, DowthLines); break;
case "CapardVCO": toggleLayer(this.checked, CapardVCO); break;
case "Capardvch": toggleLayer(this.checked, Capardvch); break;
case "CapardJAHLines": toggleLayer(this.checked, CapardJAHLines); break;
case "CapardJBHLines": toggleLayer(this.checked, CapardJBHLines); break;
case "CaranJBHLines": toggleLayer(this.checked, CaranJBHLines); break;
case "CaranJAHLines": toggleLayer(this.checked, CaranJAHLines); break;
case "carnvch": toggleLayer(this.checked, carnvch); break;
case "CarnLines": toggleLayer(this.checked, CarnLines); break;
case "CarnJBHLines": toggleLayer(this.checked, CarnJBHLines); break;
case "CarnVCO": toggleLayer(this.checked, CarnVCO); break;
case "carnfinneavch": toggleLayer(this.checked, carnfinneavch); break;
case "CarnfinneaVCO": toggleLayer(this.checked, CarnfinneaVCO); break;
case "CarnfinneaLines": toggleLayer(this.checked, CarnfinneaLines); break;
case "CarnfinneaJBHLines": toggleLayer(this.checked, CarnfinneaJBHLines); break;
case "carnfadrigvch": toggleLayer(this.checked, carnfadrigvch); break;
case "CarnfadrigVCO": toggleLayer(this.checked, CarnfadrigVCO); break;
case "CarnfadrigLines": toggleLayer(this.checked, CarnfadrigLines); break;
case "CarnfadrigJBHLines": toggleLayer(this.checked, CarnfadrigJBHLines); break;
case "CarrickaveeJBHLines": toggleLayer(this.checked, CarrickaveeJBHLines); break;
case "CarrickaveeJAHLines": toggleLayer(this.checked, CarrickaveeJAHLines); break;
case "CarrigeenwoodJBHLines": toggleLayer(this.checked, CarrigeenwoodJBHLines); break;
case "CarrigeenwoodJAHLines": toggleLayer(this.checked, CarrigeenwoodJAHLines); break;
case "carriglongvch": toggleLayer(this.checked, carriglongvch); break;
case "CarriglongVCO": toggleLayer(this.checked, CarriglongVCO); break;
case "CarriglongLines": toggleLayer(this.checked, CarriglongLines); break;
case "CarriglongJBHLines": toggleLayer(this.checked, CarriglongJBHLines); break;
case "CarnagarveVCO": toggleLayer(this.checked, CarnagarveVCO); break;
case "Carnagarvevch": toggleLayer(this.checked, Carnagarvevch); break;
case "CarnagarveJAHLines": toggleLayer(this.checked, CarnagarveJAHLines); break;
case "CarnagarveJBHLines": toggleLayer(this.checked, CarnagarveJBHLines); break;
case "CarnalynchJAHLines": toggleLayer(this.checked, CarnalynchJAHLines); break;
case "CarnalynchJBHLines": toggleLayer(this.checked, CarnalynchJBHLines); break;
case "CarnalynchVCO": toggleLayer(this.checked, CarnalynchVCO); break;
case "Carnalynchvch": toggleLayer(this.checked, Carnalynchvch); break;
case "CarnWM001027JBHLines": toggleLayer(this.checked, CarnWM001027JBHLines); break;
case "CarnWM001027JAHLines": toggleLayer(this.checked, CarnWM001027JAHLines); break;
case "CarronJBHLines": toggleLayer(this.checked, CarronJBHLines); break;
case "CarronJAHLines": toggleLayer(this.checked, CarronJAHLines); break;
case "carrowhubbockvch": toggleLayer(this.checked, carrowhubbockvch); break;
case "CarrowhubbockVCO": toggleLayer(this.checked, CarrowhubbockVCO); break;
case "CarrowhubbockLines": toggleLayer(this.checked, CarrowhubbockLines); break;
case "CarrowhubbockJBHLines": toggleLayer(this.checked, CarrowhubbockJBHLines); break;
case "carrowkeelvch": toggleLayer(this.checked, carrowkeelvch); break;
case "CarrowkeelVCO": toggleLayer(this.checked, CarrowkeelVCO); break;
case "CarrowkeelLines": toggleLayer(this.checked, CarrowkeelLines); break;
case "CarrowkeelJBHLines": toggleLayer(this.checked, CarrowkeelJBHLines); break;
case "carrownamaddoovch": toggleLayer(this.checked, carrownamaddoovch); break;
case "CarrownamaddooVCO": toggleLayer(this.checked, CarrownamaddooVCO); break;
case "CarrownamaddooLines": toggleLayer(this.checked, CarrownamaddooLines); break;
case "CarrownamaddooJBHLines": toggleLayer(this.checked, CarrownamaddooJBHLines); break;
case "carrowmorevch": toggleLayer(this.checked, carrowmorevch); break;
case "CarrowmoreVCO": toggleLayer(this.checked, CarrowmoreVCO); break;
case "Carrowgarvevch": toggleLayer(this.checked, Carrowgarvevch); break;
case "CarrowgarveVCO": toggleLayer(this.checked, CarrowgarveVCO); break;
case "CarrowgarveJAHLines": toggleLayer(this.checked, CarrowgarveJAHLines); break;
case "CarrowgarveJBHLines": toggleLayer(this.checked, CarrowgarveJBHLines); break;
case "CarrowmoreLines": toggleLayer(this.checked, CarrowmoreLines); break;
case "CarrowmoreJBHLines": toggleLayer(this.checked, CarrowmoreJBHLines); break;
case "CarrowreaghLines": toggleLayer(this.checked, CarrowreaghLines); break;
case "CarrowreaghJBHLines": toggleLayer(this.checked, CarrowreaghJBHLines); break;
case "carrowreaghvch": toggleLayer(this.checked, carrowreaghvch); break;
case "CarrowreaghVCO": toggleLayer(this.checked, CarrowreaghVCO); break;
case "carrowreaghgallenvch": toggleLayer(this.checked, carrowreaghgallenvch); break;
case "CarrowreaghgallenVCO": toggleLayer(this.checked, CarrowreaghgallenVCO); break;
case "CarrowreaghgallenLines": toggleLayer(this.checked, CarrowreaghgallenLines); break;
case "CarrowreaghgallenJBHLines": toggleLayer(this.checked, CarrowreaghgallenJBHLines); break;
case "CarrowntempleJBHLines": toggleLayer(this.checked, CarrowntempleJBHLines); break;
case "CarrowntempleJAHLines": toggleLayer(this.checked, CarrowntempleJAHLines); break;
case "CashelLines": toggleLayer(this.checked, CashelLines); break;
case "CashelJBHLines": toggleLayer(this.checked, CashelJBHLines); break;
case "CastleboyJBHLines": toggleLayer(this.checked, CastleboyJBHLines); break;
case "CastleboyJAHLines": toggleLayer(this.checked, CastleboyJAHLines); break;
case "CastlerudderyJBHLines": toggleLayer(this.checked, CastlerudderyJBHLines); break;
case "CastlerudderyJAHLines": toggleLayer(this.checked, CastlerudderyJAHLines); break;
case "CladhchlainniainLines": toggleLayer(this.checked, CladhchlainniainLines); break;
case "clermontvch": toggleLayer(this.checked, clermontvch); break;
case "ClermontVCO": toggleLayer(this.checked, ClermontVCO); break;
case "ClermontLines": toggleLayer(this.checked, ClermontLines); break;
case "ClermontcairnJBHLines": toggleLayer(this.checked, ClermontcairnJBHLines); break;
case "cloghsvch": toggleLayer(this.checked, cloghsvch); break;
case "CloghsVCO": toggleLayer(this.checked, CloghsVCO); break;
case "CloghsLines": toggleLayer(this.checked, CloghsLines); break;
case "ClonasillaghLines": toggleLayer(this.checked, ClonasillaghLines); break;
case "ClonasillaghJBHLines": toggleLayer(this.checked, ClonasillaghJBHLines); break;
case "ClonasillaghVCO": toggleLayer(this.checked, ClonasillaghVCO); break;
case "Clonasillaghvch": toggleLayer(this.checked, Clonasillaghvch); break;
case "ClonsastJBHLines": toggleLayer(this.checked, ClonsastJBHLines); break;
case "ClonsastJAHLines": toggleLayer(this.checked, ClonsastJAHLines); break;
case "ClopookJBHLines": toggleLayer(this.checked, ClopookJBHLines); break;
case "ClopookJAHLines": toggleLayer(this.checked, ClopookJAHLines); break;
case "CoolagarryJBHLines": toggleLayer(this.checked, CoolagarryJBHLines); break;
case "CoolagarryJAHLines": toggleLayer(this.checked, CoolagarryJAHLines); break;
case "CoolgrangeJBHLines": toggleLayer(this.checked, CoolgrangeJBHLines); break;
case "CoolgrangeJAHLines": toggleLayer(this.checked, CoolgrangeJAHLines); break;
case "coolnasillaghvch": toggleLayer(this.checked, coolnasillaghvch); break;
case "CoolnasillaghVCO": toggleLayer(this.checked, CoolnasillaghVCO); break;
case "CoolnasillaghLines": toggleLayer(this.checked, CoolnasillaghLines); break;
case "CoolnasillaghJBHLines": toggleLayer(this.checked, CoolnasillaghJBHLines); break;
case "CornhillLines": toggleLayer(this.checked, CornhillLines); break;
case "CornhillJBHLines": toggleLayer(this.checked, CornhillJBHLines); break;
case "cornhillvch": toggleLayer(this.checked, cornhillvch); break;
case "CornhillVCO": toggleLayer(this.checked, CornhillVCO); break;
case "corraweelisvch": toggleLayer(this.checked, corraweelisvch); break;
case "CorraweelisVCO": toggleLayer(this.checked, CorraweelisVCO); break;
case "CorraweelisLines": toggleLayer(this.checked, CorraweelisLines); break;
case "CorraweelisJBHLines": toggleLayer(this.checked, CorraweelisJBHLines); break;
case "CraigaroganLines": toggleLayer(this.checked, CraigaroganLines); break;
case "CraigaroganJBHLines": toggleLayer(this.checked, CraigaroganJBHLines); break;
case "craigaroganvch": toggleLayer(this.checked, craigaroganvch); break;
case "CraigaroganVCO": toggleLayer(this.checked, CraigaroganVCO); break;
case "craigsvch": toggleLayer(this.checked, craigsvch); break;
case "CraigsVCO": toggleLayer(this.checked, CraigsVCO); break;
case "CraigsLines": toggleLayer(this.checked, CraigsLines); break;
case "CraigsJBHLines": toggleLayer(this.checked, CraigsJBHLines); break;
case "croaghanvch": toggleLayer(this.checked, croaghanvch); break;
case "CroaghanVCO": toggleLayer(this.checked, CroaghanVCO); break;
case "CroaghanLines": toggleLayer(this.checked, CroaghanLines); break;
case "Croghanoffalyvch": toggleLayer(this.checked, Croghanoffalyvch); break;
case "CroghanoffalyVCO": toggleLayer(this.checked, CroghanoffalyVCO); break;
case "CroghanoffalyJBHLines": toggleLayer(this.checked, CroghanoffalyJBHLines); break;
case "CroaghpatrickLines": toggleLayer(this.checked, CroaghpatrickLines); break;
case "CroaghpatrickJBHLines": toggleLayer(this.checked, CroaghpatrickJBHLines); break;
case "croaghpatrickvch": toggleLayer(this.checked, croaghpatrickvch); break;
case "CroaghpatrickVCO": toggleLayer(this.checked, CroaghpatrickVCO); break;
case "crockalaghtavch": toggleLayer(this.checked, crockalaghtavch); break;
case "CrockalaghtaVCO": toggleLayer(this.checked, CrockalaghtaVCO); break;
case "CrockalaghtaLines": toggleLayer(this.checked, CrockalaghtaLines); break;
case "CrockalaghtaJBHLines": toggleLayer(this.checked, CrockalaghtaJBHLines); break;
case "CrockaunadreenaghJBHLines": toggleLayer(this.checked, CrockaunadreenaghJBHLines); break;
case "CrockaunadreenaghJAHLines": toggleLayer(this.checked, CrockaunadreenaghJAHLines); break;
case "CroghanLines": toggleLayer(this.checked, CroghanLines); break;
case "CroaghanJBHLines": toggleLayer(this.checked, CroaghanJBHLines); break;
case "CarnfreeLines": toggleLayer(this.checked, CarnfreeLines); break;
case "CarnfreeJBHLines": toggleLayer(this.checked, CarnfreeJBHLines); break;
case "CairnfreeVCO": toggleLayer(this.checked, CairnfreeVCO); break;
case "Carnfreevch": toggleLayer(this.checked, Carnfreevch); break;
case "CuilcaghJAHLines": toggleLayer(this.checked, CuilcaghJAHLines); break;
case "CuilcaghJBHLines": toggleLayer(this.checked, CuilcaghJBHLines); break;
case "CuilcaghVCO": toggleLayer(this.checked, CuilcaghVCO); break;
case "Cuilcaghvch": toggleLayer(this.checked, Cuilcaghvch); break;
case "CummeenJBHLines": toggleLayer(this.checked, CummeenJBHLines); break;
case "CummeenJAHLines": toggleLayer(this.checked, CummeenJAHLines); break;
case "CurryJBHLines": toggleLayer(this.checked, CurryJBHLines); break;
case "CurryJAHLines": toggleLayer(this.checked, CurryJAHLines); break;
case "SheegeeraghLines": toggleLayer(this.checked, SheegeeraghLines); break;
case "SheegeeraghJBHLines": toggleLayer(this.checked, SheegeeraghJBHLines); break;
case "sheegeeraghEW": toggleLayer(this.checked, sheegeeraghEW); break;
case "SheegeeraghVCO": toggleLayer(this.checked, SheegeeraghVCO); break;
case "sheegeeraghvch": toggleLayer(this.checked, sheegeeraghvch); break;
case "RathcroghanLines": toggleLayer(this.checked, RathcroghanLines); break;
case "RathcroghanJBHLines": toggleLayer(this.checked, RathcroghanJBHLines); break;
case "RathcroghanVCO": toggleLayer(this.checked, RathcroghanVCO); break;
case "Rathcroghanvch": toggleLayer(this.checked, Rathcroghanvch); break;
case "deerparkvch": toggleLayer(this.checked, deerparkvch); break;
case "DeerparkVCO": toggleLayer(this.checked, DeerparkVCO); break;
case "DeerparkLines": toggleLayer(this.checked, DeerparkLines); break;
case "DeerparkJBHLines": toggleLayer(this.checked, DeerparkJBHLines); break;
case "DerrynahinchVCO": toggleLayer(this.checked, DerrynahinchVCO); break;
case "Derrynahinchvch": toggleLayer(this.checked, Derrynahinchvch); break;
case "DerrynahinchJAHLines": toggleLayer(this.checked, DerrynahinchJAHLines); break;
case "DerrynahinchJBHLines": toggleLayer(this.checked, DerrynahinchJBHLines); break;
case "DonaghmoreJBHLines": toggleLayer(this.checked, DonaghmoreJBHLines); break;
case "DonaghmoreJAHLines": toggleLayer(this.checked, DonaghmoreJAHLines); break;
case "drumruekillvch": toggleLayer(this.checked, drumruekillvch); break;
case "DrumruekillVCO": toggleLayer(this.checked, DrumruekillVCO); break;
case "DrumruekillLines": toggleLayer(this.checked, DrumruekillLines); break;
case "DrumruekillJBHLines": toggleLayer(this.checked, DrumruekillJBHLines); break;
case "DunAllenLines": toggleLayer(this.checked, DunAllenLines); break;
case "DunallenJBHLines": toggleLayer(this.checked, DunallenJBHLines); break;
case "DunmurryJAHLines": toggleLayer(this.checked, DunmurryJAHLines); break;
case "DunmurryJBHLines": toggleLayer(this.checked, DunmurryJBHLines); break;
case "EarlsparkJBHLines": toggleLayer(this.checked, EarlsparkJBHLines); break;
case "EarlsparkJAHLines": toggleLayer(this.checked, EarlsparkJAHLines); break;
case "fenaghvch": toggleLayer(this.checked, fenaghvch); break;
case "FawnlionJBHLines": toggleLayer(this.checked, FawnlionJBHLines); break;
case "FawnlionJAHLines": toggleLayer(this.checked, FawnlionJAHLines); break;
case "FarranyharpyJBHLines": toggleLayer(this.checked, FarranyharpyJBHLines); break;
case "FarranyharpyJAHLines": toggleLayer(this.checked, FarranyharpyJAHLines); break;
case "FaughanhillJBHLines": toggleLayer(this.checked, FaughanhillJBHLines); break;
case "FaughanhillJAHLines": toggleLayer(this.checked, FaughanhillJAHLines); break;
case "faughanmarkers": toggleLayer(this.checked, faughanmarkers); break;
case "FenaghVCO": toggleLayer(this.checked, FenaghVCO); break;
case "FenaghLines": toggleLayer(this.checked, FenaghLines); break;
case "FenaghJBHLines": toggleLayer(this.checked, FenaghJBHLines); break;
case "finnervch": toggleLayer(this.checked, finnervch); break;
case "FinnerVCO": toggleLayer(this.checked, FinnerVCO); break;
case "FinnerLines": toggleLayer(this.checked, FinnerLines); break;
case "FinnerJBHLines": toggleLayer(this.checked, FinnerJBHLines); break;
case "fourknocksvch": toggleLayer(this.checked, fourknocksvch); break;
case "FourknocksVCO": toggleLayer(this.checked, FourknocksVCO); break;
case "FourknocksLines": toggleLayer(this.checked, FourknocksLines); break;
case "FourknocksJBHLines": toggleLayer(this.checked, FourknocksJBHLines); break;
case "FriarstownJBHLines": toggleLayer(this.checked, FriarstownJBHLines); break;
case "FriarstownJAHLines": toggleLayer(this.checked, FriarstownJAHLines); break;
case "galbollyuppervch": toggleLayer(this.checked, galbollyuppervch); break;
case "GalbollyupperVCO": toggleLayer(this.checked, GalbollyupperVCO); break;
case "GalbollyupperLines": toggleLayer(this.checked, GalbollyupperLines); break;
case "GalbollyupperJBHLines": toggleLayer(this.checked, GalbollyupperJBHLines); break;
case "GarrangrenaJBHLines": toggleLayer(this.checked, GarrangrenaJBHLines); break;
case "GarrangrenaJAHLines": toggleLayer(this.checked, GarrangrenaJAHLines); break;
case "giantsgravevch": toggleLayer(this.checked, giantsgravevch); break;
case "GiantsgraveVCO": toggleLayer(this.checked, GiantsgraveVCO); break;
case "GiantsgraveLines": toggleLayer(this.checked, GiantsgraveLines); break;
case "GiantsgraveJBHLines": toggleLayer(this.checked, GiantsgraveJBHLines); break;
case "glenvch": toggleLayer(this.checked, glenvch); break;
case "GlenVCO": toggleLayer(this.checked, GlenVCO); break;
case "GlenLines": toggleLayer(this.checked, GlenLines); break;
case "GlenJBHLines": toggleLayer(this.checked, GlenJBHLines); break;
case "GlenballythomasJBHLines": toggleLayer(this.checked, GlenballythomasJBHLines); break;
case "GlenballythomasJAHLines": toggleLayer(this.checked, GlenballythomasJAHLines); break;
case "GlenballythomastoberroryJBHLines": toggleLayer(this.checked, GlenballythomastoberroryJBHLines); break;
case "GlenballythomastoberroryJAHLines": toggleLayer(this.checked, GlenballythomastoberroryJAHLines); break;
case "gortnagolevch": toggleLayer(this.checked, gortnagolevch); break;
case "GortnagoleVCO": toggleLayer(this.checked, GortnagoleVCO); break;
case "GortnagoleLines": toggleLayer(this.checked, GortnagoleLines); break;
case "Granardvch": toggleLayer(this.checked, Granardvch); break;
case "GranardVCO": toggleLayer(this.checked, GranardVCO); break;
case "GranardJAHLines": toggleLayer(this.checked, GranardJAHLines); break;
case "GranardJBHLines": toggleLayer(this.checked, GranardJBHLines); break;
case "heapstownvch": toggleLayer(this.checked, heapstownvch); break;
case "HeapstownVCO": toggleLayer(this.checked, HeapstownVCO); break;
case "HeapstownLines": toggleLayer(this.checked, HeapstownLines); break;
case "HeapstownJBHLines": toggleLayer(this.checked, HeapstownJBHLines); break;
case "HeathtownJBHLines": toggleLayer(this.checked, HeathtownJBHLines); break;
case "HeathtownJAHLines": toggleLayer(this.checked, HeathtownJAHLines); break;
case "IrelandPassageTombsCairns": toggleLayer(this.checked, IrelandPassageTombsCairns); break;
case "howthvch": toggleLayer(this.checked, howthvch); break;
case "HowthVCO": toggleLayer(this.checked, HowthVCO); break;
case "HowthLines": toggleLayer(this.checked, HowthLines); break;
case "HowthJBHLines": toggleLayer(this.checked, HowthJBHLines); break;
case "Hillofmaelvch": toggleLayer(this.checked, Hillofmaelvch); break;
case "HillofmaelVCO": toggleLayer(this.checked, HillofmaelVCO); break;
case "HillofmaelJAHLines": toggleLayer(this.checked, HillofmaelJAHLines); break;
case "HillofmaelJBHLines": toggleLayer(this.checked, HillofmaelJBHLines); break;
case "Hillofmaelcombolines": toggleLayer(this.checked, Hillofmaelcombolines); break;
case "Hillofmaelmarkers": toggleLayer(this.checked, Hillofmaelmarkers); break;
case "hillofmaelshorthand": toggleLayer(this.checked, hillofmaelshorthand); break;
case "KeadeenLines": toggleLayer(this.checked, KeadeenLines); break;
case "keshcorranvch": toggleLayer(this.checked, keshcorranvch); break;
case "KeshcorranVCO": toggleLayer(this.checked, KeshcorranVCO); break;
case "KeshcorranLines": toggleLayer(this.checked, KeshcorranLines); break;
case "KeshcorranJBHLines": toggleLayer(this.checked, KeshcorranJBHLines); break;
case "Kellsvch": toggleLayer(this.checked, Kellsvch); break;
case "KellsVCO": toggleLayer(this.checked, KellsVCO); break;
case "KellsJAHLines": toggleLayer(this.checked, KellsJAHLines); break;
case "KellsJBHLines": toggleLayer(this.checked, KellsJBHLines); break;
case "KillhillJBHLines": toggleLayer(this.checked, KillhillJBHLines); break;
case "KillhillJAHLines": toggleLayer(this.checked, KillhillJAHLines); break;
case "KillinJAHLines": toggleLayer(this.checked, KillinJAHLines); break;
case "KillinJBHLines": toggleLayer(this.checked, KillinJBHLines); break;
case "KilriffinJBHLines": toggleLayer(this.checked, KilriffinJBHLines); break;
case "KilriffinJAHLines": toggleLayer(this.checked, KilriffinJAHLines); break;
case "kingsmountainvch": toggleLayer(this.checked, kingsmountainvch); break;
case "KingsmountainVCO": toggleLayer(this.checked, KingsmountainVCO); break;
case "KingsmountainLines": toggleLayer(this.checked, KingsmountainLines); break;
case "KingsmountainJBHLines": toggleLayer(this.checked, KingsmountainJBHLines); break;
case "KnighJBHLines": toggleLayer(this.checked, KnighJBHLines); break;
case "KnighJAHLines": toggleLayer(this.checked, KnighJAHLines); break;
case "KnightswoodCEJBHLines": toggleLayer(this.checked, KnightswoodCEJBHLines); break;
case "KnightswoodCEJAHLines": toggleLayer(this.checked, KnightswoodCEJAHLines); break;
case "KnockaineyVCO": toggleLayer(this.checked, KnockaineyVCO); break;
case "Knockaineyvch": toggleLayer(this.checked, Knockaineyvch); break;
case "KnockbrackJBHLines": toggleLayer(this.checked, KnockbrackJBHLines); break;
case "KnockbrackJAHLines": toggleLayer(this.checked, KnockbrackJAHLines); break;
case "KnockaineyJAHLines": toggleLayer(this.checked, KnockaineyJAHLines); break;
case "KnockaineyJBHLines": toggleLayer(this.checked, KnockaineyJBHLines); break;
case "KnockeenJBHLines": toggleLayer(this.checked, KnockeenJBHLines); break;
case "KnockeenJAHLines": toggleLayer(this.checked, KnockeenJAHLines); break;
case "knocknareavch": toggleLayer(this.checked, knocknareavch); break;
case "KnocknareaVCO": toggleLayer(this.checked, KnocknareaVCO); break;
case "KnocknareaLines": toggleLayer(this.checked, KnocknareaLines); break;
case "KnocknareaJBHLines": toggleLayer(this.checked, KnocknareaJBHLines); break;
case "KnocknareaCAHLines": toggleLayer(this.checked, KnocknareaCAHLines); break;
case "KnocknareanorthJBHLines": toggleLayer(this.checked, KnocknareanorthJBHLines); break;
case "KnockmaLines": toggleLayer(this.checked, KnockmaLines); break;
case "KnockmaJBHLines": toggleLayer(this.checked, KnockmaJBHLines); break;
case "knockmavch": toggleLayer(this.checked, knockmavch); break;
case "KnockmaVCO": toggleLayer(this.checked, KnockmaVCO); break;
case "knockmanyvch": toggleLayer(this.checked, knockmanyvch); break;
case "KnockmanyVCO": toggleLayer(this.checked, KnockmanyVCO); break;
case "KnockmanyLines": toggleLayer(this.checked, KnockmanyLines); break;
case "KnockmanyJBHLines": toggleLayer(this.checked, KnockmanyJBHLines); break;
case "knocknasheevch": toggleLayer(this.checked, knocknasheevch); break;
case "KnocknasheeVCO": toggleLayer(this.checked, KnocknasheeVCO); break;
case "KnocknasheeLines": toggleLayer(this.checked, KnocknasheeLines); break;
case "KnocknasheeJBHLines": toggleLayer(this.checked, KnocknasheeJBHLines); break;
case "knockshigownavch": toggleLayer(this.checked, knockshigownavch); break;
case "KnockshigownaVCO": toggleLayer(this.checked, KnockshigownaVCO); break;
case "KnockshigownaLines": toggleLayer(this.checked, KnockshigownaLines); break;
case "KnockshigownaJBHLines": toggleLayer(this.checked, KnockshigownaJBHLines); break;
case "KnockroeLines": toggleLayer(this.checked, KnockroeLines); break;
case "KnockroeJBHLines": toggleLayer(this.checked, KnockroeJBHLines); break;
case "knockroevch": toggleLayer(this.checked, knockroevch); break;
case "KnockroeVCO": toggleLayer(this.checked, KnockroeVCO); break;
case "lackanvch": toggleLayer(this.checked, lackanvch); break;
case "LackanVCO": toggleLayer(this.checked, LackanVCO); break;
case "LackanLines": toggleLayer(this.checked, LackanLines); break;
case "LackanJBHLines": toggleLayer(this.checked, LackanJBHLines); break;
case "lambayvch": toggleLayer(this.checked, lambayvch); break;
case "LambayVCO": toggleLayer(this.checked, LambayVCO); break;
case "LambayLines": toggleLayer(this.checked, LambayLines); break;
case "LambayJBHLines": toggleLayer(this.checked, LambayJBHLines); break;
case "lismullinvch": toggleLayer(this.checked, lismullinvch); break;
case "LismullinVCO": toggleLayer(this.checked, LismullinVCO); break;
case "LismullinLines": toggleLayer(this.checked, LismullinLines); break;
case "LismullinJBHLines": toggleLayer(this.checked, LismullinJBHLines); break;
case "loughcrewvch": toggleLayer(this.checked, loughcrewvch); break;
case "LoughcrewVCO": toggleLayer(this.checked, LoughcrewVCO); break;
case "LoughcrewLines": toggleLayer(this.checked, LoughcrewLines); break;
case "LoughcrewJBHLines": toggleLayer(this.checked, LoughcrewJBHLines); break;
case "CarbanewestLines": toggleLayer(this.checked, CarbanewestLines); break;
case "CarbanewestJBHLines": toggleLayer(this.checked, CarbanewestJBHLines); break;
case "CarbanewestVCO": toggleLayer(this.checked, CarbanewestVCO); break;
case "Carbanewestvch": toggleLayer(this.checked, Carbanewestvch); break;
case "lugnaquillavch": toggleLayer(this.checked, lugnaquillavch); break;
case "LugnaquillaVCO": toggleLayer(this.checked, LugnaquillaVCO); break;
case "lugnaquillawestvch": toggleLayer(this.checked, lugnaquillawestvch); break;
case "LugnaquillawestVCO": toggleLayer(this.checked, LugnaquillawestVCO); break;
case "LugnaquillaLines": toggleLayer(this.checked, LugnaquillaLines); break;
case "Lismorevch": toggleLayer(this.checked, Lismorevch); break;
case "LismoreVCO": toggleLayer(this.checked, LismoreVCO); break;
case "LismoreJAHLines": toggleLayer(this.checked, LismoreJAHLines); break;
case "LismoreJBHLines": toggleLayer(this.checked, LismoreJBHLines); break;
case "MagheracarLines": toggleLayer(this.checked, MagheracarLines); break;
case "MagheracarJBHLines": toggleLayer(this.checked, MagheracarJBHLines); break;
case "meayllhillvch": toggleLayer(this.checked, meayllhillvch); break;
case "MeayllhillVCO": toggleLayer(this.checked, MeayllhillVCO); break;
case "MeayllhillLines": toggleLayer(this.checked, MeayllhillLines); break;
case "MeaylhillJBHLines": toggleLayer(this.checked, MeaylhillJBHLines); break;
case "millmountvch": toggleLayer(this.checked, millmountvch); break;
case "MillmountVCO": toggleLayer(this.checked, MillmountVCO); break;
case "MillmountLines": toggleLayer(this.checked, MillmountLines); break;
case "MillmountJBHLines": toggleLayer(this.checked, MillmountJBHLines); break;
case "Mooghaunvch": toggleLayer(this.checked, Mooghaunvch); break;
case "MooghaunVCO": toggleLayer(this.checked, MooghaunVCO); break;
case "MooghaunJAHLines": toggleLayer(this.checked, MooghaunJAHLines); break;
case "MooghaunJBHLines": toggleLayer(this.checked, MooghaunJBHLines); break;
case "moneydigvch": toggleLayer(this.checked, moneydigvch); break;
case "MoneydigVCO": toggleLayer(this.checked, MoneydigVCO); break;
case "MoneydigLines": toggleLayer(this.checked, MoneydigLines); break;
case "MoneydigJBHLines": toggleLayer(this.checked, MoneydigJBHLines); break;
case "montpeliervch": toggleLayer(this.checked, montpeliervch); break;
case "MontpelierVCO": toggleLayer(this.checked, MontpelierVCO); break;
case "MontpelierLines": toggleLayer(this.checked, MontpelierLines); break;
case "MontpelierJBHLines": toggleLayer(this.checked, MontpelierJBHLines); break;
case "mountainstownvch": toggleLayer(this.checked, mountainstownvch); break;
case "MountainstownVCO": toggleLayer(this.checked, MountainstownVCO); break;
case "MountainstownLines": toggleLayer(this.checked, MountainstownLines); break;
case "MountainstownJBHLines": toggleLayer(this.checked, MountainstownJBHLines); break;
case "Mountfortesquevch": toggleLayer(this.checked, Mountfortesquevch); break;
case "MountfortesqueVCO": toggleLayer(this.checked, MountfortesqueVCO); break;
case "MountfortesqueJAHLines": toggleLayer(this.checked, MountfortesqueJAHLines); break;
case "MountfortesqueJBHLines": toggleLayer(this.checked, MountfortesqueJBHLines); break;
case "mountgarretvch": toggleLayer(this.checked, mountgarretvch); break;
case "MountgarretVCO": toggleLayer(this.checked, MountgarretVCO); break;
case "MountgarretLines": toggleLayer(this.checked, MountgarretLines); break;
case "MountgarretJBHLines": toggleLayer(this.checked, MountgarretJBHLines); break;
case "mountleinstervch": toggleLayer(this.checked, mountleinstervch); break;
case "MountleinsterVCO": toggleLayer(this.checked, MountleinsterVCO); break;
case "MountleinsterLines": toggleLayer(this.checked, MountleinsterLines); break;
case "MountleinsterJBHLines": toggleLayer(this.checked, MountleinsterJBHLines); break;
case "MullaghJBHLines": toggleLayer(this.checked, MullaghJBHLines); break;
case "MullaghJAHLines": toggleLayer(this.checked, MullaghJAHLines); break;
case "mullaghcleevaunnorthvch": toggleLayer(this.checked, mullaghcleevaunnorthvch); break;
case "MullaghcleevaunnorthVCO": toggleLayer(this.checked, MullaghcleevaunnorthVCO); break;
case "MullaghcleevaunnorthLines": toggleLayer(this.checked, MullaghcleevaunnorthLines); break;
case "MullaghnasheeJAHLines": toggleLayer(this.checked, MullaghnasheeJAHLines); break;
case "MullaghnasheeJBHLines": toggleLayer(this.checked, MullaghnasheeJBHLines); break;
case "MullaghnasheeVCO": toggleLayer(this.checked, MullaghnasheeVCO); break;
case "Mullaghnasheevch": toggleLayer(this.checked, Mullaghnasheevch); break;
case "RathoseyJAHLines": toggleLayer(this.checked, RathoseyJAHLines); break;
case "RathoseyJBHLines": toggleLayer(this.checked, RathoseyJBHLines); break;
case "RathoseyVCO": toggleLayer(this.checked, RathoseyVCO); break;
case "Rathoseyvch": toggleLayer(this.checked, Rathoseyvch); break;
case "ManorJBHLines": toggleLayer(this.checked, ManorJBHLines); break;
case "ManorJAHLines": toggleLayer(this.checked, ManorJAHLines); break;
case "mullanasheevch": toggleLayer(this.checked, mullanasheevch); break;
case "MohercromJAHLines": toggleLayer(this.checked, MohercromJAHLines); break;
case "MohercromJBHLines": toggleLayer(this.checked, MohercromJBHLines); break;
case "MohercromVCO": toggleLayer(this.checked, MohercromVCO); break;
case "Mohercromvch": toggleLayer(this.checked, Mohercromvch); break;
case "mullanasheevch": toggleLayer(this.checked, mullanasheevch); break;
case "MullanasheeVCO": toggleLayer(this.checked, MullanasheeVCO); break;
case "MullanasheeLines": toggleLayer(this.checked, MullanasheeLines); break;
case "MweelraJBHLines": toggleLayer(this.checked, MweelraJBHLines); break;
case "MweelraJAHLines": toggleLayer(this.checked, MweelraJAHLines); break;
case "NavanfortLines": toggleLayer(this.checked, NavanfortLines); break;
case "NavanfortJBHLines": toggleLayer(this.checked, NavanfortJBHLines); break;
case "NavanfortVCO": toggleLayer(this.checked, NavanfortVCO); break;
case "Navanfortvch": toggleLayer(this.checked, Navanfortvch); break;
case "NewcastleJBHLines": toggleLayer(this.checked, NewcastleJBHLines); break;
case "NewcastleJAHLines": toggleLayer(this.checked, NewcastleJAHLines); break;
case "NewgrangeCEJAHLines": toggleLayer(this.checked, NewgrangeCEJAHLines); break;
case "NewgrangeCEJBHLines": toggleLayer(this.checked, NewgrangeCEJBHLines); break;
case "newtownmarker": toggleLayer(this.checked, newtownmarker); break;
case "ochavch": toggleLayer(this.checked, ochavch); break;
case "OchaVCO": toggleLayer(this.checked, OchaVCO); break;
case "OchaLines": toggleLayer(this.checked, OchaLines); break;
case "OchaJBHLines": toggleLayer(this.checked, OchaJBHLines); break;
case "ochacombolines": toggleLayer(this.checked, ochacombolines); break;
case "ochashorthand": toggleLayer(this.checked, ochashorthand); break;
case "ParknabinniaVCO": toggleLayer(this.checked, ParknabinniaVCO); break;
case "parknabinniavch": toggleLayer(this.checked, parknabinniavch); break;
case "ParknabinniaLines": toggleLayer(this.checked, ParknabinniaLines); break;
case "ParknabinniaJBHLines": toggleLayer(this.checked, ParknabinniaJBHLines); break;
case "patrickstownvch": toggleLayer(this.checked, patrickstownvch); break;
case "PatrickstownVCO": toggleLayer(this.checked, PatrickstownVCO); break;
case "PatrickstownLines": toggleLayer(this.checked, PatrickstownLines); break;
case "PatrickstownJBHLines": toggleLayer(this.checked, PatrickstownJBHLines); break;
case "PatrickstownME009073JBHLines": toggleLayer(this.checked, PatrickstownME009073JBHLines); break;
case "PatrickstownME009073JAHLines": toggleLayer(this.checked, PatrickstownME009073JAHLines); break;
case "PollduffJBHLines": toggleLayer(this.checked, PollduffJBHLines); break;
case "PollduffJAHLines": toggleLayer(this.checked, PollduffJAHLines); break;
case "PollnahalliaJBHLines": toggleLayer(this.checked, PollnahalliaJBHLines); break;
case "PollnahalliaJAHLines": toggleLayer(this.checked, PollnahalliaJAHLines); break;
case "RathbarnaJBHLines": toggleLayer(this.checked, RathbarnaJBHLines); break;
case "RathbarnaJAHLines": toggleLayer(this.checked, RathbarnaJAHLines); break;
case "RathdrumJBHLines": toggleLayer(this.checked, RathdrumJBHLines); break;
case "RathdrumJAHLines": toggleLayer(this.checked, RathdrumJAHLines); break;
case "RathmichaelJBHLines": toggleLayer(this.checked, RathmichaelJBHLines); break;
case "RathmichaelJAHLines": toggleLayer(this.checked, RathmichaelJAHLines); break;
case "rhodevch": toggleLayer(this.checked, rhodevch); break;
case "RhodeVCO": toggleLayer(this.checked, RhodeVCO); break;
case "RhodeLines": toggleLayer(this.checked, RhodeLines); break;
case "RhodeJBHLines": toggleLayer(this.checked, RhodeJBHLines); break;
case "RinglestownJBHLines": toggleLayer(this.checked, RinglestownJBHLines); break;
case "RinglestownJAHLines": toggleLayer(this.checked, RinglestownJAHLines); break;
case "RockvilleVCO": toggleLayer(this.checked, RockvilleVCO); break;
case "Rockvillevch": toggleLayer(this.checked, Rockvillevch); break;
case "RockvilleJAHLines": toggleLayer(this.checked, RockvilleJAHLines); break;
case "RockvilleJBHLines": toggleLayer(this.checked, RockvilleJBHLines); break;
case "RockvilleComboLines": toggleLayer(this.checked, RockvilleComboLines); break;
case "rockvillemarkergroup": toggleLayer(this.checked, rockvillemarkergroup); break;
case "rockvilleshorthand": toggleLayer(this.checked, rockvilleshorthand); break;
case "RossbegJBHLines": toggleLayer(this.checked, RossbegJBHLines); break;
case "RossbegJAHLines": toggleLayer(this.checked, RossbegJAHLines); break;
case "rushvch": toggleLayer(this.checked, rushvch); break;
case "RushVCO": toggleLayer(this.checked, RushVCO); break;
case "RushLines": toggleLayer(this.checked, RushLines); break;
case "RushJBHLines": toggleLayer(this.checked, RushJBHLines); break;
case "SelectedazimuthsLines": toggleLayer(this.checked, SelectedazimuthsLines); break;
case "seahanvch": toggleLayer(this.checked, seahanvch); break;
case "SeahanVCO": toggleLayer(this.checked, SeahanVCO); break;
case "SeahanLines": toggleLayer(this.checked, SeahanLines); break;
case "scrabbaghvch": toggleLayer(this.checked, scrabbaghvch); break;
case "ScrabbaghVCO": toggleLayer(this.checked, ScrabbaghVCO); break;
case "ScrabbaghLines": toggleLayer(this.checked, ScrabbaghLines); break;
case "ScrabbaghJBHLines": toggleLayer(this.checked, ScrabbaghJBHLines); break;
case "screggeastvch": toggleLayer(this.checked, screggeastvch); break;
case "ScreggeastVCO": toggleLayer(this.checked, ScreggeastVCO); break;
case "ScreggeastLines": toggleLayer(this.checked, ScreggeastLines); break;
case "ScreggeastJBHLines": toggleLayer(this.checked, ScreggeastJBHLines); break;
case "ScurlocksleapJBHLines": toggleLayer(this.checked, ScurlocksleapJBHLines); break;
case "ScurlocksleapJAHLines": toggleLayer(this.checked, ScurlocksleapJAHLines); break;
case "ScurlocksleapVCO": toggleLayer(this.checked, ScurlocksleapVCO); break;
case "Scurlocksleapvch": toggleLayer(this.checked, Scurlocksleapvch); break;
case "sheebegvch": toggleLayer(this.checked, sheebegvch); break;
case "SheebegVCO": toggleLayer(this.checked, SheebegVCO); break;
case "SheebegLines": toggleLayer(this.checked, SheebegLines); break;
case "SheebegJBHLines": toggleLayer(this.checked, SheebegJBHLines); break;
case "sheemorevch": toggleLayer(this.checked, sheemorevch); break;
case "SheemoreVCO": toggleLayer(this.checked, SheemoreVCO); break;
case "SheemoreLines": toggleLayer(this.checked, SheemoreLines); break;
case "SheemoreJBHLines": toggleLayer(this.checked, SheemoreJBHLines); break;
case "shroughvch": toggleLayer(this.checked, shroughvch); break;
case "ShroughVCO": toggleLayer(this.checked, ShroughVCO); break;
case "ShroughLines": toggleLayer(this.checked, ShroughLines); break;
case "ShroughJBHLines": toggleLayer(this.checked, ShroughJBHLines); break;
case "slanevch": toggleLayer(this.checked, slanevch); break;
case "SlaneVCO": toggleLayer(this.checked, SlaneVCO); break;
case "slanemarker": toggleLayer(this.checked, slanemarker); break;
case "slanemarkers": toggleLayer(this.checked, slanemarkers); break;
case "slanemarkergroup": toggleLayer(this.checked, slanemarkergroup); break;
case "SlaneLines": toggleLayer(this.checked, SlaneLines); break;
case "SlaneJBHLines": toggleLayer(this.checked, SlaneJBHLines); break;
case "SlaneselectedJBHLines": toggleLayer(this.checked, SlaneselectedJBHLines); break;
case "SlaneselectedJAHLines": toggleLayer(this.checked, SlaneselectedJAHLines); break;
case "slanecombolinesLayer": toggleLayer(this.checked, slanecombolinesLayer); break;
case "slaneshorthand": toggleLayer(this.checked, slaneshorthand); break;
case "slievedonardvch": toggleLayer(this.checked, slievedonardvch); break;
case "SlievedonardVCO": toggleLayer(this.checked, SlievedonardVCO); break;
case "SlievedonardLines": toggleLayer(this.checked, SlievedonardLines); break;
case "SlievedonardJBHLines": toggleLayer(this.checked, SlievedonardJBHLines); break;
case "slievegullionvch": toggleLayer(this.checked, slievegullionvch); break;
case "SlievegullionVCO": toggleLayer(this.checked, SlievegullionVCO); break;
case "SlievegullionLines": toggleLayer(this.checked, SlievegullionLines); break;
case "SlievegullionJBHLines": toggleLayer(this.checked, SlievegullionJBHLines); break;
case "slievegullioncomboLines": toggleLayer(this.checked, slievegullioncomboLines); break;
case "Slieveanerinvch": toggleLayer(this.checked, Slieveanerinvch); break;
case "SlieveanerinVCO": toggleLayer(this.checked, SlieveanerinVCO); break;
case "SlieveanerinJAHLines": toggleLayer(this.checked, SlieveanerinJAHLines); break;
case "SlieveanerinJBHLines": toggleLayer(this.checked, SlieveanerinJBHLines); break;
case "slieveanerincombolines": toggleLayer(this.checked, slieveanerincombolines); break;
case "slieveanerinmarkers": toggleLayer(this.checked, slieveanerinmarkers); break;
case "slieveanerinshorthand": toggleLayer(this.checked, slieveanerinshorthand); break;
case "SlieveanerinselectedJBHLines": toggleLayer(this.checked, SlieveanerinselectedJBHLines); break;
case "SlieveanerinselectedJAHLines": toggleLayer(this.checked, SlieveanerinselectedJAHLines); break;
case "slievethoulvch": toggleLayer(this.checked, slievethoulvch); break;
case "SlievethoulVCO": toggleLayer(this.checked, SlievethoulVCO); break;
case "SlievethoulLines": toggleLayer(this.checked, SlievethoulLines); break;
case "SlievethoulJBHLines": toggleLayer(this.checked, SlievethoulJBHLines); break;
case "smarmorecombolines": toggleLayer(this.checked, smarmorecombolines); break;
case "smarmoremarkers": toggleLayer(this.checked, smarmoremarkers); break;
case "smarmoreshorthand": toggleLayer(this.checked, smarmoreshorthand); break;
case "SpinianshillJBHLines": toggleLayer(this.checked, SpinianshillJBHLines); break;
case "SpinianshillJAHLines": toggleLayer(this.checked, SpinianshillJAHLines); break;
case "SpinianshillVCO": toggleLayer(this.checked, SpinianshillVCO); break;
case "Spinianshillvch": toggleLayer(this.checked, Spinianshillvch); break;
case "TailtiuJBHLines": toggleLayer(this.checked, TailtiuJBHLines); break;
case "TailtiuJAHLines": toggleLayer(this.checked, TailtiuJAHLines); break;
case "taravch": toggleLayer(this.checked, taravch); break;
case "tarashorthand": toggleLayer(this.checked, tarashorthand); break;
case "TaraVCO": toggleLayer(this.checked, TaraVCO); break;
case "TaraLines": toggleLayer(this.checked, TaraLines); break;
case "TaraComboLines": toggleLayer(this.checked, TaraComboLines); break;
case "TaraComboMarkers": toggleLayer(this.checked, TaraComboMarkers); break;
case "TaraNewgrangeLines": toggleLayer(this.checked, TaraNewgrangeLines); break;
case "TaraJahLines": toggleLayer(this.checked, TaraJahLines); break;
case "TaraJBHLines": toggleLayer(this.checked, TaraJBHLines); break;
case "TaraJBHLinesa": toggleLayer(this.checked, TaraJBHLinesa); break;
case "TavanskeaVCO": toggleLayer(this.checked, TavanskeaVCO); break;
case "Tavanskeavch": toggleLayer(this.checked, Tavanskeavch); break;
case "TavanskeaJAHLines": toggleLayer(this.checked, TavanskeaJAHLines); break;
case "TavanskeaJBHLines": toggleLayer(this.checked, TavanskeaJBHLines); break;
case "tawnatrohaunvch": toggleLayer(this.checked, tawnatrohaunvch); break;
case "TawnatrohaunVCO": toggleLayer(this.checked, TawnatrohaunVCO); break;
case "TawnatrohaunLines": toggleLayer(this.checked, TawnatrohaunLines); break;
case "TawnatrohaunJBHLines": toggleLayer(this.checked, TawnatrohaunJBHLines); break;
case "thegreystonevch": toggleLayer(this.checked, thegreystonevch); break;
case "ThegreystoneVCO": toggleLayer(this.checked, ThegreystoneVCO); break;
case "ThegreystoneLines": toggleLayer(this.checked, ThegreystoneLines); break;
case "ThegreystoneJBHLines": toggleLayer(this.checked, ThegreystoneJBHLines); break;
case "thomastownvch": toggleLayer(this.checked, thomastownvch); break;
case "ThomastownVCO": toggleLayer(this.checked, ThomastownVCO); break;
case "ThomastownLines": toggleLayer(this.checked, ThomastownLines); break;
case "ThomastownJBHLines": toggleLayer(this.checked, ThomastownJBHLines); break;
case "TiknockLines": toggleLayer(this.checked, TiknockLines); break;
case "TiknockJBHLines": toggleLayer(this.checked, TiknockJBHLines); break;
case "tiknockvch": toggleLayer(this.checked, tiknockvch); break;
case "TiknockVCO": toggleLayer(this.checked, TiknockVCO); break;
case "TlachgtaVCO": toggleLayer(this.checked, TlachgtaVCO); break;
case "Tlachgtavch": toggleLayer(this.checked, Tlachgtavch); break;
case "TlachgtaJAHLines": toggleLayer(this.checked, TlachgtaJAHLines); break;
case "TlachgtaJBHLines": toggleLayer(this.checked, TlachgtaJBHLines); break;
case "ToberroryJBHLines": toggleLayer(this.checked, ToberroryJBHLines); break;
case "ToberroryJAHLines": toggleLayer(this.checked, ToberroryJAHLines); break;
case "ToonaghLines": toggleLayer(this.checked, ToonaghLines); break;
case "torantvch": toggleLayer(this.checked, torantvch); break;
case "TorantVCO": toggleLayer(this.checked, TorantVCO); break;
case "TorantLines": toggleLayer(this.checked, TorantLines); break;
case "TorantJBHLines": toggleLayer(this.checked, TorantJBHLines); break;
case "TownleyhallLines": toggleLayer(this.checked, TownleyhallLines); break;
case "TownleyhallJBHLines": toggleLayer(this.checked, TownleyhallJBHLines); break;
case "TownleyhallVCO": toggleLayer(this.checked, TownleyhallVCO); break;
case "Townleyhallvch": toggleLayer(this.checked, Townleyhallvch); break;
case "TreanmacmurtaghJBHLines": toggleLayer(this.checked, TreanmacmurtaghJBHLines); break;
case "TreanmacmurtaghJAHLines": toggleLayer(this.checked, TreanmacmurtaghJAHLines); break;
case "TreanmacmurtaghVCO": toggleLayer(this.checked, TreanmacmurtaghVCO); break;
case "Treanmacmurtaghvch": toggleLayer(this.checked, Treanmacmurtaghvch); break;
case "TrinityislandJBHLines": toggleLayer(this.checked, TrinityislandJBHLines); break;
case "TrinityislandJAHLines": toggleLayer(this.checked, TrinityislandJAHLines); break;
case "tuckmillhillvch": toggleLayer(this.checked, tuckmillhillvch); break;
case "TuckmillhillVCO": toggleLayer(this.checked, TuckmillhillVCO); break;
case "TuckmillhillLines": toggleLayer(this.checked, TuckmillhillLines); break;
case "TuckmillhillJBHLines": toggleLayer(this.checked, TuckmillhillJBHLines); break;
case "uisneachvch": toggleLayer(this.checked, uisneachvch); break;
case "K52UC1167vch": toggleLayer(this.checked, K52UC1167vch); break;
case "UisneachVCO": toggleLayer(this.checked, UisneachVCO); break;
case "K52UC1167VCO": toggleLayer(this.checked, K52UC1167VCO); break;
case "UisneachLines": toggleLayer(this.checked, UisneachLines); break;
case "UisneachJAHLines": toggleLayer(this.checked, UisneachJAHLines); break;
case "Uisneach45Lines": toggleLayer(this.checked, Uisneach45Lines); break;
case "UisneachjbhLines": toggleLayer(this.checked, UisneachjbhLines); break;
case "UisneachJBHLines": toggleLayer(this.checked, UisneachJBHLines); break;
case "UisneachRadial": toggleLayer(this.checked, UisneachRadial); break;
case "UisneachInwardLines": toggleLayer(this.checked, UisneachInwardLines); break;
case "uisneachEW": toggleLayer(this.checked, uisneachEW); break;
case "uisneach": toggleLayer(this.checked, uisneach); break;
case "uisneachjbhmarkers": toggleLayer(this.checked, uisneachjbhmarkers); break;
case "uisneachjahmarkergroup": toggleLayer(this.checked, uisneachjahmarkergroup); break;
case "uisneachinwardgroup": toggleLayer(this.checked, uisneachinwardgroup); break;
case "uisneachcombovisibilityLayer": toggleLayer(this.checked, uisneachcombovisibilityLayer); break;
case "unionvch": toggleLayer(this.checked, unionvch); break;
case "UnionVCO": toggleLayer(this.checked, UnionVCO); break;
case "UnionLines": toggleLayer(this.checked, UnionLines); break;
case "UnionJBHLines": toggleLayer(this.checked, UnionJBHLines); break;
case "WindyedgeLines": toggleLayer(this.checked, WindyedgeLines); break;
case "massrockstoggle": toggleLayer(this.checked, massrockstoggle); break;
case "route": toggleLayer(this.checked, route); break;
case "uisneachcircle": toggleLayer(this.checked, uisneachcircle); break;
case "route1": toggleLayer(this.checked, route1); break;
case "testarrow": toggleLayer(this.checked, testarrow); break;
case "slievegullionexample": toggleLayer(this.checked, slievegullionexample); break;
case "slievegullionexamplelines": toggleLayer(this.checked, slievegullionexamplelines); break;
case "cairnsucLayer": toggleLayer(this.checked, cairnsucLayer); break;
case "nicairnsLayer": toggleLayer(this.checked, nicairnsLayer); break;
case "matrix": toggleLayer(this.checked, matrix); break;
case "taracombo": toggleLayer(this.checked, taracombo); break;	
case "taramarkergroup": toggleLayer(this.checked, taramarkergroup); break;
case "gullioncombo": toggleLayer(this.checked, gullioncombo); break;	
case "gullionmarkergroup": toggleLayer(this.checked, gullionmarkergroup); break;
case "cairntcombo": toggleLayer(this.checked, cairntcombo); break;	
case "cairntmarkergroup": toggleLayer(this.checked, cairntmarkergroup); break;
case "taracombovisibilityLayer": toggleLayer(this.checked, taracombovisibilityLayer); break;
case "slievegullioncombovisibilityLayer": toggleLayer(this.checked, slievegullioncombovisibilityLayer); break;
case "mountleinstercombovisibilityLayer": toggleLayer(this.checked, mountleinstercombovisibilityLayer); break;
case "parknabinniacombovisibilityLayer": toggleLayer(this.checked, parknabinniacombovisibilityLayer); break;
case "howthcombovisibilityLayer": toggleLayer(this.checked, howthcombovisibilityLayer); break;
case "croaghpatrickcombovisibilityLayer": toggleLayer(this.checked, croaghpatrickcombovisibilityLayer); break;
case "slievedonardcombovisibilityLayer": toggleLayer(this.checked, slievedonardcombovisibilityLayer); break;



case "unclassifiedtombs": toggleLayer(this.checked, unclassifiedtombs); break;








  }
});



