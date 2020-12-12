"use strict";  // pidä tämä ensimmäisenä rivinä
//@ts-check 

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

/**
 * Uuden leimaustavan lisäämiseen käytettävän lomakkeen tapahtumankäsittelijä.
 */
let leimaustapaForm = (function () {
    var form;

    /** Lisää kutsuttaessa painikkeelle tapahtumankäsittelijän */
    function lisaaKasittelija() {
        form = document.forms["form_leimaustapa"];
        let button = form.getElementsByTagName("button")[0];

        button.addEventListener("click", (e) => {
            e.preventDefault();
            tarkistaLomake();
        });
    }


    /** Validoi lomakkeeseen syötetyt tiedot hyödyntäen Constraints validation API:a. */
    function tarkistaLomake() {
        let nimiInput = form.getElementsByTagName("input")[0];

        //nimen pituuden oltava >= 2 merkkiä
        if (nimiInput.validity.valueMissing) {
            nimiInput.setCustomValidity("Anna leimaustavan nimi!");
        } else if (nimiInput.validity.tooShort) {
            nimiInput.setCustomValidity("Nimen on oltava vähintään kaksi merkkiä");
        } else {
            let leimaustavat = API.leimaustapa.haeKaikki();

            var nimi = nimiInput.value;
            let loytyyko = leimaustavat.findIndex(el => el.trim().toLowerCase() === nimi.trim().toLowerCase());

            //nimen on oltava uniikki
            if (loytyyko != -1) {
                nimiInput.setCustomValidity(`Leimaustapa ${nimiInput.value} on jo lisätty`);
            } else {
                nimiInput.setCustomValidity("");
            }
        }

        nimiInput.reportValidity();

        //lisätään leimaustapa sekä päivitetään joukkueen lisäys-/muokkauslomake
        // sisältämään myös uusi leimaustapa
        if (nimiInput.validity.valid) {
            API.leimaustapa.lisaa(nimi);
            JOUKKUELOMAKE.paivitaLomake();
        }
    }

    return { lisaa: lisaaKasittelija };
})();

/** Ajan käsittelyyn liittyviä apumetodeita. */
let aikaUtils = {

    /**
     * Muuttaa aikaleiman datan käyttämästä muodosta ISO-muotoiseksi.
     * @param {string} aikaleima
     * @returns {string}
     */
    normalisoiAikaleima: function (aikaleima) {
        return aikaleima.replace(' ', 'T');
    },

    /**
     * Muuttaa aikaleiman ISO-muotoisesta datan käyttämään muotoon.
     * @param {string} aikaleima
     * @returns {string}
     */
    denormalisoiAikaleima: function (aikaleima) {
        return aikaleima.replace('T', ' ');
    },

    /** 
     * Muuntaa yyyy-MM-dd hh:ss:mm-muotoisen merkkijonon Date-objektiksi
     * @param {string} aikaleima
     * @returns {Date}
     */
    aikaleimaDateksi: function (aikaleima) {
        let ajat = aikaleima.split(/\D+/).map(t => parseInt(t));
        ajat[1]--;
        let date = new Date(...ajat);
        //tarkistetaan vielä että päivämäärä meni oikein
        if (date.getFullYear() === ajat[0] &&
            date.getMonth() === ajat[1] &&
            date.getDate() === ajat[2] &&
            date.getHours() === ajat[3] &&
            date.getMinutes() === ajat[4] &&
            date.getSeconds() === ajat[5]) {
            return date;
        } else {
            //palautetaan invalid date jos meni pieleen
            return new Date("foo");
        }
    },

    /**
     * Muuntaa Date-objektin merkkijonomuotoiseksi ilmaisuksi.
     * @param {Date} aika
     * @returns {string}
     */
    dateAikaleimaksi: function (aika) {
        //toISOstring palauttaa UTC-aikaan muunnetun merkkijonon, vähennetään aikavyöhykkeiden erotus
        let aikaLocal = new Date(aika.getTime() - (aika.getTimezoneOffset() * 60000));
        return aikaLocal.toISOString().slice(0, 19).replace('T', ' ');
    }
};
/**
 * Luo joukkueiden muokkaamiseen käytettävän lomakkeen ja siihen liittyvän sovelluslogiikan.
 * Moduli jakautuu neljään alimoduliin, jotka sisältävät lomakkeen luomiseen, validoimiseen,
 * täyttämiseen sekä lähettämiseen liittyvät metodit.
 */
const JOUKKUELOMAKE = (function () {

    var _rastiMap;
    var _datalist;

    var _valittuJoukkue;
    var _valittuSarja;

    //luodaan erilliset tietorakenteet muokattuja ja poistettavia rasteja varten
    var _muokatutLeimaukset = new Set();
    var _poistettavatLeimaukset = new Set();

    /** Moduli, joka sisältää lomakkeen validoimiseen käytettävät metodit. */
    var tarkistaja = (function () {

        /**
         * Metodi tarkistaa jokaisen lomakkeen osion ja palauttaa true mikäli kaikki data on validia.
         * @returns {boolean}
         */
        function _tarkistaLomake() {
            let valid = true;

            valid = _tarkistaNimi() && valid;
            valid = _tarkistaJasenet() && valid;
            valid = _tarkistaLeimaustavat() && valid;
            valid = _tarkistaSarja() && valid;
            valid = _tarkistaLeimaukset() && valid;

            return valid;
        }

        /**
         * Tarkistaa joukkueen nimen sille asetettujen pituusrajoitteiden osalta sekä
         * tarkistaa ettei samannimistä joukkuetta ole jo lisättynä "tietokantaan".
         * @returns {boolean}
         */
        function _tarkistaNimi() {
            let input_nimi = document.getElementById("input_nimi");
            let input_id = document.getElementById("input_id");

            if (input_nimi.validity.valueMissing) {
                input_nimi.setCustomValidity("Anna joukkueelle nimi");
            } else if (input_nimi.validity.tooShort) {
                input_nimi.setCustomValidity("Nimen on oltava vähintään 2 merkkiä pitkä!");
            } else if (onkoSamanNimista()) {
                //tarkistetaan vielä ettei samannimistä joukkuetta ole jo lisättynä
                input_nimi.setCustomValidity("Nimi on jo käytössä!");
            } else {
                input_nimi.setCustomValidity("");
            }

            return input_nimi.reportValidity();

            //apufunktio, joka tarkistaa onko kenttään syötettyä arvoa vastaava joukkue jo olemassa
            function onkoSamanNimista() {
                let nimi = input_nimi.value;
                let id = parseInt(input_id.value);
                let olemassa = API.joukkue.haeNimella(nimi);

                if (olemassa === null || olemassa.id === id) {
                    //jos joukkuetta ei löydy, tai löytynyt joukkue on lomakkeella muokattava joukkue
                    return false;
                }

                return true;
            }
        }

        /**
         * Tarkistaa lomakkeen jäsenkentät varmistaen, että vähintään kahdessa kentässä
         * on jäsenen nimi eikä kahdelle jäsenelle ole syötetty samaa nimeä.
         * @returns {boolean}
         */
        function _tarkistaJasenet() {
            let div_jasenet = document.getElementById("div_jasenet");
            let jasenkentat = div_jasenet.getElementsByTagName("input");
            let kenttia = jasenkentat.length;

            let jasenetOk = true;

            for (let i = 0; i < kenttia; i++) {
                let kentta = jasenkentat[i];
                //nollataan aiemmat virheilmoitukset
                kentta.setCustomValidity("");
                let arvo = kentta.value.trim().toLowerCase();
                /* koska kenttiä lisätään ja poistetaan dynaamisesti, riittää selvittää
                kenttien määrä ja herjata jos kenttä on tyhjä*/
                if (kenttia < 3 && arvo === "") {
                    kentta.setCustomValidity("Syötä vähintään kaksi jäsentä!");
                    kentta.reportValidity();
                    jasenetOk = false;
                } else {
                    //jos kenttä ei ole tyhjä, etsitään onko saman nimisiä jäseniä
                    for (let j = 0; j < kenttia; j++) {
                        let toinen = jasenkentat[j].value.trim().toLowerCase();
                        if (i !== j && arvo === toinen) {
                            jasenkentat[i].setCustomValidity("Ei samannimisiä jäseniä!");
                            jasenkentat[j].setCustomValidity("Ei samannimisiä jäseniä!");
                            jasenkentat[j].reportValidity();
                            jasenetOk = false;
                        }
                    }
                }
            }

            return jasenetOk;
        }

        /**
         * Varmistaa, että vähintään yksi leimaustapa on valittuna
         * @returns {boolean}
         */
        function _tarkistaLeimaustavat() {
            let div_leimaustavat = document.getElementById("div_leimaustavat");
            let tavat = div_leimaustavat.getElementsByTagName('input');
            let onkoLeimaustapa = false;

            //onko vähintään yksi leimaustapa valittu
            for (let tapa of tavat) {
                if (tapa.checked) {
                    onkoLeimaustapa = true;
                    break;
                }
            }

            if (!onkoLeimaustapa) {
                for (let tapa of tavat) {
                    tapa.setCustomValidity("Valitse vähintään yksi vaihtoehto!");
                    tapa.reportValidity();
                }
            } else {
                for (let tapa of tavat) {
                    tapa.setCustomValidity("");
                }
            }

            return onkoLeimaustapa;
        }

        /**
         * Varmistaa, että lomakkeella on valittuna joukkueen sarja.
         * @returns {boolean}
         */
        function _tarkistaSarja() {
            let div_sarjat = document.getElementById("div_sarjat");
            let sarjat = div_sarjat.getElementsByTagName("input");
            let onkoSarja = false;

            for (let sarja of sarjat) {
                if (sarja.checked) {
                    onkoSarja = true;
                    break;
                }
            }

            if (!onkoSarja) {
                for (let sarja of sarjat) {
                    sarja.setCustomValidity("Valitse yksi vaihtoehto!");
                }
                sarjat[0].reportValidity();
            } else {
                for (let sarja of sarjat) {
                    sarja.setCustomValidity("");
                }
            }

            return onkoSarja;
        }

        /**
         * Metodilla validoidaan muokatut rastikentät. Tässä joudutaan nyt hieman
         * kikkailemaan, kun tehtävänannossa vaadittiin että tietorakenteesta
         * jo löytyvät tuplakirjaukset ja virheelliset leimaukset pitää säästää.
         * @returns {boolean}
         */
        function _tarkistaLeimaukset() {
            //muokkauksia ei ole tehty, kaikki ok
            if (_muokatutLeimaukset.size === 0) {
                return true;
            }

            //selvitetään sarjan alkuaika, tai sen ollessa null/undefined kilpailun alkuaika
            let alkuaika = _valittuSarja.alkuaika || API.kilpailu.alkuaika;
            //sama loppuajalle..
            let loppuaika = _valittuSarja.loppuaika || API.kilpailu.loppuaika;

            let leimauksetOk = true;

            for (let rivi of _muokatutLeimaukset) {
                let rastikentta = document.getElementById(`leimaus_${rivi}_rasti`);
                let aikakentta = document.getElementById(`leimaus_${rivi}_aika`);

                //rivi on merkitty poistettavaksi, ei validoida kenttiä turhaan
                if (_poistettavatLeimaukset.has(rivi)) {
                    continue;
                }

                //leimauksetOk -> false, jos yksikin kenttä on epävalidi
                leimauksetOk = _tarkistaRastikentta(rastikentta) && leimauksetOk;
                leimauksetOk = _tarkistaAikakentta(aikakentta, alkuaika, loppuaika) && leimauksetOk;

            }

            return leimauksetOk;
        }


        /**
         * Metodi tarkistaa onko aikakenttään syötetty data oikeassa muodossa. Toimii sekä
         * datetime-local että text -tyyppisillä kentillä. Vapaaehtoisina parametreina
         * sarjan/kilpailun alku- ja loppuajat, jotka haetaan tarvittaessa API:n kautta.
         * @returns {boolean}
         */
        function _tarkistaAikakentta(aikakentta, alkuaika, loppuaika) {
            aikakentta.setCustomValidity("");

            //ei validoida jos rivi on merkitty poistettavaksi
            let poistokentta = document.getElementById(aikakentta.id.replace("aika", "poisto"));
            if (poistokentta.checked === true) {
                return true;
            }

            //regex:n sijaan validoidaan syötetty aika yrittämällä luoda siitä Date-olio
            let leimausaika = aikaUtils.aikaleimaDateksi(aikakentta.value);
            if (leimausaika == "Invalid Date") {
                let msg = "Virheellinen arvo";
                if (aikakentta. type === "text") {
                    msg = msg + ". Syötä aika muodossa vvvv-kk-pp tt:mm:ss";
                }
                aikakentta.setCustomValidity(msg);
                return aikakentta.reportValidity();
            }

            if (alkuaika === undefined) {
                alkuaika = _valittuSarja.alkuaika || API.kilpailu.alkuaika;
            }

            if (loppuaika === undefined) {
                loppuaika = _valittuSarja.loppuaika || API.kilpailu.loppuaika;
            }

            //muunnetaan aikaleimat Date-objekteiksi.
            let alkuaikaDate = aikaUtils.aikaleimaDateksi(alkuaika);
            let loppuaikaDate = aikaUtils.aikaleimaDateksi(loppuaika);

            //varmistetaan että leimaus on tehty kilpailun aikana
            if (leimausaika.getTime() < alkuaikaDate.getTime() ||
                leimausaika.getTime() > loppuaikaDate.getTime()) {
                aikakentta.setCustomValidity("Leimauksen on oltaa välillä:\n" +
                    alkuaika + " - " + loppuaika);
            }

            return aikakentta.reportValidity();

        }

        /** 
         * Tarkistaa argumenttina annetun rastikentän sisällön. Etsii tuplakirjauksia hakemistosta,
         * jossa pidetään kirjaa rastikohtaisesti leimausten lukumäärästä. Rastikoodit sisältävä
         * Set-objekti on alustettu lomakkeen luomisen yhteydessä.
         * 
         * @param {HTMLInputElement} rastikentta
         * @returns {boolean}
         */
        function _tarkistaRastikentta(rastikentta) {
            //ei validoida jos rivi on merkitty poistettavaksi
            let poistokentta = document.getElementById(rastikentta.id.replace("rasti", "poisto"));
            if (poistokentta.checked === true) {
                return true;
            }
            //nollataan aiemmat virheilmoitukset
            rastikentta.setCustomValidity("");

            let koodi = rastikentta.value;

            //jos koodia ei löydy rastien joukosta
            if (!_rastiMap.has(koodi)) {
                rastikentta.setCustomValidity(`Virheellinen rastikoodi: ${koodi}`);
            }
            //map on päivitetty edeltävästi sisältämään nyt kirjattu leimaus, eli arvo >= 1
            else if (_rastiMap.get(koodi) > 1) {
                rastikentta.setCustomValidity(`Rasti ${koodi} on jo leimattu`);
            }

            return rastikentta.reportValidity();
        }



        return {
            tarkistaLomake: _tarkistaLomake,
            tarkistaNimi: _tarkistaNimi,
            tarkistaJasenet: _tarkistaJasenet,
            tarkistaLeimaustavat: _tarkistaLeimaustavat,
            tarkistaRastikentta: _tarkistaRastikentta,
            tarkistaAikakentta: _tarkistaAikakentta
        };

    })();

    /**
     * Moduli sisältää lomakkeen luomiseen liittyvän toiminnallisuuden sekä metodin, jolla
     * lomakkeen rakenteen voi päivittää vastaamaan data-objektiin tallennettuja rasteja sekä
     * leimaustapoja.
     * 
     * Lomakkeen vanhempielementit tunnistetaan id-tagien perusteella.
     */
    var rakentaja = (function (tarkistaja) {

        var _form;
        var _input_nimi;
        var _input_id;
        var _div_leimaustavat;
        var _div_sarjat;
        var _div_jasenet;
        var _table_leimaukset;
        var _enableScroll = false;

        /**
         * Luo joukkueen muokkaamisen käytettävän lomakkeen. Kutsuu muita metodeita yksittäisten
         * toiminnallisten komponenttien luomiseen. 
        */
        function luoLomake() {
            _form = document.getElementById("form_joukkue");

            _input_nimi = document.getElementById("input_nimi");
            _input_nimi.addEventListener("blur", tarkistaja.tarkistaNimi);
            _input_id = document.getElementById("input_id");

            _input_id.value = -1;

            _valittuJoukkue = null;
            _valittuSarja = null;

            _div_leimaustavat = document.getElementById("div_leimaustavat");

            _luoLeimaustapaKentat(_div_leimaustavat);

            _div_sarjat = document.getElementById("div_sarjat");

            _luoSarjaKentat(_div_sarjat);

            _div_jasenet = document.getElementById("div_jasenet");

            _luoJasenKentat(_div_jasenet);

            _table_leimaukset = document.getElementById("table_leimaukset");

            //haetaan API:n avulla kaikkien kilpailuun kuuluvien rastien tiedot
            let rastikoodit = API.rasti.haeKaikki().map(rasti => rasti.koodi);
            rastikoodit.sort((a, b) => a.localeCompare(b));

            //hakemistossa pidetään kirjaa rastien leimauskerroista
            _rastiMap = new Map();

            for (let koodi of rastikoodit) {
                _rastiMap.set(koodi, 0);
            }

            _datalist = document.getElementById("datalist_rastit");
            _luoRastiDatalist(_datalist);

            //luodaan yksi tyhjä rivi leimauksille
            _luoLeimausrivi();
            _enableScroll = true;

            //painike lomakkeen lähettämiseksi
            let button = document.createElement('button');
            button.textContent = "Tallenna";
            button.addEventListener("click", (e) => {
                e.preventDefault();
                lahettaja.laheta();
            });

            _form.appendChild(button);

        }


        /**
         * Luo datalistin, jonka avulla rastileimauksia muokattaessa tarjotaan vain
         * leimaamattomia rasteja vaihtoehtoina.
         * 
         * @param {HTMLDatalistElement} datalist 
         */
        function _luoRastiDatalist(datalist) {

            //haetaan tiedot kaikista rasteista
            let rastit = API.rasti.haeKaikki();

            //järjestetään rastit nousevaan järjestykseen, numerot ennen kirjaimia
            rastit.sort((a, b) => {
                return a.koodi.localeCompare(b.koodi);
            });

            //lisätään jokaista rastia varten vaihtoehto
            for (let rasti of rastit) {
                _lisaaRastiDatalistiin(rasti.koodi, datalist);
            }
        }



        /**
         * Poistaa annetun rastikoodin datalistista
         * @param {string} rastikoodi 
         */
        function _poistaRastiDatalistista(rastikoodi) {
            let valinta = document.getElementById(`rasti_option_${rastikoodi}`);

            if (valinta !== null) {
                valinta.remove();
            }
        }


        /**
         * Lisää annetun rastikoodin datalistiin
         * @param {string} rastikoodi 
         */
        function _lisaaRastiDatalistiin(rastikoodi) {
            let valinta = document.createElement('option');
            valinta.value = rastikoodi;
            valinta.id = `rasti_option_${rastikoodi}`;

            //etsitään oikea paikka listassa
            let seuraava = _datalist.firstElementChild;
            while (seuraava !== null && seuraava.value.localeCompare(rastikoodi) <= 0) {
                //ei lisätä samaa rastia useampaan kertaan
                if (seuraava.value.localeCompare(rastikoodi) === 0) {
                    return;
                }
                seuraava = seuraava.nextSibling;
            }
            _datalist.insertBefore(valinta, seuraava);
        }

        /**
         * Metodia kutsutaan, kun tietorakenteeseen on lisätty uusi leimaustapa
         * tai sarja, ja halutaan päivittää lomakkeesta löytyvät kentät. Metodi
         * lisää puuttuvat kentät säilyttäen lomakkeeseen syötetyn datan.
         */
        function paivitaLomake() {
            //päivitetään leimaustavat
            let leimaustavat = API.leimaustapa.haeKaikki();

            // luodaan puuttuville leimaustavoille kenttä
            for (let tapa of leimaustavat) {
                if (document.getElementById(`input_leimaustapa_${tapa}`) === null) {
                    let div = _luoLeimaustapaKentta(tapa);
                    _div_leimaustavat.appendChild(div);
                }
            }

            let sarjat = API.sarja.haeKaikki();

            // luodaan puuttuville sarjoille kenttä
            for (let sarja of sarjat) {
                if (document.getElementById(`input_sarja_${sarja.nimi}` === null)) {
                    let div = _luoSarjaKentta(sarja);
                    _div_sarjat.appendChild(div);
                }
            }

        }

        /**
         * Luo kentät tietorakenteesta haetuille leimaustavoille.
         * @param {HTMLDivElement} parent
         */
        function _luoLeimaustapaKentat(parent) {
            let leimaustavat = API.leimaustapa.haeKaikki();

            // luodaan jokaiselle leimaustavalle label, checkbox sekä
            // tapahtumankäsittelijä
            for (let tapa of leimaustavat) {
                let div = _luoLeimaustapaKentta(tapa);
                parent.appendChild(div);
            }

            return parent;
        }

        /**
         * Luo kentän yksittäiselle leimaustavalle. Lisää tapahtumankäsittelijän,
         * joka validoi kentät aina kun valintaa muutetaan.
         * 
         * @param {string} tapa
         * @returns {HTMLDivElement}
         */
        function _luoLeimaustapaKentta(tapa) {
            let div = document.createElement('div');
            let label = document.createElement('label');
            label.appendChild(document.createTextNode(tapa));

            let valinta = document.createElement('input');
            valinta.type = 'checkbox';
            valinta.name = 'leimaustapa';
            valinta.value = tapa;
            valinta.id = `input_leimaustapa_${tapa}`;

            valinta.addEventListener('change', tarkistaja.tarkistaLeimaustavat);

            label.appendChild(valinta);
            div.appendChild(label);

            return div;
        }

        /**
         * Luo kentät tietorakenteesta haetuille sarjoille.
         * @param {HTMLDivElement} parent
         */
        function _luoSarjaKentat(parent) {
            let sarjat = API.sarja.haeKaikki();

            for (let sarja of sarjat) {
                let div = _luoSarjaKentta(sarja);
                parent.appendChild(div);
            }

            //valitaan oletuksena ensimmäinen
            let oletus = parent.getElementsByTagName('input')[0];
            oletus.checked = "true";
            _valittuSarja = API.sarja.haeIdlla(oletus.value);

            return parent;
        }

        /**
         * Luo kentän yksittäiselle sarjalle. Lisää tapahtumankäsittelijän,
         * joka validoi kentät aina kun valintaa muutetaan sekä tallentaa
         * tiedon valitusta sarjasta apumuuttujaan
         * 
         * @param {object} sarja
         * @returns {HTMLDivElement}
         */
        function _luoSarjaKentta(sarja) {
            let div = document.createElement('div');
            let label = document.createElement('label');
            label.appendChild(document.createTextNode(sarja.nimi));

            let valinta = document.createElement('input');
            valinta.type = 'radio';
            valinta.name = 'sarja';
            valinta.value = sarja.id;
            valinta.id = `input_sarja_${sarja.nimi}`;

            valinta.addEventListener("change", (e) => {
                if (e.target.checked === true) {
                    _valittuSarja = API.sarja.haeIdlla(e.target.value);
                }
            });

            label.appendChild(valinta);
            div.appendChild(label);

            return div;
        }

        function _luoJasenKentat(parent) {
            parent.appendChild(_luoJasenKentta(1));
            parent.appendChild(_luoJasenKentta(2));

            return parent;
        }

        /**
        * Luo yksittäisen jäsenkentän. Lisää kentälle tapahtumankäsittelijän,
        * joka muuttaa dynaamisesti jäsenkenttien määrää siten, että vähintään
        * yksi kenttä on aina tyhjä.
        * 
        * @param {number} numero Jäsenkentän järjestysnumero (1->)
        * @returns {HTMLDivElement}
        */
        function _luoJasenKentta(numero) {

            var div = document.createElement('div');
            div.className = "left";

            let label = document.createElement('label');
            label.appendChild(document.createTextNode(`Jäsen ${numero} `));
            div.appendChild(label);

            var innerdiv = document.createElement('div');
            innerdiv.className = "right";

            let input = document.createElement('input');
            input.id = `input_jasen_${numero}`;
            input.name = "jasenet";
            input.index = numero;

            input.addEventListener('focus', (e) => {
                e.target.oldvalue = e.target.value;
            });
            input.addEventListener('input', (e) => {
                /* jos tapahtuman aiheuttanut kenttä ei ole enää tyhjä,
                tarkistetaan tarvitseeko tyhjiä kenttiä luoda lisää */
                if (e.target.oldvalue === "" || e.target.oldvalue === undefined) {
                    _lisaaJasenkentta();
                } else if (e.target.value === "") {
                    _poistaJasenkentta();
                }

                e.target.oldvalue = e.target.value;
            });

            //tarkistetaan kenttä fokuksen poistuessa
            input.addEventListener("change", tarkistaja.tarkistaJasenet);

            label.htmlFor = input.id;

            innerdiv.appendChild(input);

            div.appendChild(innerdiv);
            return div;
        }

        /**
         * Lisää uuden jäsenkentän, mikäli yhtään tyhjää kenttää ei ole.
         */
        function _lisaaJasenkentta() {
            let jasenkentat = _div_jasenet.getElementsByTagName("input");

            let kenttia = jasenkentat.length;

            let tyhjia = false;

            //käydään kentät läpi, etsitään onkä vähintään yksi tyhjä
            for (let i = kenttia - 1; i >= 0; i--) {
                if (jasenkentat[i].value === "") {
                    tyhjia = true;
                    break;
                }
            }
            //jos yhtään tyhjää ei ollut, luodaan uusi kenttä
            if (!tyhjia) {
                _div_jasenet.appendChild(_luoJasenKentta(kenttia + 1));
            }
        }

        /**
         * Poistaa jäsenkentän, mikäli tyhjiä kenttiä on ylimäärä.
         */
        function _poistaJasenkentta() {
            let jasenkentat = _div_jasenet.getElementsByTagName("input");

            let kenttia = jasenkentat.length;

            // poistetaan vain, jos kenttiä > 2
            if (kenttia <= 2) {
                return;
            }

            //samaa indeksiä käytetään molemmissa silmukoissa
            let i;

            //etsitään viimeinen tyhjä kenttä ja poistetaan se
            for (i = kenttia - 1; i >= 0; i--) {
                if (jasenkentat[i].value.trim() === "") {
                    //div > div > input
                    _div_jasenet.removeChild(jasenkentat[i].parentNode.parentNode);
                    break;
                }
            }
            //muutetaan poistetun kentän jälkeisten kenttien järjestysnumero
            for (; i < kenttia - 1; i++) {
                jasenkentat[i].id = `input_jasen_${i + 1}`;
                jasenkentat[i].parentElement.previousSibling.textContent = `Jäsen ${i + 1} `;
            }
        }

        var _scroll = {
            enable: function () {
                _enableScroll = true;
            },
            disable: function () {
                _enableScroll = false;
            }
        };

        /**
        * Luo uuden rivin leimauksien muokkaamiseen käytettävään taulukkoon. Rivi sisältää
        * kentän rastikoodin syöttämiseksi, toisen kentän leimausaikaa varten sekä valintaruudun,
        * jolla leimauksen voi halutessaan merkitä poistettavaksi. 
        */
        function _luoLeimausrivi() {
            /* haetaan rivin indeksi helpottamaan kenttien tunnistusta. ensimmäinen 
            otsikkorivin jälkeinen kenttä saa indeksin 0 */
            let index = _table_leimaukset.childElementCount - 1;

            let tr = document.createElement('tr');
            tr.id = `leimaus_${index}`;

            /* tallennetaan tieto alkuperäisestä indeksistä, jotta mahdolliset
            muokkaukset osataan kohdentaa oikein */
            tr.index = index;

            //rastikoodin syöttökenttä
            let rastiSarake = document.createElement('td');
            let rastikentta = _luoRastiKentta();
            rastikentta.id = `leimaus_${index}_rasti`;

            rastiSarake.appendChild(rastikentta);
            tr.appendChild(rastiSarake);

            //aikaleima
            let aikaSarake = document.createElement('td');
            let aikakentta = document.createElement('input');
            aikakentta.type = "datetime-local";
            //tarkistetaan onnistuiko tyypin asetus
            if (aikakentta.type === "datetime-local") {
                aikakentta.step = "1";
            } else {
                //jos selain ei tue datetime-localia
                aikakentta.type = "text";
                aikakentta.placeholder = "vvvv-kk-pp tt:mm:ss";
                aikakentta.autocomplete = "off";
            }
            aikakentta.id = `leimaus_${index}_aika`;
            _lisaaAikakentanKasittelijat(aikakentta);

            aikaSarake.appendChild(aikakentta);
            tr.appendChild(aikaSarake);

            //checkbox jolla rastin voi halutessaan merkitä poistettavaksi
            let poistoSarake = document.createElement('td');
            let poisto = document.createElement('input');
            poisto.type = 'checkbox';
            poisto.id = `leimaus_${index}_poisto`;
            poisto.addEventListener("input", _kasittelePoistokentanMuokkaus);

            poistoSarake.appendChild(poisto);
            tr.appendChild(poistoSarake);

            _table_leimaukset.appendChild(tr);

            /* rullataan näkymää niin että uusi kenttä tulee näkyviin. tämä
            aiheutti lomakkeen täyttämisen yhteydessä hyytymistä joten tehdäään se
            vain kun leimauksia syötetään yksi kerrallaan */
            if (_enableScroll === true) {
                var fieldset = document.getElementById("div_leimaukset");
                fieldset.scrollTop = fieldset.scrollHeight;
            }
        }



        /**
        * Luo input-kentän, johon rastin koodi syötetään. Kentälle on liitetty
        * datalist, joka tarjoaa kilpailuun kuuluvia rastikoodeja vaihtoehdoksi.
        * 
        * @returns {HTMLInputElement}
        */
        function _luoRastiKentta() {
            let rastikentta = document.createElement('input');
            rastikentta.type = "text";
            rastikentta.autocomplete = "off";
            rastikentta.setAttribute("list", "datalist_rastit");

            _lisaaRastikentanKasittelijat(rastikentta);

            return rastikentta;
        }

        /**
         * Lisää argumenttina annetulle rastikentälle tapahtumankäsittelijät, jotka
         * huolehtivat kentän validoimisesta sekä uusien rivien luomisesta mikäli
         * muokattava rivi on taulukon viimeinen rivi.
         * 
         * @param {HTMLInputElement} rastikentta
         */
        function _lisaaRastikentanKasittelijat(rastikentta) {
            rastikentta.addEventListener("focus", (e) => {
                //tallennetaan tieto kentän sisällöstä ennen muokkausta, jotta osataan
                //päivittää rastileimausten kirjanpitoa oikein
                e.target.oldvalue = e.target.value;
                e.target.valueOnFocus = e.target.value;
            });
            rastikentta.addEventListener("change", (e) => {
                _kasitteleLeimauksenMuokkaus(e);
                tarkistaja.tarkistaRastikentta(e.target);
            });
            rastikentta.addEventListener("input", (e) => {
                //luodaan uusi rivi jos viimeinen ei ole enää tyhjä
                if (e.target.oldvalue === "" || e.target.oldvalue === undefined) {
                    let vikaindex = _table_leimaukset.childElementCount - 2;

                    if (document.getElementById(`leimaus_${vikaindex}_rasti`) === e.target) {
                        _luoLeimausrivi();
                    }
                }

                e.target.oldvalue = e.target.value;
            });
        }

        /**
         * Lisää argumenttina annetulle aikakentälle tapahtumankäsittelijän, joka
         * lisää leimausrivin muokattujen rivien joukkoon ja validoi kentän sisällön.
         * 
         * @param {HTMLInputElement} aikakentta
         */
        function _lisaaAikakentanKasittelijat(aikakentta) {
            if (aikakentta.type === "datetime-local") {
                aikakentta.addEventListener("blur", (e) => {
                    let muokattuKentta = event.target;
                    let rivi = muokattuKentta.parentNode.parentNode;
                    _muokatutLeimaukset.add(rivi.index);
                    tarkistaja.tarkistaAikakentta(e.target);
                });
            } else {
                aikakentta.addEventListener("change", (e) => {
                    let muokattuKentta = event.target;
                    let rivi = muokattuKentta.parentNode.parentNode;
                    _muokatutLeimaukset.add(rivi.index);
                    tarkistaja.tarkistaAikakentta(e.target);
                });
            }
        }


        /**
         * Tapahtumankäsittelijä, jota kutsutaan kun rastikenttä luo onChange-eventin.
         * Metodilla tallennetaan tieto riveistä, joihin on kohdistunut muokkaus.
         * Joukkoon tallennetut rivit validoidaan ennen lomakkeen lähettämistä, mutta
         * muokkaamattomien rivien sisältöön ei puututa.
         * 
         * Käyttää apuna kentälle luotua valueOnFocus-attribuuttia, johon tallennetaan
         * kenttää aktivoidessa sen sisältö, jotta osataan tarvittaessa poistaa aiemmin
         * tehty rastileimaus leimaamattomat rastit sisältävästä datalistasta sekä
         * hakemistosta.
         * 
         * @param {Event} event
         */
        function _kasitteleLeimauksenMuokkaus(event) {
            let muokattuKentta = event.target;
            let rivi = muokattuKentta.parentNode.parentNode;
            let koodi = muokattuKentta.value;
            let alkupkoodi = muokattuKentta.valueOnFocus;

            //jos syötetty arvo löytyy koodilistauksesta, merkitään rasti leimatuksi
            if (_rastiMap.has(koodi)) {
                _poistaRastiDatalistista(koodi);
                _rastiMap.set(koodi, _rastiMap.get(koodi) + 1);
            }
            //jos kentän alkuperäinen arvo löytyi koodilistauksesta, eli kentän
            //arvo muokkauksen jälkeen ei vastaa enää alkuperäistä, poistetaan
            //alkuperäinen leimaus merkityistä
            if (_rastiMap.has(alkupkoodi)) {
                let leimauksia = _rastiMap.get(alkupkoodi);
                leimauksia--;
                _rastiMap.set(alkupkoodi, leimauksia);
                if (leimauksia === 0) {
                    _lisaaRastiDatalistiin(alkupkoodi);
                }

            }
            //tallennetaan tieto muokatusta rivistä
            _muokatutLeimaukset.add(rivi.index);
        }

        /**
         * Tapahtumankäsittelijä, jota kutsutaan kun leimausrivin poistoon käytettävän checkbox:n
         * arvo muuttuu. Huolehtii kenttien sisältöön liittyvän leimauksen poistosta / lisäämisestä
         * aputietorakenteisiin.
         * 
         * @param {Event} event
         */
        function _kasittelePoistokentanMuokkaus(event) {
            let poistoKentta = event.target;
            let rivi = poistoKentta.parentNode.parentNode;
            let index = rivi.index;

            let rastikentta = document.getElementById(`leimaus_${index}_rasti`);
            let koodi = rastikentta.value;
            let aikakentta = document.getElementById(`leimaus_${index}_aika`);

            if (poistoKentta.checked === true) {
                rastikentta.setCustomValidity("");
                aikakentta.setCustomValidity("");
                //jos rastikentän arvo löytyy koodilistauksesta, poistetaan leimausmerkintä
                if (_rastiMap.has(koodi)) {
                    let leimauksia = _rastiMap.get(koodi);
                    leimauksia--;
                    _rastiMap.set(koodi, leimauksia);
                    if (leimauksia === 0) {
                        _lisaaRastiDatalistiin(koodi);
                    }
                }
                _poistettavatLeimaukset.add(rivi.index);
            } else {
                //jos rastikenttään syötetty arvo löytyy koodilistauksesta, merkitään rasti leimatuksi
                if (_rastiMap.has(koodi)) {
                    _poistaRastiDatalistista(koodi);
                    _rastiMap.set(koodi, _rastiMap.get(koodi) + 1);
                }
                tarkistaja.tarkistaRastikentta(rastikentta);
                tarkistaja.tarkistaAikakentta(aikakentta);

                _poistettavatLeimaukset.delete(rivi.index);
            }
        }

        /**
         * Palauttaa lomakkeen lähtötilanteeseen. Tyhjentää kentät,
         * poistaa ylimääräiset jäsenkentät ja piilottaa elementit jotka
         * ovat näkyvissä vain kun muokataan joukkueen tietoja.
         */
        function _tyhjennaLomake() {
            _valittuJoukkue = null;
            _muokatutLeimaukset = new Set();
            _poistettavatLeimaukset = new Set();

            _form.reset();

            _input_id.value = -1;

            let jasenkentat = _div_jasenet.getElementsByTagName("input");

            // poistetaan ylimääräiset jäsenkentät
            for (let i = jasenkentat.length - 1; i >= 0; i--) {
                let kentta = jasenkentat[i];
                if (kentta.index > 2) {
                    kentta.parentNode.parentNode.remove();
                } else {
                    kentta.oldvalue = "";
                }
            }

            // valitaan sarja
            _div_sarjat.getElementsByTagName('input')[0].checked = "true";

            // poistetaan leimausrivit
            let leimaukset = _table_leimaukset;
            while (leimaukset.childElementCount > 1) {
                leimaukset.removeChild(leimaukset.lastElementChild);
            }

            // luodaan tyhjä rivi tilalle
            _luoLeimausrivi();
            let rastikentta = document.getElementById("leimaus_0_rasti");
            rastikentta.oldvalue = "";

            // while (_datalist.childElementCount > 0) {
            //     _datalist.removeChild(_datalist.lastElementChild);
            // }

            //nollataan leimausten määrät
            _rastiMap.forEach((v, k) => {
                _rastiMap.set(k, 0);
            });

            //lisätään datalistiin puuttuvat rastit
            _luoRastiDatalist(_datalist);
        }

        return {
            luoLomake: luoLomake,
            paivitaLomake: paivitaLomake,
            tyhjennaLomake: _tyhjennaLomake,
            poistaRastiDatalistista: _poistaRastiDatalistista,
            scroll: _scroll
        };

    })(tarkistaja);

    /**
     * Moduli, joka huolehtii lomakkeen kenttien täyttämisestä valitun joukkueen
     * vaihtuessa.
     */
    var tayttaja = (function (rakentaja) {

        /**
         * Täyttää lomakkeen kentät argumenttina ilmoitetun joukkueen tiedoilla.
         * Parametrina annettavan joukkueen id:n on vastattava tietorakenteesta
         * löytyvää joukkuetta.
         * @param {number} joukkueId 
         */
        function taytaKentat(joukkueId) {
            //nollataan lomake 
            rakentaja.tyhjennaLomake();

            let input_nimi = document.getElementById("input_nimi");
            let input_id = document.getElementById("input_id");

            _valittuJoukkue = API.joukkue.haeIdlla(joukkueId);

            input_id.value = _valittuJoukkue.id;
            input_nimi.value = _valittuJoukkue.nimi;

            //täytetään jäsenkentät
            let jasenia = _valittuJoukkue.jasenet.length;
            for (let i = 0; i < jasenia; i++) {
                let jasenInput = document.getElementById(`input_jasen_${i + 1}`);
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
                let valinta = document.getElementById(`input_leimaustapa_${tapa}`);

                valinta.checked = true;
            }

            //haetaan sarja ja valitaan oikea
            let sarjaId = _valittuJoukkue.sarja;
            let sarja = API.sarja.haeIdlla(sarjaId);
            let valinta = document.getElementById(`input_sarja_${sarja.nimi}`);
            valinta.checked = true;

            _taytaLeimausTaulu();
        }

        /**
        * Luo kentät joukkueen leimauksien muokkaamiselle. Leimatun rastin
        * voi vaihtaa toiseksi, aikaleimaa muokata ja rastin poistaa. Leimauksia
        * voi myös lisätä manuaalisesti.
        */
        function _taytaLeimausTaulu() {
            //laitetaan automaattinen rullaus pois päältä
            rakentaja.scroll.disable();

            //haetaan joukkueen leimaamat rastit
            let leimaukset = _valittuJoukkue.rastit;


            //luodaan leimauskenttä jokaista rastia kohden
            for (let i in leimaukset) {
                let leimaus = leimaukset[i];

                //haetaan rastin tiedot, jotta leimatun rastin koodi saadaan selville
                let rastikoodi = (API.rasti.haeIdlla(leimaus.rasti)).koodi;

                _taytaLeimausRivi(i, leimaus, rastikoodi);

                //poistetaan tehdyt leimaukset datalistin vaihtoehdoista
                rakentaja.poistaRastiDatalistista(rastikoodi);

                _rastiMap.set(rastikoodi, _rastiMap.get(rastikoodi) + 1);
            }

            rakentaja.scroll.enable();
        }

        /**
         * Täyttää leimausrivin kentät leimauksen tiedoilla. Argumentteina annettava
         * leimauksen indeksi taulukossa, sekä leimauksen ja rastin tiedot
         * sisältävät objektit.
         * 
         * @param {number} index Leimauksen indeksi joukkueen leimaukset sisältävässä taulukossa
         * @param {object} leimaus Leimauksen tiedot sisältävä objekti
         * @param {string} rastikoodi Leimatun rastin koodi
         */
        function _taytaLeimausRivi(index, leimaus, rastikoodi) {
            let rastikentta = document.getElementById(`leimaus_${index}_rasti`);

            rastikentta.value = rastikoodi;

            let aikakentta = document.getElementById(`leimaus_${index}_aika`);

            if (aikakentta.type === "datetime-local") {
                //normalisoidaan aika jos selain tukee datetime-localia
                aikakentta.value = aikaUtils.normalisoiAikaleima(leimaus.aika);
            } else {
                //muilla selaimilla ei
                aikakentta.value = leimaus.aika;
            }


            /* luodaan input-event, jotta lomake osaa luoda tarvittaessa lisää
            leimauskenttiä */
            var event = new Event('input', {
                bubbles: true,
                cancelable: true,
            });

            rastikentta.dispatchEvent(event);
        }

        return {
            tayta: taytaKentat
        };

    })(rakentaja);


    /**
     * Lomakkeen lähettämisen hoitava moduli.
     */
    var lahettaja = (function (tarkistaja, rakentaja) {

        /**
         * Validoi lomakkeen tiedot ja lisää tai muokkaa joukkueen tiedot tietorakenteeseen,
         * mikäli lomakkeen kentissä ei ole virheitä.
         */
        function _lahetaLomake() {
            //varmistetaan halutaanko poistaa rastileimaukset, palataan jos ei
            if (_poistettavatLeimaukset.size !== 0 &&
                !window.confirm("Valitut rastileimaukset poistetaan pysyvästi.\n" +
                    "Haluatko jatkaa?")) {
                return;
            }

            let kaikkiOk = tarkistaja.tarkistaLomake();
            if (!kaikkiOk) {
                return;
            }

            let form = document.getElementById("form_joukkue");

            let formData = new FormData(form);

            let id = parseInt(formData.get("id"));
            let nimi = formData.get("nimi");
            let jasenet = formData.getAll("jasenet");
            let leimaustapa = formData.getAll("leimaustapa");
            let sarja = parseInt(formData.get("sarja"));
            let div_viestikentta = document.getElementById("form_joukkue_viesti");


            // poistetaan tyhjän jäsenkentän tiedot
            let parsitutJasenet = new Array(0);
            for (let jasen of jasenet) {
                if (jasen.trim() !== "") {
                    parsitutJasenet.push(jasen);
                }
            }

            // päivitetään joukkueen rastileimauksiin muokatut tiedot
            let leimaukset = _paivitaLeimaukset();


            //luodaan tietorakennetta vastaava joukkue-objekti
            let joukkue = {
                nimi: nimi,
                id: id,
                jasenet: parsitutJasenet,
                leimaustapa: leimaustapa,
                sarja: sarja,
                rastit: leimaukset
            };

            //tallennetaan muutokset
            if (id === -1) {
                joukkue = API.joukkue.lisaa(joukkue);
                naytaViesti(`Joukkue ${nimi} on lisätty`);
            } else {
                joukkue = API.joukkue.muokkaa(joukkue);
                naytaViesti(`Joukkueen "${nimi}" tiedot tallenettu`);
            }

            document.getElementById("lisaa_joukkue").scrollIntoView();

            //tyhjennetään lomake
            rakentaja.tyhjennaLomake();

            listaaJoukkueet();

            //näytetään ilmoitus lisäyksen onnistumisesta
            function naytaViesti(viesti) {
                let node = document.createTextNode(viesti);
                div_viestikentta.appendChild(node);
                window.setTimeout(() => {
                    poistaViesti(node);
                }, 3000);
            }

            function poistaViesti(node) {
                if (node === null) {
                    //viesti on jo poistettu
                    return;
                }
                div_viestikentta.removeChild(node);
            }
        }

        /**
         * Päivittää joukkueen rastileimauksiin tehdyt muutokset ja palauttaa
         * joukkueen rasileimaukset taulukkona.
         * 
         * Hakee lomakkeelta tiedon poistettavista sekä muokatuista leimausriveistä.
         * Muokattujen rivien tiedot haetaan lomakkeen kentistä ja muokkaamattomat
         * rivit tallennetaan joukkueen tietoihin sellaisenaan.
         * 
         * Taulukon rivit on täytetty siten, että muokattavan leimausrivin indeksi vastaa
         * joukkueen alkuperäiset rastileimaukset sisältävän taulukon indeksiä.
         * 
         * @returns {Array<object>} Joukkueen rastileimaukset päivitettynä lomakkeen tiedoilla
         */
        function _paivitaLeimaukset() {

            let uudetRastit = new Array(0);

            // jos muokataan aiemmin tallennettua joukkuetta
            if (_valittuJoukkue !== null) {
                var vanhatRastit = _valittuJoukkue.rastit;
            }

            let taulu = document.getElementById("table_leimaukset");
            let rasteja = taulu.childElementCount - 2;

            //käydään leimaukset läpi rivi kerrallaan
            for (let i = 0; i < rasteja; i++) {
                if (_poistettavatLeimaukset.has(i)) {
                    continue;
                }
                //jos riviä on muokattu, haetaan tiedot taulukosta
                if (_muokatutLeimaukset.has(i)) {
                    let rastikentta = document.getElementById(`leimaus_${i}_rasti`);
                    let aikakentta = document.getElementById(`leimaus_${i}_aika`);

                    let aika = aikaUtils.denormalisoiAikaleima(aikakentta.value);
                    let rasti = API.rasti.haeKoodilla(rastikentta.value).id;

                    uudetRastit.push({ aika, rasti });
                } else {
                    //muussa tapauksessa käytetään aiempaa dataa
                    uudetRastit.push(vanhatRastit[i]);
                }
            }

            //järjestetään aikajärjestykseen ennen tallennusta
            uudetRastit.sort((a, b) => {
                return a.aika.localeCompare(b.aika);
            });

            return uudetRastit;
        }

        return {
            laheta: _lahetaLomake
        };
    })(tarkistaja, rakentaja);


    return {
        luoLomake: rakentaja.luoLomake,
        paivitaLomake: rakentaja.paivitaLomake,
        tayta: tayttaja.tayta
    };
})();

/**
 * Luo joukkueista ja joukkueiden jäsenistä kaksitasoisen järjestämättömän listan.
 */
function listaaJoukkueet() {
    let joukkuelista = document.getElementById("joukkuelista");

    while (joukkuelista.childElementCount > 0) {
        joukkuelista.removeChild(joukkuelista.lastElementChild);
    }

    var joukkueet = API.joukkue.haeKaikki();

    joukkueet.sort((a, b) => a.nimi.localeCompare(b.nimi));

    let ul = document.createElement('ul');

    for (let joukkue of joukkueet) {
        let li = document.createElement('li');
        ul.appendChild(li);

        let span = document.createElement('span');
        span.appendChild(document.createTextNode(joukkue.nimi));
        span.className = "jnimi";

        //luodaan jokaiselle riville tapahtumankäsittelijä, jonka avulla lomake
        //täytetään automaattisesti oikeilla tiedoilla
        span.addEventListener("click", ((id) => {
            return function () {
                JOUKKUELOMAKE.tayta(id);
                document.getElementById("lisaa_joukkue").scrollIntoView();
            };
        })(joukkue.id));
        li.appendChild(span);

        let jasenet = joukkue.jasenet;
        jasenet.sort((a, b) => a.localeCompare(b));
        let ul2nd = document.createElement('ul');
        li.appendChild(ul2nd);
        for (let jasen of jasenet) {
            let li2nd = document.createElement('li');
            li2nd.appendChild(document.createTextNode(jasen));
            ul2nd.appendChild(li2nd);
        }
    }

    joukkuelista.appendChild(ul);
}

window.onload = function () {

    leimaustapaForm.lisaa();

    JOUKKUELOMAKE.luoLomake();

    listaaJoukkueet();

    //HTMLInspector.inspect();
};