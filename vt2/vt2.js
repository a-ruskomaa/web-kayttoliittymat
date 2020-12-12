"use strict";
//@ts-check 
// data-muuttuja on sama kuin viikkotehtävässä 1.
//

//console.log(data);

/**
 * Luo "API:n" huolehtimaan datan käsittelystä. API:n sisälle on kapseloituna
 * datan käsittelyyn liittyvä sovelluslogiikka. API tarjoaa julkiset metodit
 * valmiiksi käsitellyn datan hakemiseen, lisäämiseen ja muokkaamiseen.
 * 
 * Alaviivalla alkavat metodit ovat API:n sisäiseen käyttöön. Julkiset metodit
 * on nimetty normaalisti.
 * 
 * Halusin eriyttää käyttöliittymäkoodin sovelluslogiikasta, joten tässä tehdään
 * tietoisesti enemmän työtä kuin olisi varsinaisesti tarpeen.
 */
const API = (function (_data) {
    var _rastit = _teeRastiHakemisto();
    var _joukkueet = _teeJoukkueHakemisto();
    var _sarjat = _teeSarjaHakemisto();


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
    function _haeLeimatutRastit(joukkue) {

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
                aika: rastit[i].aika,
                lat: rastiObj.lat,
                lon: rastiObj.lon
            });
        }

        return rastiObjektit;
    }

    /** 
     * Laskee joukkueen saamat pisteet leimattujen rastien perusteella.
     */
    function _laskePisteet(rastit) {
        //lasketaan pisteet vain, jos joukkueella on leimattuja rasteja
        if (rastit === undefined || rastit.length === 0) {
            return 0;
        }

        //lasketaan rastien pisteiden yhteissumma
        let summa = 0;


        rastit.forEach(rasti => {
            summa += _annaRastinPisteet(rasti);
        });

        return summa;

    }

    /**
     * Antaa rastin pisteet rastikoodin ensimmäisen merkin perusteella.
     * Palauttaa 0 jos ensimmäinen merkki ei ole numero.
     */
    function _annaRastinPisteet(rasti) {
        let pisteet = parseInt(rasti.koodi[0]);

        if (isNaN(pisteet)) {
            return 0;
        }

        return pisteet;
    }

    /**
     * Laskee suoritukseen käytetyn ajan. Leimatut rastit on annettava
     * ajan mukaan järjestettynä siten, että ensimmäinen alkio vastaa
     * lähtörastia ja viimeinen maalirastia.
     */
    function _laskeAika(rastit) {
        //lasketaan aika vain, jos joukkueella on leimattuja rasteja
        if (rastit === undefined || rastit.length === 0) {
            return "00:00:00";
        }

        //haetaan leimauksista lähtö- ja maaliintuloaika
        let lahtoaika = new Date(rastit[0].aika);
        let maaliaika = new Date(rastit[rastit.length - 1].aika);

        //muunnetaan millisekunnit merkkijonoksi
        function millisekunnitAjaksi(ms) {
            var sekunnit = Math.floor((ms / 1000) % 60),
                minuutit = Math.floor((ms / (1000 * 60)) % 60),
                tunnit = Math.floor((ms / (1000 * 60 * 60)) % 24);

            return `${(tunnit < 10) ? "0" + tunnit : tunnit}:` +
                `${(minuutit < 10) ? "0" + minuutit : minuutit}:` +
                `${(sekunnit < 10) ? "0" + sekunnit : sekunnit}`;

            /*             function Aika(tunnit, minuutit, sekunnit) {
                            this.tunnit = tunnit;
                            this.minuutit = minuutit;
                            this.sekunnit = sekunnit;
                        }
            
                        Aika.prototype.toString = function () {
                            return `${(this.tunnit < 10) ? "0" + this.tunnit : this.tunnit}:` +
                                `${(this.minuutit < 10) ? "0" + this.minuutit : this.minuutit}:` +
                                `${(this.sekunnit < 10) ? "0" + this.sekunnit : this.sekunnit}`;
                        };
            
                        Aika.prototype.compareTo = function (other) {
                            if (this.tunnit - other.tunnit !== 0) {
                                return this.tunnit - other.tunnit;
                            } else if (this.minuutit - other.minuutit !== 0) {
                                return this.minuutit - other.minuutit;
                            } else {
                                return this.sekunnit - other.sekunnit;
                            }
                        };
            
                        return new Aika(tunnit, minuutit, sekunnit); */
        }

        let kokonaisaika = maaliaika.getTime() - lahtoaika.getTime();

        if (isNaN(kokonaisaika)) {
            return "00:00:00";
        }

        return millisekunnitAjaksi(kokonaisaika);
    }

    /**
     * Laskee reitillä kuljetun matkan. Parametrina annettava leimattujen rastien tiedot sisältävä
     * taulukko järjestettynä leimausaikojen mukaisesti.
     */
    function _laskeMatka(rastit) {
        let matka = 0;

        //lasketaan vain jos leimattuja rasteja
        if (rastit === undefined || rastit.length === 0) {
            return 0;
        }

        //lasketaan kuljettu matka rasti kerrallaan
        for (let i = 0; i < rastit.length - 1; i++) {
            let nykyinen = rastit[i];

            //puutteellisia tietoja ei huomioida
            if (nykyinen.lat === undefined || nykyinen.lon === undefined) {
                continue;
            }

            //etsitään seuraava rasti, johon voidaan laskea etäisyys
            let j = i + 1;
            let seuraava = rastit[j];

            while (j < rastit.length - 1 && (seuraava.lat === undefined || seuraava.lon === undefined)) {
                j++;
                seuraava = rastit[j];
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
        return Math.round(matka);
    }

    /**
     * Hakee datasta joukkueiden suoritusten kaikki tiedot, palauttaa joukkueiden tiedot taulukossa
     */
    function haeJoukkueidenTiedot() {
        //luodaan uusi taulukko joukkueiden tallentamista varten
        let joukkueet = new Map();

        //luodaan joukkueista ja pisteistä objekteja, lisätään taulukkoon
        _data.joukkueet.forEach(joukkue => {
            if (joukkue.hasOwnProperty('nimi')) {
                let joukkueenRastit = _haeLeimatutRastit(joukkue);

                //lisätään palautettavaan taulukkoon joukkueen suoritus
                joukkueet.set(joukkue.id, {
                    id: joukkue.id,
                    nimi: joukkue.nimi,
                    jasenet: joukkue.jasenet,
                    sarja: haeSarjaIdlla(joukkue.sarja).nimi,
                    pisteet: _laskePisteet(joukkueenRastit),
                    aika: _laskeAika(joukkueenRastit),
                    matka: _laskeMatka(joukkueenRastit)
                });
            }
        });

        return joukkueet;
    }

    /** Etsii joukkueen annetun nimen perusteella. Palauttaa null jos ei löydy. */
    function haeJoukkueNimella(nimi) {
        for (let joukkue of _data.joukkueet) {
            if (joukkue.nimi === nimi) {
                return joukkue;
            }
        }

        return null;
    }

    /** Etsii joukkueen annetun id:n perusteella. Palauttaa null jos ei löydy. */
    function haeJoukkueIdlla(joukkueId) {
        if (typeof joukkueId !== 'number') {
            joukkueId = parseInt(joukkueId);
        }
        if (isNaN(joukkueId)) {
            return null;
        }
        return _joukkueet.get(joukkueId);
    }

    /** Etsii rastin annetun koodin perusteella. Palauttaa null jos ei löydy. */
    function haeRastiKoodilla(rastiKoodi) {
        for (let rasti of _rastit.values()) {
            if (rasti.koodi === rastiKoodi) {
                return rasti;
            }
        }

        return null;
    }

    /**
     * Palauttaa kaikki dataan tallennetut rastit sisältäen rastin id:n, koodin
     * sekä koordinaatit.
     */
    function haeKaikkiRastit() {
        return _data.rastit;
    }

    /** Etsii rastin annetun id:n perusteella. Palauttaa null jos id virheellinen
     * ja undefined jos ei löydy.*/
    function haeRastiIdlla(rastiId) {
        if (typeof rastiId !== 'number') {
            rastiId = parseInt(rastiId);
        }
        if (isNaN(rastiId)) {
            return null;
        }
        return _rastit.get(rastiId);
    }


    /** Etsii sarjan annetun id:n perusteella. Palauttaa null jos ei löydy.*/
    function haeSarjaIdlla(sarjaId) {
        if (typeof sarjaId !== 'number') {
            sarjaId = parseInt(sarjaId);
        }
        if (isNaN(sarjaId)) {
            return null;
        }
        return _sarjat.get(sarjaId);
    }

    /**
     * Hakee annetun id:n perusteella joukkueen kaikki leimaukset. Palauttaa null 
     * jos joukkuetta ei löydy.
     */
    function haeLeimaukset(joukkueId) {
        if (typeof joukkueId !== 'number') {
            joukkueId = parseInt(joukkueId);
        }
        if (isNaN(joukkueId)) {
            return null;
        }

        let joukkue = _joukkueet.get(joukkueId);

        if (joukkue === null) {
            return null;
        }

        return _haeLeimatutRastit(joukkue);
    }

    /** Palauttaa kaikki dataan tallennetut leimaustavat */
    function haeLeimaustavat() {
        return _data.leimaustavat;
    }

    /**
     * Lisää dataan uuden rastin tiedot. Parametrina annettava objekti,
     * joka sisältää rastin tiedot dataa vastaavassa muodossa. Antaa rastille
     * id:n, joka on yhdellä suurempi kuin edellinen suurin id.
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
     * Lisää uuden joukkueen dataan. Parametrina annettava joukkueen tiedot
     * sisältävä objekti.
     */
    function lisaaJoukkue(joukkue) {
        //jokainen joukkue lisätään 8h sarjaan
        const sarja = "8h";

        //etsitään sarjan id nimen perusteella
        for (let s of _data.sarjat) {
            if (s.nimi === sarja) {
                joukkue.sarja = s.id;
            }
        }

        // annetaan joukkueelle yksilöivä id
        joukkue.id = Math.max(..._joukkueet.keys()) + 1;

        joukkue.rastit = new Array(0);

        _data.joukkueet.push(joukkue);

        _joukkueet.set(joukkue.id, joukkue);

        console.log(_data.joukkueet);

        return joukkue;
    }

    /**
     * Muokkaa aiemmin luodun joukkueen tietoja. Hakee viitteen muokattavaan
     * joukkueeseen hakemistosta, muokkaa tietoja suoraan data-objektiin.
     */
    function muokkaaJoukkue(joukkue) {
        let _joukkue = _joukkueet.get(joukkue.id);

        _joukkue.nimi = joukkue.nimi;

        _joukkue.jasenet = joukkue.jasenet;

        _joukkue.leimaustapa = joukkue.leimaustapa;

        _joukkue.rastit = joukkue.rastit;

        console.log(_data.joukkueet);

        return joukkue;
    }

    /**
     * Palautetaan julkisesti kutsuttavissa olevat metodit ryhmiteltynä 
     * aihealueittain. */
    return {
        joukkue: {
            haeKaikkiTiedot: haeJoukkueidenTiedot,
            haeNimella: haeJoukkueNimella,
            haeIdlla: haeJoukkueIdlla,
            haeLeimaukset: haeLeimaukset,
            lisaa: lisaaJoukkue,
            muokkaa: muokkaaJoukkue
        },
        sarja: {
            haeIdlla: haeSarjaIdlla
        },
        rasti: {
            haeKaikki: haeKaikkiRastit,
            haeIdlla: haeRastiIdlla,
            haeKoodilla: haeRastiKoodilla,
            lisaa: lisaaRasti,
        },
        leimaustavat: {
            haeKaikki: haeLeimaustavat
        }
    };

})(data);

/**
 * Objekti, joka sisältää metodit tulostaulukon luomiseen, päivittämiseen
 * sekä järjestämiseen. Ylläpitää tilaa viimeisimmästä API:n kautta haetusta
 * datasta. On riippuvainen myös JOUKKUELOMAKE-objektista, johon viitataan
 * _luoSarake-metodin sisällä luotavassa tapahtumankäsittelijässä.
 */
const TULOSPALVELU = (function () {

    /* Taulukkoon lisättävien sarakkeiden otsikot. Nämä vastaavat nimiltään
    taulukkoon lisättävien joukkue-objektien attribuutteja. */
    const OTSIKOT = ["sarja", "joukkue", "pisteet", "aika", "matka"];

    var _jarjestaja = _luoJarjestaja("sarja");
    var _tiedot = API.joukkue.haeKaikkiTiedot();
    var _taulu;

    /**
     * Luo rungon taulukolle, jossa näytetään joukkueiden tulostiedot.
     * Otsikkorivin tekstit haetaan vakiotaulukosta OTSIKOT. Tallentaa
     * muuttujaan _taulu viitteen luotuun taulukkoon.
     */
    function luoTaulukko() {
        _taulu = document.createElement("table");
        var caption = document.createElement("caption");
        caption.textContent = "Tulokset";
        _taulu.appendChild(caption);

        var otsikkorivi = document.createElement("tr");

        for (let otsikko of OTSIKOT) {
            otsikkorivi.appendChild(_luoOtsikko(otsikko));
        }

        _taulu.appendChild(otsikkorivi);

        return _taulu;
    }

    /**
     * Luo taulukon otsikkoelementin. Otsikkoelementille
     * lisätään tapahtumankäsittelijä, joka valitsee käytössä olevan
     * järjestystavan sekä järjestää taulukon haluttuun järjestykseen.
     */
    function _luoOtsikko(teksti) {
        let otsikko = document.createElement("th");
        let wrapper = document.createElement("span");
        let linkki = document.createElement("a");

        /* lisätään otsikkoteksti a-elementin sisälle, jotta käyttäjä
        saa visuaalisen vihjeen siitä että otsikkotekstiä voi klikata.
        Poistetaan kuitenkin käytöstä hyperlinkin normaali toiminnallisuus.
        Linkki on käärittävä span-elementin sisälle, jotta kursorin saa muuttumaan
        edelleen "sormiosoittimeksi" */

        linkki.href = "";
        linkki.style.pointerEvents = "none";

        linkki.textContent = _kapitaaliksi(teksti);

        wrapper.style.cursor = "pointer";

        // Lisätään tapahtumankäsittelijä.
        wrapper.addEventListener("click", (e) => {
            _jarjestaja = _luoJarjestaja(teksti);
            jarjestaTaulukko(_jarjestaja);
        });
        wrapper.appendChild(linkki);

        otsikko.appendChild(wrapper);
        otsikko.id = "otsikko_" + teksti;

        return otsikko;
    }

    /** Muuntaa annetun tekstin alkukirjaimen isoksi */
    function _kapitaaliksi(teksti) {
        return teksti.charAt(0).toUpperCase() + teksti.slice(1);
    }

    /** 
     * Päivittää tulospalvelun talukon. Hakee aluksi tuoreimman
     * datan API:n kautta, tyhjentää vanhat tiedot ja täyttää taulukon uusilla
     * tiedoilla. Lopuksi taulukko järjestetään valitulla järjestämistavalla.
     */
    function paivitaTaulukko() {

        _tiedot = API.joukkue.haeKaikkiTiedot();

        _tyhjennaTaulukko();

        //luodaan uusi rivi jokaista joukkuetta varten
        for (let joukkue of _tiedot.values()) {
            let rivi = document.createElement("tr");

            //jokaiselle riville annetaan sen sisältämän joukkueen id
            rivi.id = joukkue.id;

            //luodaan jokaista otsikkoa vastaava sarake
            for (let otsikko of OTSIKOT) {
                rivi.appendChild(_luoSarake(otsikko, joukkue));
            }

            _taulu.appendChild(rivi);
        }

        //järjestetään
        jarjestaTaulukko(_jarjestaja);
    }

    /** Poistaa taulukon sisällön. Jättää otsakkeen ja otsikkorivin paikoilleen. */
    function _tyhjennaTaulukko() {
        let lapsukaiset = _taulu.children;
        let lapsia = _taulu.children.length;

        for (let i = lapsia - 1; i >= 2; i--) {
            _taulu.removeChild(lapsukaiset[i]);
        }
    }

    /**
     * Luo sarakkeen, jonka sisältö haetaan argumenttina annetun joukkueen
     * tiedoista. Annetun otsikon on vastattava nimeltään joukkueen sisältämää
     * attribuuttia, paitsi otsikon ollessa "joukkue" haetaan tieto joukkueen
     * attribuuteista 'nimi' ja 'jasenet'.
     * 
     * 'joukkue'-sarakkeelle luodaan myös tapahtumankäsittelijä, joka täyttää
     * joukkueen muokkaamiseen käytettävän lomakkeen valitun joukkueen tiedoilla.
     */
    function _luoSarake(otsikko, joukkue) {
        let sarake = document.createElement("td");

        //lisätään sarakkeeseen joukkueen nimi ja jäsenlistaus
        if (otsikko === "joukkue") {
            let linkki = document.createElement("a");
            linkki.href = "#joukkue_lomake";
            linkki.textContent = joukkue["nimi"];

            //luodaan tapahtumankäsittelijä
            linkki.addEventListener("click", (e) => {
                JOUKKUELOMAKE.tayta(joukkue.id);
            });

            sarake.appendChild(linkki);
            sarake.appendChild(document.createElement("br"));
            sarake.appendChild(document.createTextNode(joukkue["jasenet"].join(", ")));
        } else {
            //muiden sarakkeiden tiedot haetaan joukkueen atrribuuteista
            sarake.textContent = joukkue[otsikko];
        }

        return sarake;
    }

    /**
     * Järjestää tulostaulun haluttuun järjestykseen. Taulu järjestetään
     * "in situ", eli muuttamalla taulun rivien järjestystä poistamatta
     * tai lisäämättä rivejä.
     */
    function jarjestaTaulukko(jarjestaja) {
        //luodaan tyhjä taulukko uutta järjestystä varten
        let jarjestettavat = new Array(0);

        //haetaan taulun sisältämät lapsisolmut, eli rivit
        let lapsukaiset = _taulu.children;

        //lisätään järjestettävät solmut taulukkoon, jätetään otsake sekä
        //otsikkorivi huomioimatta
        for (let i = 2; i < lapsukaiset.length; i++) {
            jarjestettavat.push(lapsukaiset[i]);
        }

        /* järjestetään rivit taulukon sisällä, jonka jälkeen lisätään
        rivit uudelleen tulostauluun, jolloin niiden paikka vaihtuu myös
        taulun sisällä */
        if (jarjestettavat.length > 1) {
            jarjestettavat.sort(jarjestaja);

            jarjestettavat.forEach(rivi => _taulu.appendChild(rivi));
        }
    }

    /** 
     * Luo jokaista saraketta vastaavan järjestysfunktion.
     * 
     * Luotu funktio ottaa parametreinaan kaksi riviä, joiden id:n perusteella
     * se etsii rivejä vastaavat joukkueet ja suorittaa järjestämisen joukkueen
     * attribuuttien perusteella.
     */
    function _luoJarjestaja(kentta) {
        switch (kentta) {
            case "sarja":
                return function (a, b) {
                    // haetaan id:tä vastaavat joukkueet
                    a = _tiedot.get(parseInt(a.id));
                    b = _tiedot.get(parseInt(b.id));

                    // verrataan ensin sarjan, sitten pisteiden ja lopulta nimen perusteella
                    if (a.sarja.localeCompare(b.sarja) !== 0) {
                        return a.sarja.localeCompare(b.sarja);
                    } else if (b.pisteet - a.pisteet !== 0) {
                        return b.pisteet - a.pisteet;
                    } else {
                        return a.nimi.localeCompare(b.nimi);
                    }
                };
            case "joukkue":
                return function (a, b) {
                    // haetaan id:tä vastaavat joukkueet
                    a = _tiedot.get(parseInt(a.id));
                    b = _tiedot.get(parseInt(b.id));

                    //verrataan nimen perusteella
                    return a.nimi.localeCompare(b.nimi);
                };
            case "pisteet":
                return function (a, b) {
                    // haetaan id:tä vastaavat joukkueet
                    a = _tiedot.get(parseInt(a.id));
                    b = _tiedot.get(parseInt(b.id));

                    //verrataan ensin pisteiden, sitten nimen perusteella
                    if (b.pisteet - a.pisteet !== 0) {
                        return b.pisteet - a.pisteet;
                    } else {
                        return a.nimi.localeCompare(b.nimi);
                    }
                };
            case "matka":
                return function (a, b) {
                    // haetaan id:tä vastaavat joukkueet
                    a = _tiedot.get(parseInt(a.id));
                    b = _tiedot.get(parseInt(b.id));

                    //verrataan ensin matkan, sitten nimen perusteella
                    if (b.matka - a.matka !== 0) {
                        return b.matka - a.matka;
                    } else {
                        return a.nimi.localeCompare(b.nimi);
                    }
                };
            case "aika":
                return function (a, b) {
                    // haetaan id:tä vastaavat joukkueet
                    a = _tiedot.get(parseInt(a.id));
                    b = _tiedot.get(parseInt(b.id));

                    //verrataan ensin ajan, sitten nimen perusteella
                    if (b.aika.localeCompare(a.aika) !== 0) {
                        return b.aika.localeCompare(a.aika);
                    } else {
                        return a.nimi.localeCompare(b.nimi);
                    }
                };
        }
    }

    /** 
     * Tarjotaan julkisesti metodit taulukon luomista, järjestämistä ja päivittämistä
     * varten. 
     */
    return {
        luoTaulukko: luoTaulukko,
        jarjestaTaulukko: jarjestaTaulukko,
        paivitaTaulukko: paivitaTaulukko,
        tiedot: _tiedot
    };

})();

/**
 * Objekti rastien lisäämiseen käytettävän lomakkeen luomiseksi. Lomake
 * luo API:n avulla uuden rastin, mikäli annetut tiedot ovat muodoltaan
 * oikein. Lomake validoidaan vain lähettämisen yhteydessä.
 * 
 * Tämäpä jäi nyt sitten laiskuuksissa refaktoroimatta.
 */
const RASTILOMAKE = (function () {
    var _lomake;

    /**
     * Luo rastin syöttämiseen käytettävän lomakkeen sekä
     * rekisteröi painikkeelle tapahtumankäsittelijän.
     */
    function luoRastiLomake(lomake) {
        _lomake = lomake;

        // luodaan uusi fieldset, jonka alle kentät ja painike lisätään
        var fieldset1 = document.createElement('fieldset');
        var legend1 = document.createElement('legend');
        legend1.appendChild(document.createTextNode('Rastin tiedot'));
        fieldset1.appendChild(legend1);

        //luodaan kenttä leveyspiirin syöttämiseen
        var p1 = document.createElement('p');
        var label1 = document.createElement('label');
        label1.appendChild(document.createTextNode('Lat '));
        var input1 = document.createElement('input');
        input1.type = 'text';
        input1.name = 'lat';
        input1.id = 'input_rasti_lat';
        label1.appendChild(input1);
        p1.appendChild(label1);
        fieldset1.appendChild(p1);

        //luodaan kenttä pituuspiirin syöttämiseen
        var p2 = document.createElement('p');
        var label2 = document.createElement('label');
        label2.appendChild(document.createTextNode('Lon '));
        var input2 = document.createElement('input');
        input2.type = 'text';
        input2.name = 'lon';
        input2.id = 'input_rasti_lon';
        label2.appendChild(input2);
        p2.appendChild(label2);
        fieldset1.appendChild(p2);

        //luodaan kenttä rastin koodin syöttämiseen
        var p3 = document.createElement('p');
        var label3 = document.createElement('label');
        label3.appendChild(document.createTextNode('Koodi '));
        var input3 = document.createElement('input');
        input3.type = 'text';
        input3.name = 'koodi';
        input3.id = 'input_rasti_koodi';
        label3.appendChild(input3);
        p3.appendChild(label3);
        fieldset1.appendChild(p3);

        //luodaan painike lomakkeen lähettämiseen
        var p4 = document.createElement('p');
        var button1 = document.createElement('button');
        button1.id = 'button_rasti_lisaa';
        button1.appendChild(document.createTextNode('Lisää rasti'));
        p4.appendChild(button1);
        fieldset1.appendChild(p4);

        lomake.appendChild(fieldset1);

        //luodaan tapahtumankäsittelijä, joka lähettää lomakkeen
        //sisällön sen validoivalle metodille
        lomake.addEventListener('submit', (e) => {
            e.preventDefault();
            let form = e.target;
            let formData = new FormData(form);
            _tarkistaRastiLomake(formData);
        });
    }

    /**
     * Tarkistaa lomakkeen sisällön. Jos joku kentistä on tyhjä tai
     * syötetty pituus- tai leveyspiiri ei vastaa muotoa ##.######, ei
     * tietoa lähetetä eteenpäin "palvelimelle".
     */
    function _tarkistaRastiLomake(formData) {
        let pattern = /^\d{2}.\d{6}$/;
        let koodi = formData.get("koodi");
        let lat = formData.get("lat");
        let lon = formData.get("lon");

        if (koodi === "" || !pattern.test(lat) || !pattern.test(lon)) {
            return;
        }

        let rasti = { lon: lon, koodi: koodi, lat: lat };

        //tallennetaan rasti API:n avulla
        API.rasti.lisaa(rasti);

        //tyhjennetään lomake
        _lomake.reset();

    }

    return {
        luo: luoRastiLomake
    };

})();

/**
 * Objekti, joka sisältää joukkueen lisäämiseen ja muokkaamiseen käytettävän
 * lomakkeen luomiseen ja käsittelyyn tarvittavan logiikan.
 * 
 * On riippuvainen API-objektin tarjoamista metodeista joukkueen tietojen
 * tallentamiseen. Kutsuu myös TULOSPALVELU:n päivitä()-metodia tietojen
 * tallentamisen jälkeen.
 * 
 * Objekti ylläpitää sisäisiä viitteitä luodun lomakkeen keskeisimpiin kenttiin
 * ja painikkeisiin, jotta niiden ohjelmallinen käsittely ei vaatisi turhia
 * DOM-kyselyitä.
 */
const JOUKKUELOMAKE = (function () {
    var _lomake = {
        lomake: undefined,
        fieldset: {},
        legend: {},
        button: {},
        input: {},
        leimaukset: {
            valitsin: undefined,
            input: {}
        }
    };

    var _valittuJoukkue;
    // var _valittuLeimaus;

    /**
     * Luo joukkueen lisäämiseen ja muokkaamisen käytettävän lomakkeen. Parametrina
     * annettava muualla luotu lomake, jonka lapsiksi luodut elementit lisätään.
     * 
     * Rekisteröi tapahtumankäsittelijäksi _tarkistaJoukkueLomake-metodin.
     */
    function luoJoukkueLomake(lomake) {
        //tallennetaan viite lomakkeeseen
        _lomake.lomake = lomake;

        //lisätään tapahtumankäsittelijä tarkistamaan lomakkeen sisältö
        lomake.addEventListener('submit', (e) => {
            e.preventDefault();
            let form = e.target;
            let formData = new FormData(form);
            _tarkistaJoukkueLomake(formData);
        });

        //ensimmäinen fieldset sisältää kentät id:lle ja nimelle,
        let fieldset1 = _luoIdJaNimiKentat();
        lomake.appendChild(fieldset1);

        //toinen fieldset jäsenille
        let fieldset2 = _luoJasenKenttaJoukko();
        fieldset1.appendChild(fieldset2);

        //kolmas fieldset leimaustavalle
        let fieldset3 = _luoLeimaustapaKentat();
        fieldset1.appendChild(fieldset3);

        //nappulat
        var p1 = document.createElement('p');
        p1.appendChild(_luoPainike('lisaa', "Lisää joukkue", false, true));
        fieldset1.appendChild(p1);

        var p2 = document.createElement('p');
        p2.appendChild(_luoPainike('muokkaa', "Tallenna muutokset", true, true));
        fieldset1.appendChild(p2);


        //neljäs fieldset leimauksille
        let fieldset4 = _luoFieldset('Muokkaa joukkueen leimauksia', 'leimaukset');
        fieldset4.hidden = true;
        lomake.appendChild(fieldset4);

        //viides fieldset leimauksen muokkaukselle
        // let fieldset5 = _luoLeimausKentat();
        // fieldset4.appendChild(fieldset5);

    }


    /** Luo painikkeen annetuilla argumenteilla. Viite painikkeeseen
     * tallennetaan _lomake-objektiin.
     */
    function _luoPainike(nimi, teksti, hidden, disabled) {
        var button = document.createElement('button');

        button.id = `button_joukkue_${nimi}`;
        button.hidden = hidden;
        button.disabled = disabled;

        button.appendChild(document.createTextNode(teksti));

        _lomake.button[nimi] = button;

        return button;
    }

    /** Luo text-tyyppisen input-kentän ja liittää sille argumenttina
     * annetun tapahtumankäsittelijän, mikäli sellainen on annettu.
     */
    function _luoTekstiKentta(id, otsake, kasittelija) {
        var label = document.createElement('label');
        var input = document.createElement('input');

        label.appendChild(document.createTextNode(otsake));

        input.type = 'text';
        input.name = id;
        input.id = `input_joukkue_${id}`;

        if (kasittelija !== undefined) {
            input.addEventListener("input", kasittelija);
        }

        label.appendChild(input);

        _lomake.input[id] = input;

        return label;
    }

    /** Luo fieldsetin annetulla otsakkeella. */
    function _luoFieldset(otsake, nimi) {
        var fieldset = document.createElement('fieldset');
        var legend = document.createElement('legend');
        legend.appendChild(document.createTextNode(otsake));
        if (nimi !== undefined) {
            _lomake.fieldset[nimi] = fieldset;
            _lomake.legend[nimi] = legend;
        }
        fieldset.appendChild(legend);
        return fieldset;
    }

    /** Luo kentät id:lle ja joukkueen nimelle. */
    function _luoIdJaNimiKentat() {
        let fieldset = _luoFieldset('Uusi joukkue', 'joukkue');

        //joukkueen id
        var input0 = document.createElement('input');
        input0.type = 'hidden';
        input0.name = 'id';
        input0.value = -1;
        input0.id = 'input_joukkue_id';
        _lomake.input.id = input0;
        fieldset.appendChild(input0);

        //joukkueen nimi

        var p = document.createElement('p');
        p.appendChild(_luoTekstiKentta("nimi", "Nimi ", _validoiJoukkueKentat));
        fieldset.appendChild(p);

        return fieldset;
    }

    /** Luo ensimmäiset kaksi jäsenkenttää */
    function _luoJasenKenttaJoukko() {
        let fieldset = _luoFieldset('Jäsenet', 'jasenet');

        fieldset.appendChild(_luoJasenKentta(1));

        fieldset.appendChild(_luoJasenKentta(2));

        return fieldset;
    }

    /**
     * Luo yksittäisen jäsenkentän p-elementin sisällä. Lisää kentälle
     * tapahtumankäsittelijän, joka muuttaa dynaamisesti jäsenkenttien määrää
     * siten, että vähintään yksi kenttä on aina tyhjä.
     */
    function _luoJasenKentta(numero) {

        var p = document.createElement('p');
        let kentta = _luoTekstiKentta(`jasen${numero}`, `Jäsen ${numero} `, (e) => {
            let kentta = e.target;
            _muutaJasenkenttienMaaraa(kentta);
            _validoiJoukkueKentat();
        });
        let input = kentta.getElementsByTagName('input')[0];
        input.name = "jasen";
        p.appendChild(kentta);
        return p;
    }

    /**
     * Tapahtumankäsittelijä, joka lisää ja poistaa jäsenkenttiä siten, että
     * vähintään yksi kenttä on aina tyhjänä.
     */
    function _muutaJasenkenttienMaaraa(kentta) {
        //haetaan viitteet jäsenkenttiin ja ne sisältävään fieldsetiin
        let parent = _lomake.fieldset.jasenet;
        let jasenkentat = parent.getElementsByTagName("input");

        let kenttia = jasenkentat.length;

        /* jos tapahtuman aiheuttanut kenttä ei ole enää tyhjä,
        tarkistetaan tarvitseeko tyhjiä kenttiä luoda lisää */
        if (kentta.value !== "") {
            let tyhjia = false;

            for (let i = kenttia - 1; i >= 0; i--) {
                if (jasenkentat[i].value === "") {
                    tyhjia = true;
                    break;
                }
            }
            //jos yhtään tyhjää ei ollut, luodaan uusi kenttä
            if (!tyhjia) {
                parent.appendChild(_luoJasenKentta(kenttia + 1));
            }
            /* jos tapahtuman aiheuttanut kenttä on tyhjä, ja kenttiä
            on useampi kuin kaksi, tulee tyhjä kenttä poistaa */
        } else if (kentta.value.trim() === "" && kenttia > 2) {
            let i;

            //etsitään viimeinen tyhjä kenttä ja poistetaan se
            for (i = kenttia - 1; i >= 0; i--) {
                if (jasenkentat[i].value.trim() === "") {
                    //p > label > input
                    parent.removeChild(jasenkentat[i].parentNode.parentNode);
                    break;
                }
            }
            //muutetaan poistetun kentän jälkeisten kenttien järjestysnumero
            for (; i < kenttia - 1; i++) {
                jasenkentat[i].id = `input_joukkue_jasen${i + 1}`;
                jasenkentat[i].previousSibling.textContent = `Jäsen ${i + 1} `;
            }
        }
    }

    /**
     * Tarkistaa onko kaikki vaaditut kentät täytetty, aktivoi tallennuspainikkeen
     * mikäli on ja deaktivoi mikäli ei.
     */
    function _validoiJoukkueKentat() {
        let onkoLeimaustapa = false;
        let tavat = _lomake.fieldset.leimaustapa.getElementsByTagName('input');

        //onko vähintään yksi leimaustapa valittu
        for (let tapa of tavat) {
            if (tapa.checked) {
                onkoLeimaustapa = true;
                break;
            }
        }

        let jasenkentat = _lomake.fieldset.jasenet.getElementsByTagName("input");
        let nimikentta = _lomake.input.nimi;

        // jos leimaustapa on valittu ja jäseniä on kaksi tai yli, aktivoidaan
        // tallennuspainike
        if (nimikentta.value.trim() !== "" && jasenkentat.length > 2 && onkoLeimaustapa) {
            _lomake.button.lisaa.disabled = false;
            _lomake.button.muokkaa.disabled = false;

        } else {
            _lomake.button.lisaa.disabled = true;
            _lomake.button.muokkaa.disabled = true;
        }
    }

    /**
     * Täyttää lomakkeen valitun joukkueen tiedoilla. Muuttaa lomakkeen
     * ulkoasua vastaamaan joukkueen muuttamista. Joukkueen tiedot haetaan
     * id:n perusteella API:sta. 
     */
    function taytaTiedot(joukkueId) {
        //poistetaan edellisen joukkueen tiedot
        if (_lomake.input.id.value != -1) {
            _tyhjennaLomake();
        }

        _valittuJoukkue = API.joukkue.haeIdlla(joukkueId);

        /* piilotetaan uuden joukkueen lisäämiseen käytetty nappi,
        näytetään muokkausnappi */
        _lomake.button.lisaa.hidden = true;
        _lomake.button.muokkaa.hidden = false;
        _lomake.legend.joukkue.textContent = "Muokkaa joukkueen tietoja";

        _lomake.input.id.value = _valittuJoukkue.id;
        _lomake.input.nimi.value = _valittuJoukkue.nimi;

        //näytetään myös joukkueen leimaukset
        _lomake.fieldset.leimaukset.hidden = false;

        //täytetään jäsenkentät
        let jasenia = _valittuJoukkue.jasenet.length;
        for (let i = 0; i < jasenia; i++) {
            let jasenInput = document.getElementById(`input_joukkue_jasen${i + 1}`);
            jasenInput.value = _valittuJoukkue.jasenet[i];

            /* luodaan input-event, jotta lomake osaa luoda tarvittaessa lisää
            jäsenkenttiä */
            var event = new Event('input', {
                bubbles: true,
                cancelable: true,
            });

            jasenInput.dispatchEvent(event);
        }

        let leimaustavat = _valittuJoukkue.leimaustapa;

        // valitaan valmiiksi joukkueen käyttämät leimaustavat
        for (let tapa of leimaustavat) {
            let valinta = document.getElementById(`input_joukkue_leimaustapa_${tapa}`);

            valinta.checked = true;
        }

        // luodaan kentät leimauksien muokkaamiseen
        _luoLeimausKentat();

        _validoiJoukkueKentat();
    }

    /**
     * Luo kentät tietorakenteesta haetuille leimaustavoille. Lisää
     * tapahtumankäsittelijän, joka validoi lomakkeen aina kun valintaa
     * muutetaan.
     */
    function _luoLeimaustapaKentat() {
        let leimaustavat = API.leimaustavat.haeKaikki();

        let fieldset = _luoFieldset('Leimaustapa', 'leimaustapa');

        // luodaan jokaiselle leimaustavalle label, checkbox sekä
        // tapahtumankäsittelijä
        for (let tapa of leimaustavat) {
            let label = document.createElement('label');
            label.style.marginRight = '1em';
            label.appendChild(document.createTextNode(tapa));
            let valinta = document.createElement('input');
            valinta.type = 'checkbox';
            valinta.name = 'leimaustapa';
            valinta.value = tapa;
            valinta.id = `input_joukkue_leimaustapa_${tapa}`;

            valinta.addEventListener('input', _validoiJoukkueKentat);
            label.appendChild(valinta);
            fieldset.appendChild(label);
        }

        return fieldset;
    }

    /**
     * Luo kentät joukkueen leimauksien muokkaamiselle. Leimatun rastin
     * voi vaihtaa toiseksi, aikaleimaa muokata ja rastin poistaa. Leimauksia
     * voi myös lisätä manuaalisesti.
     */
    function _luoLeimausKentat() {
        let fieldset = _lomake.fieldset.leimaukset;

        //haetaan joukkueen leimaamat rastit
        let leimaukset = _valittuJoukkue.rastit;

        //luodaan leimauskenttä jokaista rastia kohden
        for (let i in leimaukset) {
            let p = _luoLeimausKentta(leimaukset[i], i);

            fieldset.appendChild(p);
        }

        //luodaan näkymän alareunaan painikkeet
        let div = document.createElement('div');
        div.id = 'leimaus_alanapit';

        //ensimmäinen painike luo "tyhjän" leimauksen
        let uusi = document.createElement('input');
        uusi.type = 'button';
        uusi.addEventListener('click', (e) => {
            //haetaan leimausten määrä
            let leimauksia = fieldset.childElementCount - 2;
            //luodaan blanko rasti
            let tyhja = {aika : 'yyyy-MM-dd hh:mm:ss', rasti: 0};
            //luodaan uusi leimauskenttä
            let p = _luoLeimausKentta(tyhja, leimauksia);
            fieldset.insertBefore(p, fieldset.lastElementChild);
            // siirretään näkymää alaspäin
            fieldset.scrollIntoView(false);
        });
        uusi.value = "Uusi leimaus";
        uusi.style.margin = '1em';
        div.appendChild(uusi);

        //toinen painike rullaa näkymän takaisin tallennuspainikkeen lähistölle
        let ylos = document.createElement('input');
        ylos.type = 'button';
        ylos.addEventListener('click', (e) => {
            e.preventDefault();
            let ylareuna = _lomake.lomake;
            ylareuna.scrollIntoView();
        });
        ylos.value = "Ylös";
        ylos.style.margin = '1em';
        div.appendChild(ylos);

        fieldset.appendChild(div);
    }

    /**
     * Luo uuden leimauskentän. Argumentteina annettava attribuutit
     * "aika" ja "rasti" sisältävä objekti, jonka sisällön mukaan leimauskentän
     * arvot täytetään sekä id-numero jolla kentän elementit yhdistetään toisiinsa
     * kun tietoja tallennetaan. */
    function _luoLeimausKentta(leimaus, id) {
        let p = document.createElement('p');
        p.id = `leimaus_${id}`;

        //aikaleima syötetään tavallisena tekstinä
        let aikaleima = document.createElement('input');
        aikaleima.type = "text";
        aikaleima.id = `leimaus_${id}_aika`;
        aikaleima.value = leimaus.aika;

        /*luodaan rastivalitsin, joka sisältää kaikki tietorakenteeseen tallennetut
        rastit. Jos leimauksen id ei ole muunnettavissa numeroksi, asetetaan id:n
        arvoksi 0, joka vastaa rastivalitsimessa rastia "Tuntematon rasti". */ 
        let rastivalitsin = _luoRastiValitsin();
        let rastiId = parseInt(leimaus.rasti);
        if (isNaN(rastiId)) {
            rastiId = 0;
        }
        rastivalitsin.value = rastiId;
        rastivalitsin.id = `leimaus_${id}_rasti`;

        p.appendChild(rastivalitsin);
        p.appendChild(aikaleima);

        //luodaan checkbox jolla rastin voi halutessaan merkitä poistettavaksi
        let poistoLabel = document.createElement('label');
        poistoLabel.appendChild(document.createTextNode(" Poista"));
        let poisto = document.createElement('input');
        poisto.type = 'checkbox';
        poisto.id = `leimaus_${id}_poisto`;
        poistoLabel.appendChild(poisto);

        p.appendChild(poistoLabel);

        return p;
    }

    /**
     * Luo alasvetovalikon, josta voi valita rastin. Rastien listaus
     * haetaan API:n kautta.
     */
    function _luoRastiValitsin() {
        //haetaan tiedot kaikista rasteista
        let rastit = API.rasti.haeKaikki();

        //järjestetään rastit nousevaan järjestykseen, numerot ennen kirjaimia
        rastit.sort((a, b) => {
            return a.koodi.localeCompare(b.koodi);
        });

        let rastivalitsin = document.createElement('select');

        //lisätään jokaista rastia varten vaihtoehto
        for (let rasti of rastit) {
            let valinta = document.createElement('option');
            valinta.value = rasti.id;
            valinta.text = rasti.koodi;
            rastivalitsin.appendChild(valinta);
        }

        //viimeiseksi valinta tuntematonta rastia varten
        let valinta = document.createElement('option');
        valinta.value = 0;
        valinta.text = "Tuntematon rasti";
        rastivalitsin.appendChild(valinta);

        return rastivalitsin;
    }


    /**
     * Luo leimauskentistä taulukon, jonka avulla muokatut leimaukset voidaan
     * tallentaa joukkueen tietoihin. Leimauksia ei validoida tässä toteutuksessa.
     */
    function _tarkistaLeimauskentät() {
        let fieldset = _lomake.fieldset.leimaukset;

        //luodaan tyhjä taulukko muokattuja leimauksia varten
        let rastit = new Array(0);

        let leimaukset = fieldset.getElementsByTagName('p');

        /*tallennetaan sellaisenaan kaikki leimaukset joita ei ole merkitty
        poistettaviksi */
        for (let leimaus of leimaukset) {
            let id = leimaus.id;

            let poistetaanko = document.getElementById(id + "_poisto").checked;

            if (poistetaanko) {
                continue;
            }

            let aika = document.getElementById(id + "_aika").value;
            let rasti = document.getElementById(id + "_rasti").value;

            rastit.push({ aika, rasti });
        }

        return rastit;
    }

    /**
     * Tapahtumankäsittelijä, jota kutsutaan kun lomake lähetetään. Jos
     * tallennettavan joukkueen id on -1, tallentaa API:n avulla uuden
     * joukkueen tiedot. Muussa tapauksessa pyytää API:a muokkaamaan
     * olemassa olevaa joukkuetta. Ottaa parametrinaan formData-objektin,
     * joka sisältää lomakkeeseen täytetyt tiedot.
     */
    function _tarkistaJoukkueLomake(formData) {
        let id = parseInt(formData.get("id"));
        let nimi = formData.get("nimi");
        let jasenet = formData.getAll("jasen");
        let leimaustapa = formData.getAll("leimaustapa");

        let parsitutJasenet = new Array(0);

        // poistetaan tyhjän jäsenkentän tiedot
        for (let jasen of jasenet) {
            if (jasen.trim() !== "") {
                parsitutJasenet.push(jasen);
            }
        }

        // nämä on validoitu aiemmin, mutta varmistetaan vielä
        if (parsitutJasenet.length < 2 || nimi.trim() === "") {
            return;
        }

        //luodaan tietorakennetta vastaava joukkue-objekti
        let joukkue = {
            nimi: nimi,
            id: id,
            jasenet: parsitutJasenet,
            leimaustapa: leimaustapa
        };

        //tallennetaan muutokset
        if (id === -1) {
            joukkue = API.joukkue.lisaa(joukkue);
        } else {
            joukkue.rastit = _tarkistaLeimauskentät();
            joukkue = API.joukkue.muokkaa(joukkue);
        }

        _tyhjennaLomake();

        TULOSPALVELU.paivitaTaulukko();

        //rullataan äsken lisätty / muokattu joukkue näkyviin
        let rivi = document.getElementById(joukkue.id);
        rivi.scrollIntoView();
    }

    /** Palauttaa lomakkeen lähtötilanteeseen. Tyhjentää kentät,
     * poistaa ylimääräiset jäsenkentät ja piilottaa elementit jotka
     * ovat näkyvissä vain kun muokataan joukkueen tietoja.
     */
    function _tyhjennaLomake() {
        _valittuJoukkue = null;

        _lomake.lomake.reset();

        _lomake.input.id.value = -1;
        _lomake.button.lisaa.hidden = false;
        _lomake.button.muokkaa.hidden = true;
        _lomake.legend.textContent = "Uusi joukkue";

        let jasenkentat = _lomake.fieldset.jasenet;

        // poistetaan ylimääräiset jäsenkentät
        for (let i = jasenkentat.children.length - 1; i > 2; i--) {
            jasenkentat.removeChild(jasenkentat.children[i]);
        }

        // poistetaan leimauskentät
        let leimaukset = _lomake.fieldset.leimaukset;

        while (leimaukset.childElementCount > 1) {
            leimaukset.removeChild(leimaukset.children[1]);
        }

        _lomake.fieldset.leimaukset.hidden = true;
    }

    return {
        luo: luoJoukkueLomake,
        tayta: taytaTiedot,
        lomake: _lomake
    };

})();


window.onload = function () {

    let tupa = document.getElementById("tupa");
    let taulu = TULOSPALVELU.luoTaulukko();
    tupa.appendChild(taulu);

    let lomakkeet = document.getElementsByTagName("form");

    /* oikeasti muokkaisin pohja.xhtml-tiedostoa siten, että
       asettaisin lomakkeelle yksilöivän id:n... */
    let rastiLomake = lomakkeet[0];
    rastiLomake.id = "rasti_lomake";

    RASTILOMAKE.luo(rastiLomake);

    let joukkueLomake = document.getElementById("joukkue");
    joukkueLomake.id = "joukkue_lomake";

    JOUKKUELOMAKE.luo(joukkueLomake);

    TULOSPALVELU.paivitaTaulukko();

    //HTMLInspector.inspect();
};