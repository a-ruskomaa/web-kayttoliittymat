"use strict";
// seuraavat estävät jshintin narinat jqueryn ja leafletin objekteista
/* jshint jquery: true */
/* globals L */

console.log(data);


/**
 * Luo "API:n" selkiyttämään vastuuta datan käsittelystä. API:n sisälle on
 * kapseloituna datan käsittelyyn liittyvä sovelluslogiikka. API tarjoaa julkiset metodit
 * valmiiksi käsitellyn datan hakemiseen, lisäämiseen ja muokkaamiseen. API:n kautta
 * tallennettavaa dataa ei lähtökohtaisesti validoida, vaan validointi ja datan oikeellisuuden
 * varmistaminen jää käyttöliittymäkoodin vastuulle. 
 * 
 * API:n metodit palauttavat syväkopioidut versiot datasta, joten alkuperäisen
 * datan tahaton muokkaaminen ei ole mahdollista.
 * 
 * Alaviivalla alkavat metodit ovat API:n sisäiseen käyttöön. Julkiset metodit
 * on nimetty normaalisti.
 */
const API = (function (_data) {
    var _rastit = _teeRastiHakemisto();
    var _joukkueet = _teeJoukkueHakemisto();
    var _sarjat = _teeSarjaHakemisto();


    /** Metodi tekee argumenttina annetusta objektista syväkopion,
     * eli palauttaa objektin jonka kaikki attribuutit on rekursiivisesti
     * kopioitu eikä palautettava objekti sisällä muistiviitteitä alkuperäisen
     * objektin sisältöön.
     * 
     * @param {object}
     * @returns {object}
     */
    function deepCopy(object) {
        let newObject = Object.create(Object.getPrototypeOf(object));
        Object.getOwnPropertyNames(object).forEach(prop => {
            if (typeof prop === "object") {
                newObject[prop] = deepCopy(prop);
            } else {
                newObject[prop] = object[prop];
            }
        });
        return newObject;
    }


    /** Luodaan rasteista hakemisto, jonka avaimena toimii rastin id */
    function _teeRastiHakemisto() {
        let rastiMap = new Map();
        _data.rastit.forEach(rasti => rastiMap.set(rasti.id, rasti));

        return rastiMap;
    }

    /** Luodaan joukkueista hakemisto, jonka avaimena toimii joukkueen id */
    function _teeJoukkueHakemisto() {
        let joukkueMap = new Map();
        _data.joukkueet.forEach(joukkue => joukkueMap.set(joukkue.id, joukkue));

        return joukkueMap;
    }

    /** Luodaan sarjoista hakemisto, jonka avaimena toimii sarjan id */
    function _teeSarjaHakemisto() {
        let sarjaMap = new Map();
        _data.sarjat.forEach(sarja => sarjaMap.set(sarja.id, sarja));

        return sarjaMap;
    }



    /**
 * Hakee joukkueen leimaamien rastien kaikki tiedot.
 * 
 * Funktio siivoaa pois rastit, jotka on leimattu ennen lähtöä tai maaliin
 * tulon jälkeen, sekä rastit joiden tiedot ovat puutteelliset.
 * 
 * Leimaukset palautetaan taulukkona objekteja.
 */
    function haeLeimatutRastit(joukkueId) {
        let joukkue = haeJoukkueIdlla(joukkueId);

        //haetaan valmiiksi kilpailun lähtö- ja maalirastit pisteytettävien
        //rastien rajaamista varten
        let lahtoRasti = haeRastiKoodilla("LAHTO");
        let maaliRasti = haeRastiKoodilla("MAALI");

        //palautetaan tyhjä taulukko jos rasteja ei ole määritelty
        if (joukkue.rastit === undefined || joukkue.rastit.length === 0) {
            return new Array(0);
        }

        //luodaan rasteista uusi taulukko, jotta alkuperäistä taulukkoa ei muuteta
        let rastit = Array.from(joukkue.rastit);

        //järjestetään rastit leimauksen mukaiseen järjestykseen
        rastit.sort((a, b) => a.aika - b.aika);

        let lahto_index;
        let maali_index;
        let rasteja = rastit.length;

        //etsitään viimeisin lähtöleimaus
        for (let i = rasteja - 1; i >= 0; i--) {
            if (rastit[i].rasti == lahtoRasti.id) {
                lahto_index = i;
                break;
            }
        }

        if (lahto_index === 0 && rastit[lahto_index].rasti != lahtoRasti.id) {
            //ei lähtöleimausta, ei voida laskea tulosta
            return new Array(0);
        }

        //poistetaan taulukosta leimaukset, jotka ovat tapahtuneet aiemmin kuin
        //viimeisin lähtörastin leimaus
        rastit.splice(0, lahto_index);

        // console.log(rastit);

        //pituus saattoi muuttua
        rasteja = rastit.length;

        //etsitään ensimmäinen maalileimaus
        for (let i = 0; i < rasteja; i++) {
            if (rastit[i].rasti == maaliRasti.id) {
                maali_index = i;
                break;
            }
        }

        if (maali_index === rasteja - 1 && rastit[maali_index].rasti != maaliRasti.id) {
            //ei maalileimausta, ei voida laskea tulosta
            return new Array(0);
        }

        //poistetaan taulukosta leimaukset, jotka ovat tapahtuneet myöhemmin kuin
        //ensimmäinen maalirastin leimaus
        rastit.splice(maali_index + 1, rasteja - maali_index + 1);

        //luodaan joukko, jonka avulla poistetaan rasteista duplikaatit
        let rastiSet = new Set();

        let rastiObjektit = new Array(0);

        for (let i = 0; i < rastit.length; i++) {
            let rastiId = rastit[i].rasti;

            //karsitaan pois huono data
            if (rastiId === null || rastiId === "0" || rastiId === undefined) {
                continue;
            }

            if (typeof rastiId !== 'number') {
                rastiId = parseInt(rastiId);
            }

            if (isNaN(rastiId)) {
                continue;
            }

            //karsitaan duplikaatit
            if (rastiSet.has(rastiId)) {
                continue;
            }

            //etsitään rastin id:lla rastia
            let rastiObj = _rastit.get(rastiId);

            if (rastiObj === null) {
                continue;
            }

            //lisätään rastin id joukkoon, jotta rasti käsitellään vain kerran
            rastiSet.add(rastiId);

            //luodaan yksi objekti, joka sisältää kaikki rastin tiedot. näin vältytään turhalta
            //etsinnältä jatkossa
            rastiObjektit.push({
                id: rastiObj.id,
                koodi: rastiObj.koodi,
                aika: rastit[i].aika
            });
        }

        return rastiObjektit;
    }

    /**
     * Hakee datasta joukkueiden kaikki tiedot, palauttaa joukkueiden tiedot taulukossa.
     * @returns {Array}
     */
    function haeJoukkueet() {
        return deepCopy(_data.joukkueet);
    }

    /**
     * Etsii joukkueen annetun nimen perusteella. Jättää
     * huomioimatta kirjainkoon sekä alussa ja lopussa esiintyvät
     * välilyönnit. Palauttaa null jos ei löydy.
     * @param {string} nimi
     * @returns {?object}
     */
    function haeJoukkueNimella(nimi) {
        nimi = nimi.trim().toLowerCase();

        for (let joukkue of _data.joukkueet) {
            if (joukkue.nimi.trim().toLowerCase() === nimi) {
                return deepCopy(joukkue);
            }
        }

        return null;
    }

    /**
     * Etsii joukkueen annetun id:n perusteella. Palauttaa null jos ei löydy.
     * @param {number} joukkueId
     * @return {?object}
     */
    function haeJoukkueIdlla(joukkueId) {
        if (typeof joukkueId !== 'number') {
            joukkueId = parseInt(joukkueId);
        }
        if (isNaN(joukkueId)) {
            return null;
        }
        return deepCopy(_joukkueet.get(joukkueId));
    }

    /**
     * Palauttaa kaikki dataan tallennetut rastit sisältäen rastin id:n, koodin
     * sekä koordinaatit.
     * @returns {Array}
     */
    function haeRastit() {
        return deepCopy(_data.rastit);
    }

    /**
     * Etsii rastin annetun koodin perusteella. Palauttaa null jos ei löydy.
     * @param {string} rastiKoodi
     * @returns {?object}
     */
    function haeRastiKoodilla(rastiKoodi) {
        for (let rasti of _rastit.values()) {
            if (rasti.koodi === rastiKoodi) {
                return deepCopy(rasti);
            }
        }

        return null;
    }


    /**
     * Etsii rastin annetun id:n perusteella. Palauttaa "tyhjän"
     * rastin jos rastia ei löydy.
     * @param {number} rastiId
     * @returns {object}
    */
    function haeRastiIdlla(rastiId) {
        if (typeof rastiId !== 'number') {
            rastiId = parseInt(rastiId);
        }
        let rasti = _rastit.get(rastiId);

        if (rasti !== undefined) {
            return deepCopy(rasti);
        }
        return {
            rasti: 0,
            koodi: "Tuntematon rasti"
        };
    }

    /**
     * Palauttaa kaikki dataan tallennetut sarjat
     * @returns {Array}
     */
    function haeSarjat() {
        return deepCopy(_data.sarjat);
    }

    /**
     * Etsii sarjan annetun id:n perusteella. Palauttaa null jos ei löydy.
     * @param {number} sarjaId
     * @returns {?object}
     * */
    function haeSarjaIdlla(sarjaId) {
        if (typeof sarjaId !== 'number') {
            sarjaId = parseInt(sarjaId);
        }
        if (isNaN(sarjaId)) {
            return null;
        }
        return deepCopy(_sarjat.get(sarjaId));
    }


    /**
     * Palauttaa kaikki dataan tallennetut leimaustavat
     * @returns {Array}
     */
    function haeLeimaustavat() {
        return deepCopy(_data.leimaustavat);
    }


    /**
     * Lisää dataan uuden rastin tiedot. Parametrina annettava objekti,
     * joka sisältää rastin tiedot dataa vastaavassa muodossa. Antaa rastille
     * id:n, joka on yhdellä suurempi kuin edellinen suurin id.
     * @param {object} rasti
     * @returns {object}
     */
    function lisaaRasti(rasti) {

        let id = Math.max(..._rastit.keys()) + 1;
        rasti.id = id;

        _data.rastit.push(rasti);

        _rastit.set(rasti.id, rasti);

        console.log(_data.rastit);

        return rasti;
    }

    /**
     * Muokkaa aiemmin luodun rastin tietoja. Parametrina annettava objekti,
     * joka sisältää rastin tiedot dataa vastaavassa muodossa.
     * @param {object} rasti
     * @returns {object}
     */
    function muokkaaRasti(rasti) {
        let _rasti = _rastit.get(rasti.id);

        _rasti.koodi = rasti.koodi;

        _rasti.lat = rasti.lat;

        _rasti.lon = rasti.lon;

        console.log(_data.rastit);

        return deepCopy(rasti);
    }

    /**
     * Lisää dataan uuden leimaustavan tiedot
     * @param {object} leimaustapa
     */
    function lisaaLeimaustapa(leimaustapa) {
        _data.leimaustavat.push(leimaustapa);
    }

    /**
     * Lisää uuden joukkueen dataan. Parametrina annettava joukkueen tiedot
     * sisältävä objekti.
     * @param {object} joukkue
     * @returns {object}
     */
    function lisaaJoukkue(joukkue) {
        // annetaan joukkueelle yksilöivä id
        joukkue.id = Math.max(..._joukkueet.keys()) + 1;

        _data.joukkueet.push(joukkue);

        _joukkueet.set(joukkue.id, joukkue);

        console.log(_data.joukkueet);

        return deepCopy(joukkue);
    }

    /**
     * Muokkaa aiemmin luodun joukkueen tietoja. Hakee viitteen muokattavaan
     * joukkueeseen hakemistosta, muokkaa tietoja suoraan data-objektiin.
     * @param {object} joukkue
     * @returns {object}
     */
    function muokkaaJoukkue(joukkue) {
        let _joukkue = _joukkueet.get(joukkue.id);

        _joukkue.nimi = joukkue.nimi;

        _joukkue.jasenet = joukkue.jasenet;

        _joukkue.leimaustapa = joukkue.leimaustapa;

        _joukkue.rastit = joukkue.rastit;

        console.log(_data.joukkueet);

        return deepCopy(joukkue);
    }

    /**
     * Palautetaan julkisesti kutsuttavissa olevat metodit ryhmiteltynä 
     * aihealueittain. */
    return {
        joukkue: {
            haeKaikki: haeJoukkueet,
            haeNimella: haeJoukkueNimella,
            haeIdlla: haeJoukkueIdlla,
            haeLeimaukset: haeLeimatutRastit,
            lisaa: lisaaJoukkue,
            muokkaa: muokkaaJoukkue
        },
        sarja: {
            haeIdlla: haeSarjaIdlla,
            haeKaikki: haeSarjat
        },
        rasti: {
            haeKaikki: haeRastit,
            haeIdlla: haeRastiIdlla,
            haeKoodilla: haeRastiKoodilla,
            lisaa: lisaaRasti,
            muokkaa: muokkaaRasti
        },
        leimaustapa: {
            haeKaikki: haeLeimaustavat,
            lisaa: lisaaLeimaustapa
        },
        kilpailu: {
            nimi: _data.nimi,
            alkuaika: _data.alkuaika,
            loppuaika: _data.loppuaika
        }
    };

})(data);

/** Moduli interaktiivisen rastikartan toteuttamiseen. */
const RASTIKARTTA = (function () {
    let kartta;
    let rastiMap = new Map();
    let joukkueMap = new Map();
    let joukkueetKartalla = new Map();
    let valittuRasti = null;

    /**
     * Luo kilpailun rastien näyttämiseen tarkoitetun Leaflet JS-kartan. Karttapohjana
     * käytetään maanmittauslaitoksen maastokarttaa.
     * @param {number} karttaId Kartan vanhempielementin id
     */
    function luoKartta(karttaId) {
        let rastit = API.rasti.haeKaikki();

        //luodaan kartta ja asetetaan näkymä kattamaan kaikki rastit
        let mymap = new L.map(karttaId, {
            crs: L.TileLayer.MML.get3067Proj()
        }).fitBounds(laskeRajat(rastit));

        L.tileLayer.mml_wmts({ layer: "maastokartta" }).addTo(mymap);

        //tallenetaan viite "lokaaliin globaaliin" muuttujaan
        kartta = mymap;

        //piirretään rasteille rinkulat
        piirraRastiRinkulat(rastit, kartta);

        let container = document.getElementById("map");

        //piirretään kartta uusiksi kun sen säilövän elementin koko muuttuu
        var observer = new MutationObserver(function (mutations) {
            mymap.invalidateSize(false);
        });
        var target = container;
        observer.observe(target, {
            attributes: true
        });

        /*         mymap.on('resize', function () {
                    mymap.invalidateSize(false);
                });
        */

        //muutetaan rastimerkkien fonttikokoa zoomauksen muuttuessa
        mymap.on('zoomend', function () {
            let zoomLevel = mymap.getZoom();
            let tooltip = $('.leaflet-tooltip');

            if (zoomLevel <= 0) {
                tooltip.css('font-size', 0);
            } else {
                tooltip.css('font-size', Math.floor(zoomLevel * 1.5));
            }

        });


        /** Laskee lat ja lon koordinaattien pienimmät ja suurimmat arvot */
        function laskeRajat(rastit) {

            let rastiLat = rastit.map(rasti => parseFloat(rasti.lat));
            let rastiLon = rastit.map(rasti => parseFloat(rasti.lon));

            let minLat = Math.min(...rastiLat);
            let minLon = Math.min(...rastiLon);
            let maxLat = Math.max(...rastiLat);
            let maxLon = Math.max(...rastiLon);

            return [
                [minLat, minLon],
                [maxLat, maxLon]
            ];
        }

    }

    /** Alustaa ja luo raahauskentät */
    function luoKentat() {
        luoJoukkueMap();

        luoRastiMap();

        listaaJoukkueet();

        luoJoukkueenHandlerit();

        listaaRastit();

        luoRastienHandlerit();

        luoDroppiAlue();
    }

    /** Tallentaa kilpailun joukkueiden tiedot hakemistoon tiedonkäsittelyä helpottamaan */
    function luoJoukkueMap() {
        let joukkueet = API.joukkue.haeKaikki();

        for (let joukkue of joukkueet) {
            joukkueMap.set(joukkue.id, {
                id: joukkue.id,
                nimi: joukkue.nimi,
                leimaukset: API.joukkue.haeLeimaukset(joukkue.id),
            });
        }
    }

    /** Tallentaa kilpailun rastien tiedot hakemistoon tiedonkäsittelyä helpottamaan */
    function luoRastiMap() {
        let rastit = API.rasti.haeKaikki();

        for (let rasti of rastit) {
            rastiMap.set(rasti.id, rasti);
        }
    }

    /**
    * Laskee reitillä kuljetun matkan. Argumenttina annetaan leimattujen rastien tiedot sisältävä
    * taulukko järjestettynä leimausaikojen mukaisesti.
    */
    function _laskeMatka(leimaukset) {
        let matka = 0;

        //lasketaan vain jos leimattuja rasteja
        if (leimaukset === undefined || leimaukset.length === 0) {
            return 0;
        }

        //lasketaan kuljettu matka rasti kerrallaan
        for (let i = 0; i < leimaukset.length - 1; i++) {
            let nykyinen = API.rasti.haeIdlla(leimaukset[i].id);

            //etsitään seuraava rasti, johon voidaan laskea etäisyys
            let j = i + 1;
            let seuraava = API.rasti.haeIdlla(leimaukset[j].id);

            while (j < leimaukset.length - 1 && (seuraava.lat === undefined || seuraava.lon === undefined)) {
                j++;
                seuraava = leimaukset[j];
            }

            //j pysähtyy viimeistään taulukon viimeiseen alkioon, jos tämäkään ei kelpaa, ei laskettavaa ole
            if (seuraava.lat === undefined || seuraava.lon === undefined) {
                break;
            }

            //lisätään kuljettuun matkaan matka nykyiseltä rastilta seuraavalle
            matka += getDistanceFromLatLonInKm(nykyinen.lat, nykyinen.lon, seuraava.lat, seuraava.lon);
        }

        function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
            var R = 6371; // Radius of the earth in km
            var dLat = deg2rad(lat2 - lat1);  // deg2rad below
            var dLon = deg2rad(lon2 - lon1);
            var a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
                ;
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c; // Distance in km
            return d;
        }

        function deg2rad(deg) {
            return deg * (Math.PI / 180);
        }

        // palautetaan matka pyöristettynä lähimpään kokonaislukuun
        return matka;
    }

    /** Päivitetään joukkueen kulkema matka sekä reitti kun rastien sijaintia tai leimausten järjestystä on muutettu. */
    function paivitaLeimaukset() {
        for (let joukkueId of joukkueMap.keys()) {
            paivitaSummary(joukkueId);
        }

        for (let joukkueId of joukkueetKartalla.keys()) {
            piirraReitti(joukkueId);
        }
    }

    /** Päivitetään joukkueen kulkema matka näkyville. */
    function paivitaSummary(joukkueId) {
        let summary = document.getElementById(`summary_joukkue_${joukkueId}`);
        let joukkue = joukkueMap.get(joukkueId);

        summary.textContent = `${joukkue.nimi} (${_laskeMatka(joukkue.leimaukset).toFixed(1)} km)`;
    }

    function _rainbow(numOfSteps, step) {
        // This function generates vibrant, "evenly spaced" colours (i.e. no clustering).
        // This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
        // Adam Cole, 2011-Sept-14
        // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
        let r, g, b;
        let h = step / numOfSteps;
        let i = ~~(h * 6);
        let f = h * 6 - i;
        let q = 1 - f;
        switch (i % 6) {
            case 0: r = 1; g = f; b = 0; break;
            case 1: r = q; g = 1; b = 0; break;
            case 2: r = 0; g = 1; b = f; break;
            case 3: r = 0; g = q; b = 1; break;
            case 4: r = f; g = 0; b = 1; break;
            case 5: r = 1; g = 0; b = q; break;
        }
        let c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
        return (c);
    }

    /**
     * Luo kilpailun joukkueista listan, jonka elementtejä voi raahata määrätylle
     * droppialueelle. Droppialueelle raahatun joukkueen kulkema reitti piirretään
     * kartalle. */
    function listaaJoukkueet() {
        let joukkueet = Array.from(joukkueMap.values());

        let joukkuealue = document.getElementById("joukkueet");

        let maara = joukkueet.length;

        for (let i in joukkueet) {
            let joukkue = joukkueet[i];
            let el = document.createElement("div");
            //tallennetaan vanhempielementtiin oleellisimmat tiedot käsiteltävästä joukkueesta
            el.id = `div_joukkue_${joukkue.id}`;
            el.dataType = "joukkue";
            el.joukkueId = joukkue.id;
            el.style.background = _rainbow(maara, i);

            let details = document.createElement("details");
            el.appendChild(details);

            //lasketaan joukkueen kulkema matka näkyviin nimen viereen
            let summary = document.createElement("summary");
            summary.textContent = `${joukkue.nimi} (${_laskeMatka(joukkue.leimaukset).toFixed(1)} km)`;
            summary.id = `summary_joukkue_${joukkue.id}`;
            summary.parentDiv = el;
            //tehdään yhteenvetokentästä raahattava
            summary.setAttribute("draggable", "true");
            summary.addEventListener("dragstart", joukkueenRaahaus);
            details.appendChild(summary);

            //lisätään joukkueen rastileimaukset listalle, joka reagoi raahaustapahtumiin
            let ul = document.createElement("ul");
            //tallennetaan viite vanhempielementtiin
            ul.parentDiv = el;
            ul.addEventListener("dragstart", leimauksenRaahausStart);
            ul.addEventListener("dragover", function (e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
            });
            ul.addEventListener("drop", leimauksenDroppaus);
            details.appendChild(ul);

            //lisätään yksittäiset listaelementit
            for (let leimaus of joukkue.leimaukset) {
                let li = document.createElement("li");
                li.textContent = leimaus.koodi;
                //tallennetaan viite vanhempielementtiin
                li.parentDiv = el;
                li.id = `joukkue_${el.joukkueId}_${leimaus.koodi}`;
                li.setAttribute("draggable", "true");
                ul.appendChild(li);
            }

            joukkuealue.appendChild(el);
        }

        /** Tapahtumankäsittelijä, jota kutsutaan kun joukkueen raahaustapahtuma alkaa. */
        function joukkueenRaahaus(e) {
            //div > details > summary
            let parent = this.parentNode.parentNode;
            e.dataTransfer.setData("text/plain", parent.id);
            e.dataTransfer.setData("data/type", "joukkue");
            e.dataTransfer.setData("data/id", parent.joukkueId);
        }


        /** Tapahtumankäsittelijä, jota kutsutaan kun leimauksen raahaustapahtuma alkaa. */
        function leimauksenRaahausStart(e) {

            //lasketaan alkuperäinen indeksi
            let index = 0;
            let node = e.target;
            while ((node = node.previousElementSibling)) {
                index++;
            }

            e.dataTransfer.setData("text/plain", e.target.id);
            e.dataTransfer.setData("data/type", "leimaus");
            e.dataTransfer.setData("data/id", e.target.parentDiv.joukkueId);
            e.dataTransfer.setData("data/index", index);
        }

        /** Tapahtumankäsittelijä, jota kutsutaan kun listan päälle pudotetaan jotain. */
        function leimauksenDroppaus(e) {
            e.preventDefault();
            let type = e.dataTransfer.getData("data/type");

            //kelpuutetaan vain leimaukset
            if (type !== "leimaus") {
                return false;
            }

            let el = document.getElementById(e.dataTransfer.getData("text/plain"));
            let joukkueId = parseInt(e.dataTransfer.getData("data/id"));

            //kelpuutetaan vain saman joukkueen leimaukset
            if (e.target.parentDiv.joukkueId !== joukkueId) {
                return false;
            }

            //lisätään listan viimeiseksi tai väliin riippuen pudotuskohdasta
            if (e.target.nodeName === "UL") {
                this.appendChild(el);
            } else {
                this.insertBefore(el, e.target);
            }
            //lasketaan uusi indeksi
            let index = 0;
            let node = el;
            while ((node = node.previousElementSibling)) {
                index++;
            }

            let oldIndex = e.dataTransfer.getData("data/index");

            //vaihdetaan leimauksen paikkaa tietorakenteessa
            vaihdaLeimauksenPaikkaa(joukkueId, oldIndex, index);

            //päivitetään matka ja reitti
            paivitaSummary(joukkueId);
            if (joukkueetKartalla.has(joukkueId)) {
                piirraReitti(joukkueId);
            }
        }
    }

    /** Vaihtaa yksittäisen leimauksen sijaintia tietorakenteessa. EI persistoi dataa, vaan muutos
     * tallentuu tässä toteutuksessa ainoastaan paikallisesti.*/
    function vaihdaLeimauksenPaikkaa(joukkueId, oldIndex, newIndex) {
        let joukkue = joukkueMap.get(joukkueId);

        let leimaus = joukkue.leimaukset.splice(oldIndex, 1);

        joukkue.leimaukset.splice(newIndex, 0, leimaus[0]);
    }

    /** Luo joukkuealueen tapahtumankäsittelijät */
    function luoJoukkueenHandlerit() {
        let joukkuealue = document.getElementById("joukkueet");

        joukkuealue.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        });

        //tapahtumankäsittelijä, jota kutsutaan kun joukkuealueelle pudotetaan jotain
        joukkuealue.addEventListener("drop", (e) => {
            e.preventDefault();
            let type = e.dataTransfer.getData("data/type");

            //kelpuutetaan vain joukkueet
            if (type !== "joukkue") {
                return false;
            }

            //haetaan vanhempielementti
            const elId = e.dataTransfer.getData("text/plain");
            const el = document.getElementById(elId);

            console.log(e.target);

            //haetaan raahauksen kohteen vanhempi
            let parentdiv = e.target;
            while (parentdiv.nodeName !== "DIV") {
                parentdiv = parentdiv.parentNode;
            }

            //jos ollaan lapsidiv:n kohdalla, lisätään tätä ennen
            if (parentdiv.dataType === "joukkue") {
                joukkuealue.insertBefore(el, parentdiv);
            } else {
                //jos ollaan vanhempidiv:n kohdalla, lisätään viimeiseksi
                joukkuealue.appendChild(el);
            }

            let joukkueId = el.joukkueId;

            //poistetaan kartalle mahdollisesti piirretty reitti
            if (joukkueetKartalla.has(joukkueId)) {
                joukkueetKartalla.get(joukkueId).remove();
            }
            joukkueetKartalla.delete(joukkueId);

        });
    }

    /** Lisätään kilpailun rastit listaukseen */
    function listaaRastit() {
        let rastit = Array.from(rastiMap.values());

        rastit.sort((a, b) => b.koodi.localeCompare(a.koodi));

        let rastilista = document.getElementById("rastit");

        let maara = rastit.length;
        for (let i in rastit) {
            let rasti = rastit[i];
            let div = document.createElement("div");
            div.textContent = rasti.koodi;
            div.id = `div_rasti_${rasti.id}`;
            div.dataType = "rasti";
            div.rastiId = rasti.id;
            div.style.background = _rainbow(maara, i);
            div.setAttribute("draggable", "true");

            /*Tapahtumankäsittelijä lisätään nyt hölmösti jokaiselle
            elementille erikseen. Tyydytään tällä kertaa siihen että
            ratkaisu toimii tässä kontekstissa. */
            div.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", e.target.id);
                e.dataTransfer.setData("data/type", "rasti");
                e.dataTransfer.setData("data/id", e.target.rastiId);
            });
            rastilista.appendChild(div);
        }


    }

    /** Lisää rastialueelle tapahtumankäsittelijät */
    function luoRastienHandlerit() {

        let rastialue = document.getElementById("rastit");

        rastialue.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        });

        rastialue.addEventListener("drop", (e) => {
            e.preventDefault();
            let type = e.dataTransfer.getData("data/type");

            //kelpuutetaan vain rastit
            if (type !== "rasti") {
                return false;
            }

            const elId = e.dataTransfer.getData("text/plain");
            const el = document.getElementById(elId);

            //jos on raahattu toisen rastin päälle, sijoitetaan ennen sitä
            if (e.target.dataType === "rasti") {
                rastialue.insertBefore(el, e.target);
            } else {
                //muuten viimeiseksi
                rastialue.appendChild(el);
            }
        });
    }

    /** Luo alueen, jonne raahattuja joukkueita ja rasteja voi pudottaa. Alueelle raahattujen
     * joukkueiden kulkema reitti piirretään kartalle-
    */
    function luoDroppiAlue() {
        let droppialue = document.getElementById("kartalla");

        droppialue.addEventListener("dragenter", (e) => {
            e.preventDefault();
        });

        droppialue.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        });

        droppialue.addEventListener("drop", function (e) {
            e.preventDefault();
            let type = e.dataTransfer.getData("data/type");

            if (type !== "joukkue" && type !== "rasti") {
                return false;
            }

            //sijoitetaan raahattu elementti alueelle
            const data = e.dataTransfer.getData("text/plain");
            const el = document.getElementById(data);
            droppialue.appendChild(el);

            //lasketaan sijainti elementin sisällä
            var rect = this.getBoundingClientRect();
            var posX = e.clientX - rect.left;
            var posY = e.clientY - rect.top;

            //asetetaan elementti oikealle paikalle
            el.style.left = posX + "px";
            el.style.top = posY + "px";

            //jos kyseessä oli joukkuediv, piirretään joukkueen reitti kartalle
            if (el.dataType === "joukkue") {
                piirraReitti(el.joukkueId);
            }

        });
    }

    /** Piirtää kartalle rastien sijaintien merkiksi punaisen renkaan. */
    function piirraRastiRinkulat(rastit, kartta) {


        for (let rasti of rastit) {
            let lat = parseFloat(rasti.lat);
            let lon = parseFloat(rasti.lon);

            let circle = L.circle(
                [lat, lon], {
                color: 'darksalmon',
                fillColor: '#f03',
                fillOpacity: 0.2,
                radius: 150,
                draggable: true
            }
            ).addTo(kartta);

            circle.rasti = rasti;

            //lisätään rastikoodi näkyviin renkaan sisälle
            circle.bindTooltip(rasti.koodi, {
                permanent: true,
                direction: 'center',
                opacity: 0.8
            });

            //aktivoidaan rengas yhdellä klikkauksella, jonka jälkeen rengasta voi liikuttaa
            circle.addEventListener("click", function (event) {
                //muutetaan väri valinnan merkiksi
                this.setStyle({ color: 'red' });

                //poistetaan mahdollinen edellinen valinta ja merkitään valituksi
                if (valittuRasti !== null && valittuRasti !== this) {
                    valittuRasti.setStyle({ color: 'darksalmon' });
                }
                valittuRasti = this;

                /*lisätään valitulle rastille tapahtumankäsittelijä, joka säätää hiiren painiketta
                painettaessa kartan kuuntelemaan hiiren liikettä ja liikuttamaan rastia niin kauan kuin
                hiiri on painettuna alas */
                this.addEventListener("mousedown", function (event) {
                    kartta.addEventListener("mousemove", function (e) {
                        circle.setLatLng(e.latlng);
                    });
                    kartta.dragging.disable();
                });
            });


        }

        /* lisätään kartalle tapahtumankäsittelijä, joka reagoi hiiren painikkeen vapauttamiseen
        ja mahdollisen raahauksen päätyttyä siirtää rastin koordinaateja asianmukaisesti */
        kartta.addEventListener("mouseup", function (event) {
            //lakataan kuuntelemasta hiiren liikettä
            kartta.removeEventListener("mousemove");
            kartta.dragging.enable();

            if (valittuRasti !== null) {
                //tarkistetaan onko valittua rengasta liikutettu
                let paikka = valittuRasti.getLatLng();
                let rasti = valittuRasti.rasti;

                let lat = String(paikka.lat);
                let lon = String(paikka.lng);

                if (rasti.lat !== lat || rasti.lon !== lon) {
                    rasti.lat = String(paikka.lat);
                    rasti.lon = String(paikka.lng);

                    //tallennetaan muokkaukset ja päivitetään joukkueiden reitit + matka
                    API.rasti.muokkaa(valittuRasti.rasti);
                    paivitaLeimaukset();
                }

                //poistetaan valinta rastilta
                valittuRasti.removeEventListener("mousedown");
                valittuRasti.setStyle({ color: 'darksalmon' });
                valittuRasti = null;

            }
        });


        /*  circle.addEventListener("click", function (event) {
            this.setStyle({ color: 'red' });
            
            console.log(this);
            
            let marker = luoMarker(this);
            
            if (valittuRasti !== undefined && valittuRasti !== this) {
            valittuRasti.setStyle({ color: 'indianred' });
            valittuRasti.marker.remove();
            }
            valittuRasti = this;
            valittuRasti.marker = marker;
            }); */
    }

    /*     function luoMarker(circle) {
            let { lat, lng } = circle.getLatLng();
    
            let marker = L.marker([lat, lng], { draggable: 'true' }).addTo(kartta);
    
            marker.addEventListener("dragend", function (e) {
                let paikka = this.getLatLng();
                console.log(paikka);
                circle.setLatLng(paikka);
    
                let rasti = circle.rasti;
    
                rasti.lat = paikka.lat;
                rasti.lon = paikka.lng;
    
                API.rasti.muokkaa(circle.rasti);
    
                paivitaRastit();
    
               valittuRasti.setStyle({ color: 'indianred' });
               valittuRasti.marker.remove();
           });
           return marker;
    } */


    /** Piirtää joukkueen kulkeman reitin kartalle käyttäen polylineja. */
    function piirraReitti(joukkueId) {
        //poistetaan vanha reitti
        if (joukkueetKartalla.has(joukkueId)) {
            joukkueetKartalla.get(joukkueId).remove();
        }

        //selvitetään joukkueelle määritetty väri
        //TODO: tämän voisi lisätä joukkueen attribuutiksi
        let div = document.getElementById(`div_joukkue_${joukkueId}`);
        let color = div.style.backgroundColor;

        let joukkue = joukkueMap.get(joukkueId);

        //lisätään polylineen piirrettävät solmut taulukkoon
        let solmut = new Array(0);
        for (let leimaus of joukkue.leimaukset) {
            let rasti = API.rasti.haeIdlla(leimaus.id);
            solmut.push([parseFloat(rasti.lat), parseFloat(rasti.lon)]);
        }
        //piirretään reitti kartalle
        let reitti = L.polyline(solmut, { color: color }).addTo(kartta);

        reitti.bringToFront();

        //lisätään joukkue tietorakenteeseen, jonka avulla tiedetään mitä joukkueita tulee
        //päivittää jos rasteja liikutellaan 
        joukkueetKartalla.set(joukkueId, reitti);

        return reitti;
    }

    return {
        luoKartta: luoKartta,
        luoKentat: luoKentat
    };
})();


$(document).ready(function () {
    RASTIKARTTA.luoKartta("map");
    RASTIKARTTA.luoKentat();
});