"use strict";
//@ts-check 
// voit tutkia tarkemmin käsiteltäviä tietorakenteita konsolin kautta 
// tai json-editorin kautta osoitteessa http://jsoneditoronline.org/
// Jos käytät json-editoria niin avaa data osoitteesta:
// http://appro.mit.jyu.fi/tiea2120/vt/vt1/2020/data.json


// Seuraavilla voit tutkia selaimen konsolissa käytössäsi olevaa tietorakennetta. 

//console.log(data);

//console.dir(data);

// voit vapaasti luoda data-rakenteen pohjalta omia aputietorakenteita

// Kirjoita tästä eteenpäin oma ohjelmakoodisi


/** Lisää uuden joukkueen dataan. Parametrina annettava joukkueen tiedot sisältävä
 * objekti, sekä sen sarjan nimi, jossa joukkue kilpailee.
 */
function lisaaJoukkue(data, joukkue, sarja) {
    let sarja_id;

    //etsitään sarjan id nimen perusteella
    for (let s of data.sarjat) {
        if (s.nimi === sarja) {
            sarja_id = s.id;
        }
    }

    //lisätään joukkue vain, jos sarja löytyi
    if (sarja_id === undefined) {
        return;
    }

    joukkue.sarja = sarja_id;

    joukkue.rastit = new Array(0);

    data.joukkueet.push(joukkue);
}


/** Poistaa parametrina annetun nimisestä sarjasta parametrina annetun nimisen joukkueen */
function poistaJoukkue(data, sarja, joukkue) {
    let joukkueet = data.joukkueet;

    let sarja_id;

    for (let s of data.sarjat) {
        if (s.nimi === sarja) {
            sarja_id = s.id;
        }
    }

    //poistetaan joukkue vain, jos sarja löytyi
    if (sarja_id === undefined) {
        return;
    }

    //etsitään annettuja tietoja vastaava alkio ja poistetaan se taulukosta,
    //lopetetaan ensimmäiseen osumaan
    for (let i = 0; i < joukkueet.length; i++) {
        if (joukkueet[i].nimi === joukkue && joukkueet[i].sarja === sarja_id) {
            data.joukkueet.splice(i, 1);
            break;
        }
    }
}


/** Tulostaa kaikkien pisteytettävien rastien koodit puolipisteellä eroteltuna. */
function tulostaRastiKoodit(data) {
    let rastiKoodit = new Array(0);

    //lisätään rastikoodi listaan vain, jos se alkaa numerolla
    data.rastit.forEach(rasti => {
        if (/\d/.test(rasti.koodi[0])) {
            rastiKoodit.push(rasti.koodi);
        }
    });

    rastiKoodit.sort();

    log(rastiKoodit.join(";"));

    log("\n");
}


/**
 * Tulostaa joukkueet aakkosjärjestyksessä
 */
function tulostaJoukkueet(data) {

    let joukkueet = haeJoukkueidenTiedot(data);

    let nimet = joukkueet.map(joukkue => joukkue.nimi);

    //järjestetään nimet aakkosjärjestykseen
    nimet.sort();

    //tulostetaan nimet
    for (let nimi of nimet) {
        log(nimi);
    }

    log("\n");
}


/**
 * Tulostaa joukkueet ja joukkueiden pisteet pisteiden mukaisessa järjestyksessä
 */
function tulostaJoukkueetJaPisteet(data) {

    let joukkueet = haeJoukkueidenTiedot(data);

    //järjestetään taulukko ensisijaisesti pisteiden mukaiseen järjestykseen,
    //toissijaisesti aakkosjärjestykseen
    joukkueet.sort((a, b) => {
        if (b.pisteet - a.pisteet !== 0) {
            return b.pisteet - a.pisteet;
        } else {
            return a.nimi.localeCompare(b.nimi);
        }
    });

    //tulostetaan joukkueiden nimet ja pisteet
    for (let joukkue of joukkueet) {
        log(`${joukkue.nimi} (${joukkue.pisteet} p)`);
    }

    log("\n");
}


/**
 * Tulostaa joukkueiden kaikki tiedot pisteiden mukaisessa järjestyksessä
 */
function tulostaJoukkueidenTiedot(data) {

    let joukkueet = haeJoukkueidenTiedot(data);

    //Järjestetään taulukko ensisijaisesti pisteiden mukaiseen järjestykseen,
    //toissijaisesti käytetyn ajan mukaan. Aika on muodossa "hh:mm:ss", joten
    //sen vertailu onnistuu merkkijonona
    joukkueet.sort((a, b) => {
        if (b.pisteet - a.pisteet !== 0) {
            return b.pisteet - a.pisteet;
        } else if (a.aika.localeCompare(b.aika) !== 0) {
            return a.aika.localeCompare(b.aika);
        } else {
            return a.nimi.localeCompare(b.nimi);
        }
    });

    //tulostetaan joukkueiden tiedot
    for (let joukkue of joukkueet) {
        log(`${joukkue.nimi}, ${joukkue.pisteet} p, ${joukkue.matka} km, ${joukkue.aika} `);
    }

    log("\n");
}

/**
 * Hakee datasta joukkueiden suoritusten kaikki tiedot, palauttaa joukkueiden tiedot taulukossa
 */
function haeJoukkueidenTiedot(data) {
    //luodaan uusi taulukko joukkueiden tallentamista varten
    let joukkueet = new Array(0);

    //luodaan joukkueista ja pisteistä objekteja, lisätään taulukkoon
    data.joukkueet.forEach(joukkue => {
        if (joukkue.hasOwnProperty('nimi')) {
            let rastit = haeLeimatutRastit(joukkue.rastit, data.rastit);

            //lisätään palautettavaan taulukkoon joukkueen suoritus
            joukkueet.push({
                nimi: joukkue.nimi,
                pisteet: laskePisteet(rastit),
                aika: laskeAika(rastit),
                matka: laskeMatka(rastit)
            });
        }
    });

    return joukkueet;
}


/**
 * Hakee joukkueen leimaamien rastien kaikki tiedot. Tiedoista muodostetaan
 * objekti, jotka tallennetaan taulukkoon helpompaa jatkokäsittelyä varten.
 * 
 * Funktio siivoaa pois rastit, jotka on leimattu ennen lähtöä tai maaliin
 * tulon jälkeen, sekä rastit joiden tiedot ovat puutteelliset.
 */
function haeLeimatutRastit(joukkueenRastit, kaikkiRastit) {

    //haetaan valmiiksi kilpailun lähtö- ja maalirastit pisteytettävien
    //rastien rajaamista varten
    let lahtoRasti = haeRastiKoodilla(kaikkiRastit, "LAHTO");
    let maaliRasti = haeRastiKoodilla(kaikkiRastit, "MAALI");

    //palautetaan tyhjä taulukko jos rasteja ei ole määritelty
    if (joukkueenRastit === undefined) {
        return new Array(0);
    }

    //luodaan rasteista uusi taulukko, jotta alkuperäistä taulukkoa ei muuteta
    let rastit = Array.from(joukkueenRastit);

    //järjestetään rastit leimauksen mukaiseen järjestykseen
    rastit.sort((a, b) => a.aika - b.aika);

    //poistetaan taulukosta leimaukset, jotka ovat tapahtuneet aiemmin kuin
    //viimeisin lähtörastin leimaus
    for (let i = rastit.length - 1; i >= 0; i--) {
        if (rastit[i].rasti == lahtoRasti.id) {
            rastit.splice(0, i);
            break;
        }
    }

    //poistetaan taulukosta leimaukset, jotka ovat tapahtuneet myöhemmin kuin
    //ensimmäinen maalirastin leimaus
    for (let i = 0; i < rastit.length; i++) {
        if (rastit[i].rasti == maaliRasti.id) {
            rastit.splice(i + 1, rastit.length - i + 1);
            break;
        }
    }

    //muodostetaan rasteista kaikki relevantti data sisältäviä objekteja ja lisätään taulukkoon
    let rastiObjektit = new Array(0);

    //luodaan joukko, jonka avulla poistetaan rasteista duplikaatit
    let rastiSet = new Set();

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
        let rastiObj = haeRastiIdlla(kaikkiRastit, rastiId);

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
 * Laskee parametrina annetusta rastien hakemistosta joukkueen saamat pisteet
 */
function laskePisteet(rastit) {

    //lasketaan pisteet vain, jos joukkueella on leimattuja rasteja
    if (rastit === undefined || rastit.length === 0) {
        return 0;
    }

    //lasketaan rastien pisteiden yhteissumma
    let summa = 0;

    /* Laskee rastin pisteet rastikoodin ensimmäisen merkin perusteella.
    *  Palauttaa 0 jos ensimmäinen merkki ei ole numero.
    */
    function laskeRastinPisteet(rasti) {
        let pisteet = parseInt(rasti.koodi[0]);

        if (isNaN(pisteet)) {
            return 0;
        }

        return pisteet;
    }

    rastit.forEach(rasti => {
        summa += laskeRastinPisteet(rasti);
    });

    return summa;
}

/** Laskee suoritukseen käytetyn ajan. Leimatut rastit on annettava
 * ajan mukaan järjestettynä siten, että ensimmäinen alkio vastaa
 * lähtörastia ja viimeinen maalirastia.
 */
function laskeAika(rastit) {
    //lasketaan aika vain, jos joukkueella on leimattuja rasteja
    if (rastit === undefined || rastit.length === 0) {
        return "00:00:00";
    }

    //haetaan leimauksista lähtö- ja maaliintuloaika
    let lahtoaika = new Date(rastit[0].aika);
    let maaliaika = new Date(rastit[rastit.length-1].aika);

    //laiskuuksissa lainattu funktio, muunnetaan millisekunnit merkkijonoksi
    function msToTime(duration) {
        var seconds = Math.floor((duration / 1000) % 60),
          minutes = Math.floor((duration / (1000 * 60)) % 60),
          hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
      
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;
      
        return hours + ":" + minutes + ":" + seconds;
      }

    return msToTime(maaliaika.getTime() - lahtoaika.getTime());
}

/** Laskee reitillä kuljetun matkan. Parametrina annettava leimattujen rastien tiedot sisältävä
 * taulukko järjestettynä leimausaikojen mukaisesti.
 */
function laskeMatka(rastit) {
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


/** Etsii datasta joukkueen parametrina annetun nimen perusteella. Palauttaa null jos ei löydy. */
function haeJoukkueNimella(data, nimi) {
    for (let joukkue of data.joukkueet) {
        if (joukkue.nimi === nimi) {
            return joukkue;
        }
    }

    return null;
}

/** Etsii rastin annetun koodin perusteella. Palauttaa null jos ei löydy. */
function haeRastiKoodilla(rastit, rastiKoodi) {
    for (let rasti of rastit) {
        if (rasti.koodi === rastiKoodi) {
            return rasti;
        }
    }

    return null;
}

/** Etsii rastin annetun id:n perusteella. Id annettava kokonaislukuna.
 * Palauttaa null jos ei löydy. */
function haeRastiIdlla(rastit, rastiId) {
    for (let rasti of rastit) {
        if (rasti.id === rastiId) {
            return rasti;
        }
    }

    return null;
}


let joukkue = {
    "nimi": "Mallijoukkue",
    "jasenet": [
        "Tommi Lahtonen",
        "Matti Meikäläinen"
    ],
    "id": 99999
};

lisaaJoukkue(data, joukkue, "8h");

tulostaJoukkueet(data);

tulostaRastiKoodit(data);

log(`----------
Taso 3
----------
`);

poistaJoukkue(data, "8h", "Vara 1");
poistaJoukkue(data, "8h", "Vara 2");
poistaJoukkue(data, "4h", "Vapaat");

tulostaJoukkueetJaPisteet(data);

log(`----------
Taso 5
----------
`);

tulostaJoukkueidenTiedot(data);